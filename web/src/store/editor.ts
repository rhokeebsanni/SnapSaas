import { create } from 'zustand';
import { toast } from 'sonner';

import type {
  BorderStyle,
  CaptureMode,
  FrameId,
  OutputFormat,
  OutputScale,
  ShadowPreset,
  WindowStyle,
} from '@/lib/capture';
import type { AnimationPresetId } from '@/lib/animation';

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
  shadowOpacity: number | null;
  shadowDirection: number;
  glow: boolean;
  noise: number;
  vignette: number;
  hideMockup: boolean;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  windowStyle: WindowStyle;
  border: BorderStyle;
  borderWidth: number;
  scrollY: number;
  outputWidth: number | null;
  outputHeight: number | null;
  customGradient: { colors: string[]; angle: number };
  // Animation: when on, capture `url` + these frame URLs into an animated GIF.
  animate: boolean;
  animationUrls: string[];
  frameDuration: number;
  // Motion (WAAPI) — a chosen preset + three slider params (0..100) that drive
  // the live preview and (once wired) the deterministic MP4/GIF export. `null`
  // preset = no motion (static export).
  animPreset: AnimationPresetId | null;
  animSpeed: number;
  animIntensity: number;
  animSmoothness: number;

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
  setShadowOpacity: (shadowOpacity: number | null) => void;
  setShadowDirection: (shadowDirection: number) => void;
  setNoise: (noise: number) => void;
  setVignette: (vignette: number) => void;
  setHideMockup: (hideMockup: boolean) => void;
  setRotateX: (rotateX: number) => void;
  setRotateY: (rotateY: number) => void;
  setRotateZ: (rotateZ: number) => void;
  setWindowStyle: (windowStyle: WindowStyle) => void;
  setBorder: (border: BorderStyle) => void;
  setBorderWidth: (borderWidth: number) => void;
  setScrollY: (scrollY: number) => void;
  setOutputWidth: (outputWidth: number | null) => void;
  setOutputHeight: (outputHeight: number | null) => void;
  setCustomGradient: (g: { colors: string[]; angle: number }) => void;
  setAnimate: (animate: boolean) => void;
  setAnimationUrls: (animationUrls: string[]) => void;
  setFrameDuration: (frameDuration: number) => void;
  setAnimPreset: (animPreset: AnimationPresetId | null) => void;
  setAnimSpeed: (animSpeed: number) => void;
  setAnimIntensity: (animIntensity: number) => void;
  setAnimSmoothness: (animSmoothness: number) => void;
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
  shadowOpacity: null,
  shadowDirection: 180,
  glow: false,
  noise: 8,
  vignette: 0,
  hideMockup: false,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  windowStyle: 'light',
  border: 'none',
  borderWidth: 4,
  scrollY: 0,
  outputWidth: null,
  outputHeight: null,
  customGradient: { colors: ['#7c3aed', '#06b6d4'], angle: 135 },
  animate: false,
  animationUrls: [],
  frameDuration: 1200,
  animPreset: null,
  animSpeed: 50,
  animIntensity: 50,
  animSmoothness: 50,

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
  setShadowOpacity: (shadowOpacity) => set({ shadowOpacity }),
  setShadowDirection: (shadowDirection) => set({ shadowDirection }),
  setNoise: (noise) => set({ noise }),
  setVignette: (vignette) => set({ vignette }),
  setHideMockup: (hideMockup) => set({ hideMockup }),
  setRotateX: (rotateX) => set({ rotateX }),
  setRotateY: (rotateY) => set({ rotateY }),
  setRotateZ: (rotateZ) => set({ rotateZ }),
  setWindowStyle: (windowStyle) => set({ windowStyle }),
  setBorder: (border) => set({ border }),
  setBorderWidth: (borderWidth) => set({ borderWidth }),
  setScrollY: (scrollY) => set({ scrollY }),
  setOutputWidth: (outputWidth) => set({ outputWidth }),
  setOutputHeight: (outputHeight) => set({ outputHeight }),
  setCustomGradient: (customGradient) => set({ customGradient }),
  setAnimate: (animate) => set({ animate }),
  setAnimationUrls: (animationUrls) => set({ animationUrls }),
  setFrameDuration: (frameDuration) => set({ frameDuration }),
  setAnimPreset: (animPreset) => set({ animPreset }),
  setAnimSpeed: (animSpeed) => set({ animSpeed }),
  setAnimIntensity: (animIntensity) => set({ animIntensity }),
  setAnimSmoothness: (animSmoothness) => set({ animSmoothness }),
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
      shadowOpacity,
      shadowDirection,
      glow,
      noise,
      vignette,
      hideMockup,
      rotateX,
      rotateY,
      rotateZ,
      windowStyle,
      border,
      borderWidth,
      scrollY,
      outputWidth,
      outputHeight,
      customGradient,
      animate,
      animationUrls,
      frameDuration,
      status,
    } = get();
    if (status === 'submitting' || status === 'queued' || status === 'processing') return;

    const trimmed = url.trim();
    if (!trimmed) {
      set({ error: 'Enter a URL to capture.', status: 'failed' });
      toast.error('Enter a URL to capture.');
      return;
    }
    const normalize = (u: string) =>
      /^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`;
    const normalized = normalize(trimmed);
    // Animation frame URLs: trim, drop blanks, normalize the scheme.
    const cleanedFrameUrls = animationUrls
      .map((u) => u.trim())
      .filter(Boolean)
      .map(normalize);

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
          shadowDirection,
          glow,
          noise,
          vignette,
          hideMockup,
          rotateX,
          rotateY,
          rotateZ,
          windowStyle,
          border,
          borderWidth,
          scrollY,
          ...(shadowOpacity !== null ? { shadowOpacity } : {}),
          ...(outputWidth ? { outputWidth } : {}),
          ...(outputHeight ? { outputHeight } : {}),
          ...(background === 'custom' ? { customGradient } : {}),
          ...(animate && cleanedFrameUrls.length > 0
            ? { animationUrls: cleanedFrameUrls, frameDuration }
            : {}),
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
