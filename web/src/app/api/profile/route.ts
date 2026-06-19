import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { user } from '@/db/schema';
import { getServerSession } from '@/lib/session';

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  // Avatar by URL (no upload infra needed). Empty string clears it.
  image: z.string().trim().url('Enter a valid image URL').max(2048).or(z.literal('')).optional(),
});

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { name, image } = parsed.data;
  try {
    await db
      .update(user)
      .set({
        name,
        // `undefined` leaves the avatar unchanged; `''` clears it to null.
        ...(image === undefined ? {} : { image: image === '' ? null : image }),
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));
  } catch (err) {
    console.error('[profile] update failed:', err);
    return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
