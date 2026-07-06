import { db } from '@/lib/db';
import { JOB_TYPES, enqueueJob } from '@/lib/queue';

// Runs on the pg-boss cron tick. Fans out one real sync-replies job (with its
// own JobRecord/jobRecordId) per connected Gmail account, since the cron
// schedule itself has no per-account payload to pass.
export async function handleDispatchSyncReplies(): Promise<void> {
  const integrations = await db.integrationAccount.findMany({
    where: { provider: 'GMAIL', active: true },
    select: { id: true },
  });

  for (const integration of integrations) {
    await enqueueJob(JOB_TYPES.SYNC_REPLIES, { integrationAccountId: integration.id });
  }
}
