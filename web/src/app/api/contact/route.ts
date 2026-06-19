import { NextResponse } from 'next/server';
import { z } from 'zod';

import { sendContactMessage, SUPPORT_EMAIL } from '@/lib/email';

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email'),
  topic: z.enum(['General', 'Billing', 'Bug report', 'Feature request']),
  message: z.string().trim().min(10, 'Tell us a little more').max(5000),
  // Honeypot: real users never fill this hidden field.
  company: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid submission' },
      { status: 400 },
    );
  }

  // Silently accept bot submissions (honeypot tripped) without sending.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  const sent = await sendContactMessage({
    name: parsed.data.name,
    email: parsed.data.email,
    topic: parsed.data.topic,
    message: parsed.data.message,
  });

  if (!sent) {
    // Email isn't configured — tell the client to fall back to a mailto link.
    return NextResponse.json(
      { ok: false, fallbackEmail: SUPPORT_EMAIL, error: 'Email is not configured yet.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
