import PgBoss from 'pg-boss';
import { db } from '@/lib/db';

export const JOB_TYPES = {
  ENRICH_COMPANY: 'enrich-company',
  GENERATE_PERSONALIZATION: 'generate-personalization',
  GENERATE_DRAFT: 'generate-draft',
  SEND_EMAIL: 'send-email',
  SCHEDULE_FOLLOWUPS: 'schedule-followups',
  SYNC_REPLIES: 'sync-replies',
  SYNC_REPLIES_DISPATCH: 'sync-replies-dispatch',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

let boss: PgBoss | null = null;

export async function getQueue(): Promise<PgBoss> {
  if (boss) return boss;
  const instance = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
    deleteAfterDays: 14,
    monitorStateIntervalSeconds: 30,
  });
  await instance.start();
  // send()/work()/schedule() never create their queue (pg-boss v10 partitions
  // the job table per queue and requires createQueue() first) — nothing else
  // in this codebase called it, so every job type's queue never existed and
  // send() was silently failing for all of them since this ever shipped.
  // createQueue() is a no-op (ON CONFLICT DO NOTHING) if it already exists.
  for (const type of Object.values(JOB_TYPES)) {
    await instance.createQueue(type);
  }
  boss = instance;
  return boss;
}

// Creates the JobRecord row handlers track progress against, then hands the
// job to pg-boss. Used by /api/jobs for manual triggers and by handlers/
// services that chain the next pipeline step automatically.
export async function enqueueJob(type: JobType, payload: Record<string, unknown>) {
  const jobRecord = await db.jobRecord.create({ data: { type, payload: payload as object } });
  const activeBoss = await getQueue();
  await activeBoss.send(type, { ...payload, jobRecordId: jobRecord.id });
  return jobRecord;
}
