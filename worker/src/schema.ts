import { z } from 'zod';

export const captureSettingsSchema = z.object({
  url: z.string().url(),
  frame: z.enum(['browser', 'macbook', 'iphone']),
  background: z.string().min(1),
  mode: z.enum(['full', 'viewport']).default('viewport'),
  scale: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  padding: z.number().min(0).max(400).default(80),
  format: z.enum(['png', 'jpeg', 'webp']).default('png'),
  watermark: z.boolean().default(true),
  shadow: z.enum(['none', 'soft', 'medium', 'dramatic']).default('medium'),
  glow: z.boolean().default(false),
  tilt: z.enum(['none', 'left', 'right']).default('none'),
  windowStyle: z.enum(['light', 'dark']).default('light'),
  viewportWidth: z.number().min(320).max(2560).optional(),
  viewportHeight: z.number().min(320).max(4000).optional(),
});

export type CaptureSettingsInput = z.infer<typeof captureSettingsSchema>;
