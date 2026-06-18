import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { project } from '@/db/schema';
import { getServerSession } from '@/lib/session';

export async function DELETE(_request: Request, ctx: RouteContext<'/api/projects/[id]'>) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Deleting the project cascades to its jobs + assets rows.
  const deleted = await db
    .delete(project)
    .where(and(eq(project.id, id), eq(project.userId, session.user.id)))
    .returning({ id: project.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
