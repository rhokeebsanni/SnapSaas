'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageOff, LoaderCircle, RotateCcw, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import type { CaptureSummary } from '@/lib/projects';

const STATUS_LABEL: Record<string, { label: string; variant: 'secondary' | 'brand' | 'outline' }> =
  {
    done: { label: 'Ready', variant: 'brand' },
    processing: { label: 'Rendering', variant: 'secondary' },
    queued: { label: 'Queued', variant: 'secondary' },
    failed: { label: 'Failed', variant: 'outline' },
  };

export function CaptureCard({ capture }: { capture: CaptureSummary }) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);
  const status = STATUS_LABEL[capture.status] ?? STATUS_LABEL.queued;

  async function onDelete() {
    setDeleting(true);
    const res = await fetch(`/api/projects/${capture.projectId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Capture deleted.');
      router.refresh();
    } else {
      setDeleting(false);
      toast.error('Could not delete that capture.');
    }
  }

  return (
    <div className="bg-card group overflow-hidden rounded-xl border">
      <div className="bg-muted relative aspect-[16/10] overflow-hidden">
        {capture.thumbnailUrl ? (
          <a href={capture.thumbnailUrl} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capture.thumbnailUrl}
              alt={capture.name}
              className="size-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          </a>
        ) : (
          <div className="text-muted-foreground grid size-full place-items-center">
            {capture.status === 'failed' ? (
              <ImageOff className="size-7" />
            ) : (
              <LoaderCircle className="size-6 animate-spin" />
            )}
          </div>
        )}
        <Badge variant={status.variant} className="absolute left-2 top-2">
          {status.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{capture.name}</p>
          <p className="text-muted-foreground text-xs">
            {capture.createdAt.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" asChild title="Re-run">
            <Link href={`/dashboard/editor?url=${encodeURIComponent(capture.sourceUrl)}`}>
              <RotateCcw className="size-4" />
            </Link>
          </Button>
          <ConfirmDialog
            title="Delete this capture?"
            description="This permanently removes the capture and its generated images. This can’t be undone."
            confirmLabel="Delete"
            destructive
            onConfirm={onDelete}
          >
            <Button
              variant="ghost"
              size="icon"
              disabled={deleting}
              title="Delete"
              className="text-muted-foreground hover:text-destructive"
            >
              {deleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </ConfirmDialog>
        </div>
      </div>
    </div>
  );
}
