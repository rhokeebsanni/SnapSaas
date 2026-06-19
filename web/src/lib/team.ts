import 'server-only';

import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { team, teamInvite, teamMember, user } from '@/db/schema';
import { PLANS } from '@/lib/plans';

/** Seats a Team plan includes (owner + members). */
export const TEAM_SEATS = PLANS.team.limits.seats;

const INVITE_TTL_DAYS = 14;

export interface TeamContext {
  team: typeof team.$inferSelect;
  role: 'owner' | 'member';
  members: { id: string; name: string; email: string; image: string | null; role: string }[];
  seatsUsed: number;
  seatsTotal: number;
  invites: { id: string; email: string; token: string; createdAt: Date }[];
}

/** Resolve the team a user belongs to (as owner or member), with members + invites. */
export async function getTeamContext(userId: string): Promise<TeamContext | null> {
  const rows = await db
    .select({ teamId: user.teamId })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const teamId = rows[0]?.teamId;
  if (!teamId) return null;

  const teams = await db.select().from(team).where(eq(team.id, teamId)).limit(1);
  const t = teams[0];
  if (!t) return null;

  const members = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: teamMember.role,
    })
    .from(teamMember)
    .innerJoin(user, eq(teamMember.userId, user.id))
    .where(eq(teamMember.teamId, teamId));

  const pending = await db
    .select({
      id: teamInvite.id,
      email: teamInvite.email,
      token: teamInvite.token,
      createdAt: teamInvite.createdAt,
    })
    .from(teamInvite)
    .where(and(eq(teamInvite.teamId, teamId), eq(teamInvite.status, 'pending')));

  return {
    team: t,
    role: t.ownerId === userId ? 'owner' : 'member',
    members,
    seatsUsed: members.length,
    seatsTotal: TEAM_SEATS,
    invites: pending,
  };
}

/** Create a team for a Team-plan owner (idempotent — returns the existing one). */
export async function ensureTeam(ownerId: string, ownerName: string): Promise<string> {
  const existing = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.ownerId, ownerId))
    .limit(1);
  if (existing[0]) return existing[0].id;

  const teamId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(team).values({
      id: teamId,
      name: `${ownerName || 'My'}’s Team`,
      ownerId,
      plan: 'team',
    });
    await tx
      .insert(teamMember)
      .values({ id: randomUUID(), teamId, userId: ownerId, role: 'owner' });
    await tx.update(user).set({ teamId, updatedAt: new Date() }).where(eq(user.id, ownerId));
  });
  return teamId;
}

export type InviteResult = { ok: true; token: string } | { ok: false; error: string };

/** Create a pending invite for an email, enforcing the seat limit. */
export async function inviteToTeam(teamId: string, email: string): Promise<InviteResult> {
  const normalized = email.trim().toLowerCase();

  const members = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(eq(teamMember.teamId, teamId));
  const pending = await db
    .select({ id: teamInvite.id, email: teamInvite.email })
    .from(teamInvite)
    .where(and(eq(teamInvite.teamId, teamId), eq(teamInvite.status, 'pending')));

  if (members.length + pending.length >= TEAM_SEATS) {
    return { ok: false, error: `Your team is full (${TEAM_SEATS} seats).` };
  }
  if (pending.some((p) => p.email === normalized)) {
    return { ok: false, error: 'That email already has a pending invite.' };
  }

  const token = randomUUID();
  await db.insert(teamInvite).values({
    id: randomUUID(),
    teamId,
    email: normalized,
    token,
    status: 'pending',
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
  });
  return { ok: true, token };
}

export type AcceptResult = { ok: true; teamId: string } | { ok: false; error: string };

/** Accept an invite as the signed-in user (must match the invited email). */
export async function acceptInvite(
  token: string,
  userId: string,
  userEmail: string,
): Promise<AcceptResult> {
  const rows = await db.select().from(teamInvite).where(eq(teamInvite.token, token)).limit(1);
  const invite = rows[0];
  if (!invite || invite.status !== 'pending') {
    return { ok: false, error: 'This invite is no longer valid.' };
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: 'This invite has expired.' };
  }
  if (invite.email !== userEmail.trim().toLowerCase()) {
    return { ok: false, error: 'This invite was sent to a different email address.' };
  }

  // Re-check seats at accept time.
  const members = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(eq(teamMember.teamId, invite.teamId));
  if (members.length >= TEAM_SEATS) {
    return { ok: false, error: 'This team is already full.' };
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(teamMember)
      .values({ id: randomUUID(), teamId: invite.teamId, userId, role: 'member' });
    await tx
      .update(user)
      .set({ teamId: invite.teamId, updatedAt: new Date() })
      .where(eq(user.id, userId));
    await tx.update(teamInvite).set({ status: 'accepted' }).where(eq(teamInvite.id, invite.id));
  });
  return { ok: true, teamId: invite.teamId };
}

/** Revoke a pending invite (owner action). */
export async function revokeInvite(teamId: string, inviteId: string): Promise<void> {
  await db
    .update(teamInvite)
    .set({ status: 'revoked' })
    .where(and(eq(teamInvite.id, inviteId), eq(teamInvite.teamId, teamId)));
}

/** Remove a member from a team (owner action; can't remove the owner). */
export async function removeMember(
  teamId: string,
  ownerId: string,
  memberId: string,
): Promise<void> {
  if (memberId === ownerId) return; // never remove the owner
  await db.transaction(async (tx) => {
    await tx
      .delete(teamMember)
      .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, memberId)));
    await tx.update(user).set({ teamId: null, updatedAt: new Date() }).where(eq(user.id, memberId));
  });
}
