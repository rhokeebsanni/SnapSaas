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
  shadowOpacity: z.number().min(0).max(100).optional(),
  shadowDirection: z.number().min(0).max(360).default(180),
  glow: z.boolean().default(false),
  hideMockup: z.boolean().default(false),
  rotateX: z.number().min(-60).max(60).default(0),
  rotateY: z.number().min(-60).max(60).default(0),
  rotateZ: z.number().min(-180).max(180).default(0),
  windowStyle: z
    .enum(['light', 'dark', 'glass', 'glass-dark', 'inset', 'inset-dark'])
    .default('light'),
  border: z.enum(['none', 'light', 'dark']).default('none'),
  borderWidth: z.number().min(1).max(24).default(4),
  customGradient: z
    .object({
      colors: z
        .array(z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/))
        .min(2)
        .max(4),
      angle: z.number().min(0).max(360),
    })
    .optional(),
  scrollY: z.number().min(0).max(20000).default(0),
  outputWidth: z.number().min(200).max(4000).optional(),
  outputHeight: z.number().min(200).max(4000).optional(),
  viewportWidth: z.number().min(320).max(2560).optional(),
  viewportHeight: z.number().min(320).max(4000).optional(),
});

export type CaptureSettingsInput = z.infer<typeof captureSettingsSchema>;
