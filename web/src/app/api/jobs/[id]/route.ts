import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { asset, job } from '@/db/schema';
import { getServerSession } from '@/lib/session';

export async function GET(_request: Request, ctx: RouteContext<'/api/jobs/[id]'>) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  const rows = await db.select().from(job).where(eq(job.id, id)).limit(1);
  const found = rows[0];
  if (!found || found.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const assets =
    found.status === 'done' ? await db.select().from(asset).where(eq(asset.jobId, id)) : [];

  return NextResponse.json({
    id: found.id,
    projectId: found.projectId,
    status: found.status,
    error: found.error,
    settings: found.settings,
    assets: assets.map((a) => ({
      id: a.id,
      url: a.url,
      format: a.format,
      width: a.width,
      height: a.height,
      hasWatermark: a.hasWatermark,
    })),
  });
}
