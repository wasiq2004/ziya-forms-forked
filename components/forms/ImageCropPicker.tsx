'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, X, Move, Trash2 } from 'lucide-react';

type CropPoint = { x: number; y: number };

type ImageCropPickerProps = {
  label: string;
  description?: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  aspectRatio: number;
  buttonLabel: string;
  uploadScope: 'forms/banners' | 'users/avatars';
  entityId?: string;
  emptyLabel?: string;
  cropTitle?: string;
  cropHint?: string;
  previewClassName?: string;
  className?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function ImageCropPicker({
  label,
  description,
  value,
  onChange,
  aspectRatio,
  buttonLabel,
  uploadScope,
  entityId,
  emptyLabel = 'No image selected yet.',
  cropTitle = 'Adjust image',
  cropHint = 'Drag to move, use the slider to zoom, then save.',
  previewClassName = '',
  className = '',
}: ImageCropPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    origin: CropPoint;
  } | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(value || null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<CropPoint>({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setPreviewImage(value || null);
  }, [value]);

  useEffect(() => {
    if (!sourceImage || !isOpen) {
      return;
    }

    const image = new window.Image();
    image.onload = () => {
      imageRef.current = image;
      setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
      setZoom(1);

      window.requestAnimationFrame(() => {
        const viewport = viewportRef.current;

        if (!viewport) {
          return;
        }

        const rect = viewport.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return;
        }

        const fitScale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
        setBaseScale(fitScale);

        const displayWidth = image.naturalWidth * fitScale;
        const displayHeight = image.naturalHeight * fitScale;

        setPan({
          x: (rect.width - displayWidth) / 2,
          y: (rect.height - displayHeight) / 2,
        });
      });
    };

    image.src = sourceImage;
  }, [sourceImage, isOpen]);

  const displayStyle = useMemo(() => {
    if (!imageRef.current || !naturalSize.width || !naturalSize.height) {
      return {};
    }

    const width = naturalSize.width * baseScale * zoom;
    const height = naturalSize.height * baseScale * zoom;

    return {
      width,
      height,
      transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
    };
  }, [baseScale, naturalSize.height, naturalSize.width, pan.x, pan.y, zoom]);

  const clampPan = (nextPan: CropPoint, nextZoom = zoom) => {
    const viewport = viewportRef.current;

    if (!viewport || !imageRef.current) {
      return nextPan;
    }

    const rect = viewport.getBoundingClientRect();
    const displayWidth = naturalSize.width * baseScale * nextZoom;
    const displayHeight = naturalSize.height * baseScale * nextZoom;

    return {
      x: clamp(nextPan.x, rect.width - displayWidth, 0),
      y: clamp(nextPan.y, rect.height - displayHeight, 0),
    };
  };

  const handleFileSelection = (file?: File | null) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(String(reader.result || ''));
      setIsOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!imageRef.current) {
      return;
    }

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      origin: pan,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) {
      return;
    }

    const nextPan = {
      x: dragStateRef.current.origin.x + (event.clientX - dragStateRef.current.startX),
      y: dragStateRef.current.origin.y + (event.clientY - dragStateRef.current.startY),
    };

    setPan(clampPan(nextPan));
  };

  const handlePointerUp = () => {
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleZoom = (nextZoom: number) => {
    const clampedZoom = clamp(nextZoom, 1, 3);
    setZoom(clampedZoom);
    setPan((current) => clampPan(current, clampedZoom));
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      const image = imageRef.current;
      const viewport = viewportRef.current;

      if (!image || !viewport) {
        setPreviewImage(sourceImage);
        onChange(sourceImage);
        setIsOpen(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = Math.round(canvas.width / aspectRatio);

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Unable to crop image');
      }

      const scale = baseScale * zoom;
      const sourceX = clamp((-pan.x) / scale, 0, image.naturalWidth);
      const sourceY = clamp((-pan.y) / scale, 0, image.naturalHeight);
      const sourceWidth = Math.min(image.naturalWidth - sourceX, canvas.width / scale);
      const sourceHeight = Math.min(image.naturalHeight - sourceY, canvas.height / scale);

      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((nextBlob) => resolve(nextBlob), 'image/jpeg', 0.92);
      });

      if (!blob) {
        throw new Error('Unable to process image');
      }

      const payload = new FormData();
      payload.append('file', new File([blob], 'crop.jpg', { type: 'image/jpeg' }));
      payload.append('scope', uploadScope);
      if (entityId) {
        payload.append('entityId', entityId);
      }
      if (previewImage) {
        payload.append('previousUrl', previewImage);
      }

      const response = await fetch('/api/uploads/image', {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      setPreviewImage(data.url);
      onChange(data.url);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save image:', error);
      alert((error as Error).message || 'Failed to save image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewImage(null);
    setSourceImage(null);
    imageRef.current = null;
    onChange(null);
  };

  return (
    <div className={className}>
      <div className="mb-3">
        <p className="text-sm font-semibold text-[color:var(--foreground)]">{label}</p>
        {description && <p className="text-sm text-[color:var(--muted-foreground)]">{description}</p>}
      </div>

      <div
        className={[
          'relative overflow-hidden border border-dashed border-[color:var(--border)]  bg-[color:var(--background)]/60',
          previewClassName,
        ].join(' ')}
        style={{ aspectRatio }}
      >
        {previewImage ? (
          <img src={previewImage} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-[color:var(--muted-foreground)]">
            {emptyLabel}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFileSelection(event.target.files?.[0])}
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="gap-2"
          variant="outline"
        >
          <Upload className="h-4 w-4" />
          {buttonLabel}
        </Button>
        {previewImage && (
          <Button type="button" onClick={handleRemove} variant="ghost" className="gap-2 text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      {isOpen && sourceImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-[color:var(--card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{cropTitle}</h3>
                <p className="text-sm text-[color:var(--muted-foreground)]">{cropHint}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-[color:var(--muted-foreground)] transition hover:bg-[color:var(--background)] hover:text-[color:var(--foreground)] dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <div
                  ref={viewportRef}
                  className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-inner ring-1 ring-slate-200"
                  style={{ aspectRatio, touchAction: 'none' }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  <img
                    src={sourceImage}
                    alt="Crop preview"
                    draggable={false}
                    className={[
                      'absolute left-0 top-0 select-none object-cover',
                      isDragging ? 'cursor-grabbing' : 'cursor-grab',
                    ].join(' ')}
                    style={displayStyle}
                  />
                  <div className="pointer-events-none absolute inset-0 border border-white/20" />
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl bg-[color:var(--background)] p-4 /70">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--foreground)]">
                    <Move className="h-4 w-4" />
                    Position
                  </div>
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    Drag the image left or right until the important part sits inside the banner frame.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                    Zoom
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(event) => handleZoom(Number(event.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSave} isLoading={isUploading}>
                    {isUploading ? 'Saving...' : 'Save image'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
