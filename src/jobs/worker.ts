import 'dotenv/config';
import { getQueue, JOB_TYPES } from '@/lib/queue';
import { handleEnrichCompany, type EnrichCompanyPayload } from './handlers/enrich-company';
import { handleGeneratePersonalization, type GeneratePersonalizationPayload } from './handlers/generate-personalization';
import { handleGenerateDraft, type GenerateDraftPayload } from './handlers/generate-draft';
import { handleSendEmail, type SendEmailPayload } from './handlers/send-email';
import { handleScheduleFollowUps, type ScheduleFollowUpsPayload } from './handlers/schedule-followups';
import { handleSyncReplies, type SyncRepliesPayload } from './handlers/sync-replies';

async function startWorker() {
  console.log('[worker] Starting pg-boss worker...');
  const boss = await getQueue();

  await boss.work<EnrichCompanyPayload>(JOB_TYPES.ENRICH_COMPANY, async (jobs) => {
    const job = jobs[0]!;
    console.log(`[worker] Processing ${JOB_TYPES.ENRICH_COMPANY}`, job.id);
    await handleEnrichCompany(job.data);
  });

  await boss.work<GeneratePersonalizationPayload>(JOB_TYPES.GENERATE_PERSONALIZATION, async (jobs) => {
    const job = jobs[0]!;
    console.log(`[worker] Processing ${JOB_TYPES.GENERATE_PERSONALIZATION}`, job.id);
    await handleGeneratePersonalization(job.data);
  });

  await boss.work<GenerateDraftPayload>(JOB_TYPES.GENERATE_DRAFT, async (jobs) => {
    const job = jobs[0]!;
    console.log(`[worker] Processing ${JOB_TYPES.GENERATE_DRAFT}`, job.id);
    await handleGenerateDraft(job.data);
  });

  await boss.work<SendEmailPayload>(JOB_TYPES.SEND_EMAIL, async (jobs) => {
    const job = jobs[0]!;
    console.log(`[worker] Processing ${JOB_TYPES.SEND_EMAIL}`, job.id);
    await handleSendEmail(job.data);
  });

  await boss.work<ScheduleFollowUpsPayload>(JOB_TYPES.SCHEDULE_FOLLOWUPS, async (jobs) => {
    const job = jobs[0]!;
    console.log(`[worker] Processing ${JOB_TYPES.SCHEDULE_FOLLOWUPS}`, job.id);
    await handleScheduleFollowUps(job.data);
  });

  await boss.work<SyncRepliesPayload>(JOB_TYPES.SYNC_REPLIES, async (jobs) => {
    const job = jobs[0]!;
    console.log(`[worker] Processing ${JOB_TYPES.SYNC_REPLIES}`, job.id);
    await handleSyncReplies(job.data);
  });

  // Schedule periodic reply sync every 15 minutes
  await boss.schedule(JOB_TYPES.SYNC_REPLIES, '*/15 * * * *', {});

  console.log('[worker] All handlers registered. Worker is running.');

  process.on('SIGTERM', async () => {
    console.log('[worker] SIGTERM received, stopping...');
    await boss.stop();
    process.exit(0);
  });
}

startWorker().catch((err) => {
  console.error('[worker] Fatal error:', err);
  process.exit(1);
});
