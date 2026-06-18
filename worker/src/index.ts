import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './env';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'snapsaas-worker', uptime: process.uptime() });
});

const server = app.listen(env.PORT, () => {
  console.log(`🛠️  SnapSaas worker listening on http://localhost:${env.PORT}`);
});

// Graceful shutdown so containers (Railway/Fly) recycle cleanly.
function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down worker...`);
  server.close(() => process.exit(0));
  // Force-exit if connections hang.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
