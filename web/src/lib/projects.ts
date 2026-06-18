import 'server-only';

import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import { asset, job, project } from '@/db/schema';
import type { JobStatus } from '@/lib/capture';

export interface CaptureSummary {
  jobId: string;
  projectId: string;
  name: string;
  sourceUrl: string;
  status: JobStatus;
  createdAt: Date;
  thumbnailUrl: string | null;
}

/** Most recent captures for a user, with a PNG thumbnail when available. */
export async function getRecentCaptures(userId: string, limit = 48): Promise<CaptureSummary[]> {
  const rows = await db
    .select({
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      projectId: project.id,
      name: project.name,
      sourceUrl: project.sourceUrl,
    })
    .from(job)
    .innerJoin(project, eq(job.projectId, project.id))
    .where(eq(job.userId, userId))
    .orderBy(desc(job.createdAt))
    .limit(limit);

  const jobIds = rows.map((r) => r.jobId);
  const thumbs = jobIds.length
    ? await db
        .select({ jobId: asset.jobId, url: asset.url })
        .from(asset)
        .where(and(inArray(asset.jobId, jobIds), eq(asset.format, 'png')))
    : [];
  const thumbByJob = new Map(thumbs.map((t) => [t.jobId, t.url]));

  return rows.map((r) => ({
    jobId: r.jobId,
    projectId: r.projectId,
    name: r.name,
    sourceUrl: r.sourceUrl,
    status: r.status as JobStatus,
    createdAt: r.createdAt,
    thumbnailUrl: thumbByJob.get(r.jobId) ?? null,
  }));
}
