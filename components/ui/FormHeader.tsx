'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Eye, Save, Download, Link as LinkIcon, Settings } from 'lucide-react';

export default function FormHeader({
  title,
  showBackButton = true,
  showPreviewButton = false,
  showPublishButton = false,
  showEmbedButton = false,
  showCopyLinkButton = false,
  showSaveButton = false,
  showExportButtons = false,
  showSettingsButton = false,
  onPreview,
  onPublish,
  onCopyEmbed,
  onCopyLink,
  onSave,
  onExportCSV,
  onExportExcel: _onExportExcel,
  onSettings,
  isSaving = false,
  isPublishing = false,
  isPublished = false,
  responsesCount = 0,
  embedUrl: _embedUrl = '',
}: {
  title: string;
  showBackButton?: boolean;
  showPreviewButton?: boolean;
  showPublishButton?: boolean;
  showEmbedButton?: boolean;
  showCopyLinkButton?: boolean;
  showSaveButton?: boolean;
  showExportButtons?: boolean;
  showSettingsButton?: boolean;
  onPreview?: () => void;
  onPublish?: () => void;
  onCopyEmbed?: () => void;
  onCopyLink?: () => void;
  onSave?: () => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onSettings?: () => void;
  isSaving?: boolean;
  isPublishing?: boolean;
  isPublished?: boolean;
  responsesCount?: number;
  embedUrl?: string;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--card)]/95 text-[color:var(--foreground)] shadow-sm backdrop-blur /90">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {showBackButton && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="rounded-full border border-[color:var(--border)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/70 dark:hover:bg-[color:var(--card)]/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            )}
            <h1 className="truncate text-lg font-bold text-[color:var(--foreground)] sm:text-xl">{title}</h1>
            {responsesCount > 0 && (
              <span className="text-sm text-[color:var(--muted-foreground)]">
                {responsesCount} {responsesCount === 1 ? 'response' : 'responses'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showPublishButton && onPublish && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPublish}
                className="rounded-full border-[color:var(--primary)] text-[color:var(--primary)]"
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
                className="rounded-full"
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
                className="rounded-full"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Embed
              </Button>
            )}
            {showPreviewButton && onPreview && (
              <Button variant="secondary" size="sm" onClick={onPreview} className="rounded-full">
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
                className="rounded-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            )}
            {showSettingsButton && onSettings && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSettings}
                className="rounded-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            )}
            {showExportButtons && (
              <>
              <Button
                variant="secondary"
                size="sm"
                onClick={onExportCSV}
                disabled={responsesCount === 0}
                className="rounded-full"
              >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                {/* <Button
                  variant="secondary"
                  size="sm"
                  onClick={onExportExcel}
                  disabled={responsesCount === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button> */}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
