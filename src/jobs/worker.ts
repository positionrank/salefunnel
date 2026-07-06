import 'dotenv/config';
import { createServer } from 'http';
import { getQueue, JOB_TYPES } from '@/lib/queue';
import { handleEnrichCompany, type EnrichCompanyPayload } from './handlers/enrich-company';
import { handleGeneratePersonalization, type GeneratePersonalizationPayload } from './handlers/generate-personalization';
import { handleGenerateDraft, type GenerateDraftPayload } from './handlers/generate-draft';
import { handleSendEmail, type SendEmailPayload } from './handlers/send-email';
import { handleScheduleFollowUps, type ScheduleFollowUpsPayload } from './handlers/schedule-followups';
import { handleSyncReplies, type SyncRepliesPayload } from './handlers/sync-replies';
import { handleDispatchSyncReplies } from './handlers/dispatch-sync-replies';

function startHealthServer() {
  const port = Number(process.env.PORT) || 8080;
  createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
  }).listen(port, () => {
    console.log(`[worker] Health check server listening on ${port}`);
  });
}

async function startWorker() {
  // Cloud Run requires a listener on $PORT to consider the container healthy;
  // the actual work here is the pg-boss handlers below, not HTTP traffic.
  startHealthServer();

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

  await boss.work(JOB_TYPES.SYNC_REPLIES_DISPATCH, async () => {
    console.log(`[worker] Processing ${JOB_TYPES.SYNC_REPLIES_DISPATCH}`);
    await handleDispatchSyncReplies();
  });

  // Every 15 minutes, fan out a real sync-replies job per connected Gmail
  // account (see dispatch-sync-replies.ts — this tick has no per-account
  // payload of its own to pass sync-replies directly).
  await boss.schedule(JOB_TYPES.SYNC_REPLIES_DISPATCH, '*/15 * * * *', {});

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
