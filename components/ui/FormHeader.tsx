'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Eye, Save, Download, BarChart3, Link as LinkIcon } from 'lucide-react';

export default function FormHeader({
  title,
  showBackButton = true,
  showPreviewButton = false,
  showPublishButton = false,
  showEmbedButton = false,
  showCopyLinkButton = false,
  showSaveButton = false,
  showExportButtons = false,
  onPreview,
  onPublish,
  onCopyEmbed,
  onCopyLink,
  onSave,
  onExportCSV,
  onExportExcel,
  isSaving = false,
  isPublishing = false,
  isPublished = false,
  responsesCount = 0,
  embedUrl = '',
}: {
  title: string;
  showBackButton?: boolean;
  showPreviewButton?: boolean;
  showPublishButton?: boolean;
  showEmbedButton?: boolean;
  showCopyLinkButton?: boolean;
  showSaveButton?: boolean;
  showExportButtons?: boolean;
  onPreview?: () => void;
  onPublish?: () => void;
  onCopyEmbed?: () => void;
  onCopyLink?: () => void;
  onSave?: () => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  isSaving?: boolean;
  isPublishing?: boolean;
  isPublished?: boolean;
  responsesCount?: number;
  embedUrl?: string;
}) {
  return (
    <div className="gradient-bg text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            )}
            <h1 className="text-xl font-bold">{title}</h1>
            {responsesCount > 0 && (
              <span className="text-sm opacity-90">
                {responsesCount} {responsesCount === 1 ? 'response' : 'responses'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {showPublishButton && onPublish && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPublish}
                className="text-white hover:bg-white/10"
                disabled={isPublishing}
              >
                {isPublishing ? 'Processing...' : (isPublished ? 'Unpublish' : 'Publish')}
              </Button>
            )}
            {showCopyLinkButton && onCopyLink && isPublished && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCopyLink}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            )}
            {showEmbedButton && onCopyEmbed && isPublished && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCopyEmbed}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Embed
              </Button>
            )}
            {showPreviewButton && onPreview && (
              <Button variant="secondary" size="sm" onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            {showSaveButton && onSave && (
              <Button
                onClick={onSave}
                isLoading={isSaving}
                variant="secondary"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            )}
            {showExportButtons && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onExportCSV}
                  disabled={responsesCount === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onExportExcel}
                  disabled={responsesCount === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}