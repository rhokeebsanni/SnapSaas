import 'server-only';

import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

const FROM = process.env.EMAIL_FROM ?? 'SnapSaas <hello@snapsaas.app>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#e5e7eb;padding:32px">
    <div style="max-width:480px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:16px;padding:32px">
      <div style="font-size:20px;font-weight:700;margin-bottom:8px">📸 SnapSaas</div>
      <h1 style="font-size:22px;margin:16px 0">${title}</h1>
      ${body}
      <p style="margin-top:32px;font-size:12px;color:#6b7280">SnapSaas — launch-ready screenshots in seconds.</p>
    </div>
  </body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;margin-top:8px">${label}</a>`;
}

/** Safely send — never let an email failure break the calling request. */
async function send(to: string, subject: string, html: string): Promise<void> {
  const r = getResend();
  if (!r) return;
  try {
    await r.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[email] send failed:', err);
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await send(
    to,
    'Welcome to SnapSaas 🎉',
    layout(
      `Welcome, ${name || 'there'}!`,
      `<p>You're all set. Paste a URL, pick a style, and generate your first launch-ready screenshot.</p>
       ${button(`${APP_URL}/dashboard/editor`, 'Create your first capture')}`,
    ),
  );
}

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  await send(
    to,
    'Verify your email',
    layout(
      'Confirm your email',
      `<p>Click below to verify your email address and secure your SnapSaas account.</p>
       ${button(url, 'Verify email')}`,
    ),
  );
}
