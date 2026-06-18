import { create } from 'zustand';

import type { CaptureMode, FrameId, OutputFormat, OutputScale } from '@/lib/capture';

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

  reset: () => set({ status: 'idle', jobId: null, assets: [], error: null }),

  generate: async () => {
    const { url, frame, background, mode, scale, format, padding, status } = get();
    if (status === 'submitting' || status === 'queued' || status === 'processing') return;

    const trimmed = url.trim();
    if (!trimmed) {
      set({ error: 'Enter a URL to capture.', status: 'failed' });
      return;
    }
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    set({ status: 'submitting', error: null, assets: [], jobId: null });

    let jobId: string;
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, frame, background, mode, scale, format, padding }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        set({ status: 'failed', error: data.error ?? 'Could not start the capture.' });
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
          return;
        }
        if (data.status === 'failed') {
          set({ status: 'failed', error: data.error ?? 'The capture failed.' });
          return;
        }
      } catch {
        // transient — keep polling
      }
    }
    set({ status: 'failed', error: 'Timed out waiting for the capture.' });
  },
}));
