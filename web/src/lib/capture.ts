import { z } from 'zod';

export type FrameId = 'browser' | 'macbook' | 'iphone';
export type CaptureMode = 'full' | 'viewport';
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type OutputScale = 1 | 2 | 3;
export type ShadowPreset = 'none' | 'soft' | 'medium' | 'dramatic';
export type TiltPreset = 'none' | 'left' | 'right';
export type WindowStyle = 'light' | 'dark';

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

export const CAPTURE_QUEUE_NAME = 'snapsaas:capture';

/** Payload enqueued onto BullMQ. The worker re-reads settings from the DB row. */
export interface CaptureJobData {
  jobId: string;
}
