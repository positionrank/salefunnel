import { db } from '@/lib/db';
import { createEmailProvider } from '@/providers/email';
import { getValidGmailAccessToken } from '@/lib/gmail-token';
import { JOB_TYPES, enqueueJob } from '@/lib/queue';
import { log } from '@/services/activity.service';

export interface SendEmailPayload {
  draftId: string;
  integrationAccountId: string;
  jobRecordId: string;
}

export async function handleSendEmail(payload: SendEmailPayload): Promise<void> {
  const { draftId, integrationAccountId, jobRecordId } = payload;

  await db.jobRecord.update({
    where: { id: jobRecordId },
    data: { status: 'RUNNING', startedAt: new Date(), attemptCount: { increment: 1 } },
  });

  try {
    const [draft, integration] = await Promise.all([
      db.emailDraft.findUnique({
        where: { id: draftId },
        include: {
          lead: { include: { contact: true } },
          campaignLead: {
            include: {
              followUps: { where: { status: 'PENDING' }, orderBy: { stepNumber: 'asc' }, take: 1 },
            },
          },
        },
      }),
      db.integrationAccount.findUnique({ where: { id: integrationAccountId } }),
    ]);

    if (!draft) throw new Error('Draft not found');
    if (!integration) throw new Error('Integration account not found');
    if (!draft.lead.contact?.email) throw new Error('Lead has no email address');

    const accessToken = await getValidGmailAccessToken(integrationAccountId);
    const provider = createEmailProvider('gmail', accessToken);

    const result = await provider.send({
      to: draft.lead.contact.email,
      from: integration.accountEmail!,
      subject: draft.subject,
      bodyText: draft.bodyText,
      bodyHtml: draft.bodyHtml ?? undefined,
    });

    const message = await db.emailMessage.create({
      data: {
        draftId,
        integrationAccountId,
        provider: 'GMAIL',
        providerMessageId: result.providerMessageId,
        providerThreadId: result.providerThreadId,
        toEmail: draft.lead.contact.email,
        fromEmail: integration.accountEmail!,
        subject: draft.subject,
        bodyText: draft.bodyText,
        bodyHtml: draft.bodyHtml,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    await db.emailDraft.update({ where: { id: draftId }, data: { status: 'SENT' } });
    await db.trackingEvent.create({ data: { messageId: message.id, type: 'SENT' } });

    await log({ type: 'EMAIL_SENT', description: `Email sent to ${draft.lead.contact.email}`, leadId: draft.leadId });

    if (draft.campaignLeadId) {
      await enqueueJob(JOB_TYPES.SCHEDULE_FOLLOWUPS, { campaignLeadId: draft.campaignLeadId, sentMessageId: message.id });
    }

    await db.jobRecord.update({
      where: { id: jobRecordId },
      data: { status: 'COMPLETED', completedAt: new Date(), result: { messageId: message.id } },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';

    if (draftId) {
      await db.emailDraft.update({ where: { id: draftId }, data: { status: 'FAILED' } }).catch(() => {});
    }

    await db.jobRecord.update({
      where: { id: jobRecordId },
      data: { status: 'FAILED', failedAt: new Date(), errorMessage: msg },
    });

    throw err;
  }
}
