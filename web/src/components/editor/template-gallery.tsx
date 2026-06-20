'use client';

import * as React from 'react';
import { ChevronDown, Lock } from 'lucide-react';

import { LivePreview } from '@/components/editor/live-preview';
import { EDITOR_TEMPLATES, type EditorTemplate } from '@/lib/editor-templates';
import { useEditorStore } from '@/store/editor';
import { cn } from '@/lib/utils';

/**
 * One-click style templates, each shown as a real mini live-preview so users see
 * exactly what they'll get. Doubles as the small-screen showcase (where the full
 * preview can't fit) so mobile users still see what's possible and can pick a
 * look before generating.
 */
export function TemplateGallery({
  allTemplates,
  columns = 3,
  /** Show only this many until "Show more" is tapped (0 = show all). */
  collapsedCount = 4,
}: {
  allTemplates: boolean;
  columns?: 2 | 3;
  collapsedCount?: number;
}) {
  const apply = useEditorStore((s) => s.applyTemplate);
  const [expanded, setExpanded] = React.useState(false);
  const cols = columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3';

  const collapsible = collapsedCount > 0 && EDITOR_TEMPLATES.length > collapsedCount;
  const shown =
    collapsible && !expanded ? EDITOR_TEMPLATES.slice(0, collapsedCount) : EDITOR_TEMPLATES;

  function choose(t: EditorTemplate, locked: boolean) {
    if (locked) return;
    apply(t.settings);
  }

  return (
    <>
      <div className={cn('grid gap-3', cols)}>
        {shown.map((t) => {
          const locked = t.tier === 'pro' && !allTemplates;
          return (
            <button
              key={t.id}
              type="button"
              disabled={locked}
              title={locked ? `${t.name} (Pro)` : t.name}
              onClick={() => choose(t, locked)}
              className={cn(
                'focus-visible:ring-brand/50 group relative overflow-hidden rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2',
                locked ? 'cursor-not-allowed' : 'hover:border-brand/50 hover:shadow-md',
              )}
            >
              <div className="pointer-events-none aspect-[4/3] overflow-hidden">
                {/* Reuse the real preview engine, scaled down to a thumbnail. */}
                <div className="flex h-full w-full items-center justify-center p-1">
                  <LivePreview
                    url="yoursite.com"
                    frame={t.settings.frame}
                    background={t.settings.background}
                    padding={Math.round(t.settings.padding / 3)}
                    shadow={t.settings.shadow}
                    glow={t.settings.glow}
                    tilt={t.settings.tilt}
                    windowStyle={t.settings.windowStyle}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-1 border-t px-2.5 py-1.5">
                <span className="truncate text-xs font-medium">{t.name}</span>
                {t.tier === 'pro' &&
                  (locked ? (
                    <Lock className="text-muted-foreground size-3 shrink-0" />
                  ) : (
                    <span className="text-brand text-[10px] font-semibold">PRO</span>
                  ))}
              </div>
            </button>
          );
        })}
      </div>

      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-muted-foreground hover:text-foreground mt-2 flex w-full items-center justify-center gap-1 text-xs font-medium"
        >
          {expanded ? 'Show fewer' : `Show ${EDITOR_TEMPLATES.length - collapsedCount} more`}
          <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
        </button>
      )}
    </>
  );
}
