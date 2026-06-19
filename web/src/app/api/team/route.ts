import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getServerSession } from '@/lib/session';
import { getAccount } from '@/lib/account';
import { getTeamContext, ensureTeam, inviteToTeam, revokeInvite, removeMember } from '@/lib/team';
import { sendTeamInviteEmail } from '@/lib/email';

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create') }),
  z.object({ action: z.literal('invite'), email: z.string().trim().email() }),
  z.object({ action: z.literal('revoke'), inviteId: z.string().min(1) }),
  z.object({ action: z.literal('remove'), memberId: z.string().min(1) }),
]);

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const body = parsed.data;

  // Only Team-plan subscribers can create a team.
  if (body.action === 'create') {
    const account = await getAccount(session.user.id);
    if (account.plan.id !== 'team') {
      return NextResponse.json(
        { error: 'Upgrade to the Team plan to create a team.' },
        { status: 403 },
      );
    }
    await ensureTeam(session.user.id, session.user.name);
    return NextResponse.json({ ok: true });
  }

  // The remaining actions require an existing team that the user owns.
  const ctx = await getTeamContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: 'You are not in a team.' }, { status: 404 });
  if (ctx.role !== 'owner') {
    return NextResponse.json({ error: 'Only the team owner can do that.' }, { status: 403 });
  }

  if (body.action === 'invite') {
    const result = await inviteToTeam(ctx.team.id, body.email);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const acceptUrl = `${appUrl}/invite/${result.token}`;
    await sendTeamInviteEmail(body.email, session.user.name, ctx.team.name, acceptUrl);
    // Surface the link in the response too, so it works even before email is set up.
    return NextResponse.json({ ok: true, acceptUrl });
  }

  if (body.action === 'revoke') {
    await revokeInvite(ctx.team.id, body.inviteId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'remove') {
    await removeMember(ctx.team.id, session.user.id, body.memberId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
