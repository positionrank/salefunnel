import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { JOB_TYPES, enqueueJob } from '@/lib/queue';
import { z } from 'zod';

const EnqueueSchema = z.object({
  type: z.enum([
    JOB_TYPES.ENRICH_COMPANY,
    JOB_TYPES.GENERATE_PERSONALIZATION,
    JOB_TYPES.GENERATE_DRAFT,
    JOB_TYPES.SEND_EMAIL,
    JOB_TYPES.SCHEDULE_FOLLOWUPS,
    JOB_TYPES.SYNC_REPLIES,
  ]),
  payload: z.record(z.unknown()),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status') ?? undefined;
  const jobs = await db.jobRecord.findMany({
    where: status ? { status: status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DEAD' } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ data: jobs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = EnqueueSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });

  const jobRecord = await enqueueJob(parsed.data.type, parsed.data.payload);

  return NextResponse.json({ data: jobRecord }, { status: 201 });
}
