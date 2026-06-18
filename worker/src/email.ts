import { Resend } from 'resend';

import { env } from './env';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  if (!env.RESEND_API_KEY) return null;
  resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

/** Tell a user their capture is ready. No-op when Resend isn't configured. */
export async function sendAssetsReadyEmail(to: string, name: string): Promise<void> {
  const r = getResend();
  if (!r) return;

  const from = env.EMAIL_FROM ?? 'SnapSaas <hello@snapsaas.app>';
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#e5e7eb;padding:32px">
    <div style="max-width:480px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:16px;padding:32px">
      <div style="font-size:20px;font-weight:700;margin-bottom:8px">📸 SnapSaas</div>
      <h1 style="font-size:22px;margin:16px 0">Your assets are ready, ${name || 'there'}!</h1>
      <p>Your screenshots have finished rendering and are ready to download.</p>
      <a href="${appUrl}/dashboard/projects" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;margin-top:8px">View your captures</a>
    </div>
  </body></html>`;

  try {
    await r.emails.send({ from, to, subject: 'Your SnapSaas assets are ready ✨', html });
  } catch (err) {
    console.error('[email] assets-ready failed:', err);
  }
}
