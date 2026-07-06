import { db } from '@/lib/db';
import { getAIProvider } from '@/providers/ai';
import { log } from '@/services/activity.service';
import { JOB_TYPES, enqueueJob } from '@/lib/queue';

export interface GenerateDraftPayload {
  leadId: string;
  campaignLeadId: string;
  sequenceId: string;
  templateId: string;
  jobRecordId: string;
  senderName?: string;
}

export async function handleGenerateDraft(payload: GenerateDraftPayload): Promise<void> {
  const { leadId, campaignLeadId, sequenceId, templateId, jobRecordId, senderName } = payload;

  await db.jobRecord.update({
    where: { id: jobRecordId },
    data: { status: 'RUNNING', startedAt: new Date(), attemptCount: { increment: 1 } },
  });

  try {
    const [lead, sequence, template] = await Promise.all([
      db.lead.findUnique({
        where: { id: leadId },
        include: {
          company: true,
          contact: true,
          personalizationRecord: true,
        },
      }),
      db.campaignSequence.findUnique({ where: { id: sequenceId }, include: { campaign: true } }),
      db.emailTemplate.findUnique({ where: { id: templateId } }),
    ]);

    if (!lead) throw new Error('Lead not found');
    if (!sequence) throw new Error('Sequence not found');
    if (!template) throw new Error('Template not found');
    if (!lead.personalizationRecord) throw new Error('Personalization not yet generated for this lead');

    const p = lead.personalizationRecord;

    const ai = getAIProvider();
    const draft = await ai.generateDraft({
      personalization: {
        companySummary: p.companySummary ?? '',
        painPoints: p.painPoints,
        outreachAngle: p.outreachAngle ?? '',
        icebreaker: p.icebreaker ?? undefined,
        fitSummary: p.fitSummary ?? '',
        subjectSuggestions: p.subjectSuggestions,
        dataQualityNotes: p.dataQualityNotes ?? undefined,
        confidence: 0.8,
      },
      template: { subject: template.subject, bodyText: template.bodyText },
      contact: {
        firstName: lead.contact?.firstName ?? undefined,
        lastName: lead.contact?.lastName ?? undefined,
        title: lead.contact?.title ?? undefined,
        email: lead.contact?.email ?? undefined,
      },
      company: {
        name: lead.company.name,
        website: lead.company.website ?? undefined,
        industry: lead.company.industry ?? undefined,
      },
      stepNumber: sequence.stepNumber,
      senderName,
    });

    const created = await db.emailDraft.create({
      data: {
        leadId,
        campaignLeadId,
        sequenceId,
        templateId,
        subject: draft.subject,
        bodyText: draft.bodyText,
        bodyHtml: draft.bodyHtml,
        status: 'GENERATED',
        aiGenerated: true,
        aiModel: ai.model,
        aiPromptSnapshot: { leadId, sequenceId, templateId },
      },
    });

    await log({ type: 'DRAFT_GENERATED', description: `Draft generated for step ${sequence.stepNumber}`, leadId });

    if (sequence.campaign.autoSend) {
      const integration = await db.integrationAccount.findUnique({
        where: { userId_provider: { userId: sequence.campaign.createdByUserId, provider: 'GMAIL' } },
      });

      if (integration?.active) {
        await db.emailDraft.update({ where: { id: created.id }, data: { status: 'APPROVED', reviewedAt: new Date() } });
        await log({ type: 'DRAFT_APPROVED', description: 'Auto-approved (campaign auto-send enabled)', leadId });
        await enqueueJob(JOB_TYPES.SEND_EMAIL, { draftId: created.id, integrationAccountId: integration.id });
      }
      // else: leave GENERATED — falls into the manual Approvals queue until Gmail is connected.
    }

    await db.jobRecord.update({
      where: { id: jobRecordId },
      data: { status: 'COMPLETED', completedAt: new Date() },
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
