import { create } from 'zustand';
import { toast } from 'sonner';

import type {
  CaptureMode,
  FrameId,
  OutputFormat,
  OutputScale,
  ShadowPreset,
  TiltPreset,
  WindowStyle,
} from '@/lib/capture';

export type RunStatus = 'idle' | 'submitting' | 'queued' | 'processing' | 'done' | 'failed';

export interface ResultAsset {
  id: string;
  url: string;
  format: OutputFormat;
  width: number;
  height: number;
  hasWatermark: boolean;
}

interface EditorState {
  url: string;
  frame: FrameId;
  background: string;
  mode: CaptureMode;
  scale: OutputScale;
  format: OutputFormat;
  padding: number;
  shadow: ShadowPreset;
  glow: boolean;
  tilt: TiltPreset;
  windowStyle: WindowStyle;
  scrollY: number;
  outputWidth: number | null;
  outputHeight: number | null;
  customGradient: { colors: string[]; angle: number };

  status: RunStatus;
  jobId: string | null;
  assets: ResultAsset[];
  error: string | null;

  setUrl: (url: string) => void;
  setFrame: (frame: FrameId) => void;
  setBackground: (background: string) => void;
  setMode: (mode: CaptureMode) => void;
  setScale: (scale: OutputScale) => void;
  setFormat: (format: OutputFormat) => void;
  setPadding: (padding: number) => void;
  setShadow: (shadow: ShadowPreset) => void;
  setGlow: (glow: boolean) => void;
  setTilt: (tilt: TiltPreset) => void;
  setWindowStyle: (windowStyle: WindowStyle) => void;
  setScrollY: (scrollY: number) => void;
  setOutputWidth: (outputWidth: number | null) => void;
  setOutputHeight: (outputHeight: number | null) => void;
  setCustomGradient: (g: { colors: string[]; angle: number }) => void;
  /** Apply a bundle of style settings at once (from a one-click template). */
  applyTemplate: (settings: Partial<EditorState>) => void;

  generate: () => Promise<void>;
  reset: () => void;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const POLL_INTERVAL = 1800;
const MAX_POLLS = 80; // ~2.5 minutes

export const useEditorStore = create<EditorState>((set, get) => ({
  url: '',
  frame: 'browser',
  background: 'violet-dream',
  mode: 'viewport',
  scale: 2,
  format: 'png',
  padding: 80,
  shadow: 'medium',
  glow: false,
  tilt: 'none',
  windowStyle: 'light',
  scrollY: 0,
  outputWidth: null,
  outputHeight: null,
  customGradient: { colors: ['#7c3aed', '#06b6d4'], angle: 135 },

  status: 'idle',
  jobId: null,
  assets: [],
  error: null,

  setUrl: (url) => set({ url }),
  setFrame: (frame) => set({ frame }),
  setBackground: (background) => set({ background }),
  setMode: (mode) => set({ mode }),
  setScale: (scale) => set({ scale }),
  setFormat: (format) => set({ format }),
  setPadding: (padding) => set({ padding }),
  setShadow: (shadow) => set({ shadow }),
  setGlow: (glow) => set({ glow }),
  setTilt: (tilt) => set({ tilt }),
  setWindowStyle: (windowStyle) => set({ windowStyle }),
  setScrollY: (scrollY) => set({ scrollY }),
  setOutputWidth: (outputWidth) => set({ outputWidth }),
  setOutputHeight: (outputHeight) => set({ outputHeight }),
  setCustomGradient: (customGradient) => set({ customGradient }),
  applyTemplate: (settings) =>
    // Applying a template changes the look, so drop any shown result back to the
    // live preview.
    set({ ...settings, status: 'idle', jobId: null, assets: [], error: null }),

  reset: () => set({ status: 'idle', jobId: null, assets: [], error: null }),

  generate: async () => {
    const {
      url,
      frame,
      background,
      mode,
      scale,
      format,
      padding,
      shadow,
      glow,
      tilt,
      windowStyle,
      scrollY,
      outputWidth,
      outputHeight,
      customGradient,
      status,
    } = get();
    if (status === 'submitting' || status === 'queued' || status === 'processing') return;

    const trimmed = url.trim();
    if (!trimmed) {
      set({ error: 'Enter a URL to capture.', status: 'failed' });
      toast.error('Enter a URL to capture.');
      return;
    }
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    set({ status: 'submitting', error: null, assets: [], jobId: null });

    let jobId: string;
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalized,
          frame,
          background,
          mode,
          scale,
          format,
          padding,
          shadow,
          glow,
          tilt,
          windowStyle,
          scrollY,
          ...(outputWidth ? { outputWidth } : {}),
          ...(outputHeight ? { outputHeight } : {}),
          ...(background === 'custom' ? { customGradient } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error ?? 'Could not start the capture.';
        set({ status: 'failed', error: message });
        toast.error(message);
        return;
      }
      jobId = data.jobId;
      set({ jobId, status: 'queued' });
    } catch {
      set({ status: 'failed', error: 'Network error — please try again.' });
      return;
    }

    for (let i = 0; i < MAX_POLLS; i++) {
      await delay(POLL_INTERVAL);
      // Bail out if the user reset/started another run.
      if (get().jobId !== jobId) return;
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === 'processing') set({ status: 'processing' });
        if (data.status === 'done') {
          set({ status: 'done', assets: data.assets ?? [] });
          toast.success('Your screenshots are ready!');
          return;
        }
        if (data.status === 'failed') {
          const message = data.error ?? 'The capture failed.';
          set({ status: 'failed', error: message });
          // Failed captures don't cost you a credit — it's refunded automatically.
          toast.error(message, { description: "Your credit wasn't charged." });
          return;
        }
      } catch {
        // transient — keep polling
      }
    }
    set({ status: 'failed', error: 'Timed out waiting for the capture.' });
    toast.error('Timed out waiting for the capture.');
  },
}));
