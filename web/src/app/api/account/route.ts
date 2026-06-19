import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { team, user } from '@/db/schema';
import { getServerSession } from '@/lib/session';
import { auth } from '@/lib/auth';

/**
 * Permanently delete the signed-in user's account. FK cascades remove their
 * sessions, projects, jobs, assets, subscriptions, and team memberships. If the
 * user owns a team, the team (and its memberships/invites) is removed too.
 */
export async function DELETE() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  try {
    // Owned teams cascade-delete their members/invites; member rows for this
    // user elsewhere are removed by the user-delete cascade.
    await db.delete(team).where(eq(team.ownerId, userId));
    await db.delete(user).where(eq(user.id, userId));
  } catch (err) {
    console.error('[account] delete failed:', err);
    return NextResponse.json({ error: 'Could not delete your account.' }, { status: 500 });
  }

  // Best-effort: clear the session cookie so the client is signed out.
  try {
    await auth.api.signOut({ headers: new Headers() });
  } catch {
    /* the user row is already gone; ignore */
  }

  return NextResponse.json({ ok: true });
}
