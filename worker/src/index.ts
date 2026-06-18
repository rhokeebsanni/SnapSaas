import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { env } from './env';
import { captureSettingsSchema } from './schema';
import { renderCapture } from './render';
import { closeBrowser } from './capture/browser';
import { BACKGROUNDS, FRAMES } from './config/templates';
import type { CaptureSettings, OutputFormat } from './types';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function mimeFor(format: OutputFormat): string {
  return format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
}

/** Internal endpoints require the shared secret the web app holds. */
function requireSecret(req: Request, res: Response, next: NextFunction) {
  const provided = req.header('x-internal-secret');
  if (!provided || provided !== env.INTERNAL_API_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'snapsaas-worker', uptime: process.uptime() });
});

/** Public catalog of frames + backgrounds, consumed by the editor UI. */
app.get('/templates', (_req, res) => {
  res.json({ frames: FRAMES, backgrounds: BACKGROUNDS });
});

/**
 * Render a capture synchronously and return the image bytes. In production the
 * BullMQ worker drives `renderCapture` and uploads to R2 (Phase 4); this direct
 * endpoint stays useful for testing and low-volume synchronous rendering.
 */
app.post('/render', requireSecret, async (req: Request, res: Response) => {
  const parsed = captureSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid settings', details: parsed.error.flatten() });
    return;
  }

  try {
    const output = await renderCapture(parsed.data as CaptureSettings);
    res.setHeader('Content-Type', mimeFor(output.format));
    res.setHeader('X-Image-Width', String(output.width));
    res.setHeader('X-Image-Height', String(output.height));
    res.send(output.buffer);
  } catch (err) {
    console.error('[render] failed:', err);
    res.status(502).json({ error: err instanceof Error ? err.message : 'Render failed' });
  }
});

const server = app.listen(env.PORT, () => {
  console.log(`🛠️  SnapSaas worker listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down worker...`);
  await closeBrowser();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
