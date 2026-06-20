import { z } from 'zod';

export type FrameId = 'browser' | 'macbook' | 'iphone';
export type CaptureMode = 'full' | 'viewport';
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type OutputScale = 1 | 2 | 3;
export type ShadowPreset = 'none' | 'soft' | 'medium' | 'dramatic';
export type TiltPreset = 'none' | 'left' | 'right';
export type WindowStyle = 'light' | 'dark';
export type BorderStyle = 'none' | 'light' | 'dark';

/**
 * Settings accepted from the editor. Kept in sync with the worker's schema; the
 * web layer is the trust boundary, so we validate strictly here and clamp the
 * privileged fields (scale, watermark) against the user's plan before queuing.
 */
export const captureSettingsSchema = z.object({
  url: z.string().url(),
  frame: z.enum(['browser', 'macbook', 'iphone']),
  background: z.string().min(1).max(64),
  mode: z.enum(['full', 'viewport']).default('viewport'),
  scale: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  padding: z.number().int().min(0).max(400).default(80),
  format: z.enum(['png', 'jpeg', 'webp']).default('png'),
  shadow: z.enum(['none', 'soft', 'medium', 'dramatic']).default('medium'),
  glow: z.boolean().default(false),
  tilt: z.enum(['none', 'left', 'right']).default('none'),
  windowStyle: z.enum(['light', 'dark']).default('light'),
  // A border drawn around the framed device. Width/radius in logical px.
  border: z.enum(['none', 'light', 'dark']).default('none'),
  borderWidth: z.number().int().min(1).max(24).default(4),
  // When `background` is "custom", this defines the user-built gradient: 2–4 hex
  // color stops and an angle in degrees.
  customGradient: z
    .object({
      colors: z
        .array(z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/))
        .min(2)
        .max(4),
      angle: z.number().int().min(0).max(360),
    })
    .optional(),
  // Pixels to scroll down before capturing (viewport mode only), so users can
  // grab a section further down the page instead of just the top.
  scrollY: z.number().int().min(0).max(20000).default(0),
  // Optional exact output dimensions (logical px). When set, the final
  // composition is fit into this canvas (no distortion); when omitted the size
  // is derived from the frame + padding.
  outputWidth: z.number().int().min(200).max(4000).optional(),
  outputHeight: z.number().int().min(200).max(4000).optional(),
  viewportWidth: z.number().int().min(320).max(2560).optional(),
  viewportHeight: z.number().int().min(320).max(4000).optional(),
});

/** Settings as accepted from the client (no watermark — that's plan-derived). */
export type CaptureSettingsInput = z.infer<typeof captureSettingsSchema>;

/** Full settings stored on the job + sent to the worker (watermark resolved). */
export interface CaptureSettings extends CaptureSettingsInput {
  watermark: boolean;
}

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export const CAPTURE_QUEUE_NAME = 'snapsaas-capture';

/** Payload enqueued onto BullMQ. The worker re-reads settings from the DB row. */
export interface CaptureJobData {
  jobId: string;
}
