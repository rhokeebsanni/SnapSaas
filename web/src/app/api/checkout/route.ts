import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getServerSession } from '@/lib/session';
import { isLemonConfigured, variantFor, createCheckoutUrl } from '@/lib/lemonsqueezy';

const bodySchema = z.object({
  plan: z.enum(['pro', 'team']),
  cycle: z.enum(['monthly', 'yearly']),
});

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isLemonConfigured()) {
    return NextResponse.json({ error: 'Billing is not configured yet.' }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const variantId = variantFor(parsed.data.plan, parsed.data.cycle);
  if (!variantId) {
    return NextResponse.json({ error: 'That plan is not available yet.' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const url = await createCheckoutUrl({
      variantId,
      email: session.user.email,
      userId: session.user.id,
      redirectUrl: `${appUrl}/dashboard?upgraded=1`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error('[checkout] failed:', err);
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 502 });
  }
}
