'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Laptop,
  LoaderCircle,
  Monitor,
  Smartphone,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DeviceFrame, MockSite, type FrameVariant } from '@/components/device-frame';
import { cn } from '@/lib/utils';

const FRAME_OPTIONS: { id: FrameVariant; label: string; icon: React.ElementType }[] = [
  { id: 'browser', label: 'Browser', icon: Monitor },
  { id: 'macbook', label: 'MacBook', icon: Laptop },
  { id: 'iphone', label: 'iPhone', icon: Smartphone },
];

const TONES = ['violet', 'teal', 'amber', 'rose'] as const;

function normalizeHost(input: string): string {
  const trimmed = input.trim().replace(/^https?:\/\//, '');
  const host = trimmed.split('/')[0];
  return host || 'yoursite.com';
}

export function Hero() {
  const [url, setUrl] = React.useState('stripe.com');
  const [variant, setVariant] = React.useState<FrameVariant>('browser');
  const [tone, setTone] = React.useState(0);
  const [generating, setGenerating] = React.useState(false);
  const [shotKey, setShotKey] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function generate(e?: React.FormEvent) {
    e?.preventDefault();
    if (generating) return;
    setGenerating(true);
    timer.current = setTimeout(() => {
      setTone((t) => (t + 1) % TONES.length);
      setShotKey((k) => k + 1);
      setGenerating(false);
    }, 900);
  }

  return (
    <section className="relative overflow-hidden">
      {/* Ambient background */}
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="bg-brand/20 pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="brand" className="mb-5 px-3 py-1">
              <Sparkles className="size-3" />
              Launch-ready screenshots in one click
            </Badge>
          </motion.div>

          <motion.h1
            className="text-balance text-4xl font-bold tracking-tight sm:text-6xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
          >
            Turn any URL into <span className="text-gradient">gorgeous</span> marketing screenshots
          </motion.h1>

          <motion.p
            className="text-muted-foreground mx-auto mt-5 max-w-xl text-pretty text-lg"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            Paste a link, pick a frame and background, and SnapSaas captures your site and drops it
            into a polished mockup — share-ready in seconds. No design tools required.
          </motion.p>

          <motion.form
            onSubmit={generate}
            className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            <div className="relative flex-1">
              <Globe />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yoursite.com"
                aria-label="Website URL"
                className="h-11 pl-9"
                inputMode="url"
              />
            </div>
            <Button type="submit" variant="brand" size="lg" disabled={generating} className="gap-2">
              {generating ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              {generating ? 'Generating' : 'Generate'}
            </Button>
          </motion.form>
          <p className="text-muted-foreground mt-3 text-xs">
            Try it above — then{' '}
            <Link
              href="/sign-up"
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              create a free account
            </Link>{' '}
            to capture your own site.
          </p>
        </div>

        {/* Live preview */}
        <motion.div
          className="mx-auto mt-12 max-w-3xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            {FRAME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVariant(opt.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  variant === opt.id
                    ? 'border-brand/40 bg-brand/10 text-brand'
                    : 'text-muted-foreground hover:bg-accent',
                )}
                aria-pressed={variant === opt.id}
              >
                <opt.icon className="size-4" />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="from-muted/40 to-muted/10 rounded-3xl border bg-gradient-to-br p-6 sm:p-10">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${variant}-${shotKey}`}
                  initial={{ opacity: 0, scale: 0.98, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35 }}
                >
                  <DeviceFrame variant={variant} url={normalizeHost(url)}>
                    <MockSite tone={TONES[tone]} />
                  </DeviceFrame>
                </motion.div>
              </AnimatePresence>

              {generating && (
                <div className="bg-background/40 absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                  <div className="bg-background flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-lg">
                    <LoaderCircle className="text-brand size-4 animate-spin" />
                    Capturing {normalizeHost(url)}…
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-center text-sm">
            <ArrowRight className="size-4" />
            This is a live demo of the framing engine. Real captures happen in the editor.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Globe() {
  return (
    <svg
      className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
