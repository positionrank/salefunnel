import { db } from '@/lib/db';
import { getAIProvider } from '@/providers/ai';
import { log } from '@/services/activity.service';

export interface GeneratePersonalizationPayload {
  leadId: string;
  jobRecordId: string;
}

export async function handleGeneratePersonalization(payload: GeneratePersonalizationPayload): Promise<void> {
  const { leadId, jobRecordId } = payload;

  await db.jobRecord.update({
    where: { id: jobRecordId },
    data: { status: 'RUNNING', startedAt: new Date(), attemptCount: { increment: 1 } },
  });

  try {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        company: { include: { enrichmentRecords: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        contact: true,
      },
    });
    if (!lead) throw new Error('Lead not found');

    const enrichment = lead.company.enrichmentRecords[0]?.rawData as Record<string, unknown> | undefined;

    const ai = getAIProvider();
    const result = await ai.generatePersonalization({
      companyName: lead.company.name,
      website: lead.company.website ?? undefined,
      description: lead.company.description ?? undefined,
      industry: lead.company.industry ?? undefined,
      contactName: lead.contact?.fullName ?? undefined,
      contactTitle: lead.contact?.title ?? undefined,
      enrichmentData: enrichment,
    });

    await db.personalizationRecord.upsert({
      where: { leadId },
      create: {
        leadId,
        companySummary: result.companySummary,
        painPoints: result.painPoints,
        outreachAngle: result.outreachAngle,
        icebreaker: result.icebreaker,
        fitSummary: result.fitSummary,
        subjectSuggestions: result.subjectSuggestions,
        dataQualityNotes: result.dataQualityNotes,
        aiModel: ai.model,
      },
      update: {
        companySummary: result.companySummary,
        painPoints: result.painPoints,
        outreachAngle: result.outreachAngle,
        icebreaker: result.icebreaker,
        fitSummary: result.fitSummary,
        subjectSuggestions: result.subjectSuggestions,
        dataQualityNotes: result.dataQualityNotes,
        aiModel: ai.model,
        generatedAt: new Date(),
      },
    });

    await db.lead.update({ where: { id: leadId }, data: { status: 'READY' } });
    await log({ type: 'DRAFT_GENERATED', description: 'Personalization generated', leadId });

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
