import PgBoss from 'pg-boss';

export const JOB_TYPES = {
  ENRICH_COMPANY: 'enrich-company',
  GENERATE_PERSONALIZATION: 'generate-personalization',
  GENERATE_DRAFT: 'generate-draft',
  SEND_EMAIL: 'send-email',
  SCHEDULE_FOLLOWUPS: 'schedule-followups',
  SYNC_REPLIES: 'sync-replies',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

let boss: PgBoss | null = null;

export async function getQueue(): Promise<PgBoss> {
  if (boss) return boss;
  boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
    deleteAfterDays: 14,
    monitorStateIntervalSeconds: 30,
  });
  await boss.start();
  return boss;
}
