import { db } from '@/lib/db';
import { createEmailProvider } from '@/providers/email';
import { log } from '@/services/activity.service';

export interface SyncRepliesPayload {
  integrationAccountId: string;
  jobRecordId: string;
}

export async function handleSyncReplies(payload: SyncRepliesPayload): Promise<void> {
  const { integrationAccountId, jobRecordId } = payload;

  await db.jobRecord.update({
    where: { id: jobRecordId },
    data: { status: 'RUNNING', startedAt: new Date(), attemptCount: { increment: 1 } },
  });

  try {
    const integration = await db.integrationAccount.findUnique({ where: { id: integrationAccountId } });
    if (!integration?.accessToken) throw new Error('Integration account not found or missing token');

    const provider = createEmailProvider('gmail', integration.accessToken);

    const sentMessages = await db.emailMessage.findMany({
      where: {
        integrationAccountId,
        status: 'SENT',
        providerThreadId: { not: null },
      },
      include: { draft: { include: { campaignLead: true } } },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    let repliesDetected = 0;

    for (const message of sentMessages) {
      if (!message.providerThreadId) continue;

      const thread = await provider.getThread(message.providerThreadId);
      // If the thread has more than one message, a reply was received
      const hasReply = thread.messages.length > 1;

      if (hasReply) {
        const existingReply = await db.trackingEvent.findFirst({
          where: { messageId: message.id, type: 'REPLIED' },
        });
        if (!existingReply) {
          await db.trackingEvent.create({ data: { messageId: message.id, type: 'REPLIED' } });
        }

        if (message.draft.campaignLeadId) {
          await db.campaignLead.update({
            where: { id: message.draft.campaignLeadId },
            data: { repliedAt: new Date(), status: 'COMPLETED' },
          });

          await db.followUpSchedule.updateMany({
            where: { campaignLeadId: message.draft.campaignLeadId, status: 'PENDING' },
            data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: 'reply_detected' },
          });

          if (message.draft.leadId) {
            await db.lead.update({ where: { id: message.draft.leadId }, data: { status: 'REPLIED' } });
            await log({ type: 'REPLY_DETECTED', description: 'Reply detected via Gmail thread sync', leadId: message.draft.leadId });
          }
        }

        repliesDetected++;
      }
    }

    await db.jobRecord.update({
      where: { id: jobRecordId },
      data: { status: 'COMPLETED', completedAt: new Date(), result: { repliesDetected } },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await db.jobRecord.update({
      where: { id: jobRecordId },
      data: { status: 'FAILED', failedAt: new Date(), errorMessage: msg },
    });
    throw err;
  }
}
