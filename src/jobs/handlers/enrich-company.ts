import { db } from '@/lib/db';
import { getDefaultEnrichmentProvider } from '@/providers/enrichment';
import { log } from '@/services/activity.service';

export interface EnrichCompanyPayload {
  companyId: string;
  leadId?: string;
  jobRecordId: string;
}

export async function handleEnrichCompany(payload: EnrichCompanyPayload): Promise<void> {
  const { companyId, leadId, jobRecordId } = payload;

  await db.jobRecord.update({
    where: { id: jobRecordId },
    data: { status: 'RUNNING', startedAt: new Date(), attemptCount: { increment: 1 } },
  });

  if (leadId) {
    await db.lead.update({ where: { id: leadId }, data: { status: 'ENRICHING' } });
  }

  try {
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error('Company not found');

    const provider = getDefaultEnrichmentProvider();
    const result = await provider.enrichCompany({
      name: company.name,
      website: company.website ?? undefined,
      domain: company.domain ?? undefined,
    });

    await db.company.update({
      where: { id: companyId },
      data: {
        description: result.description ?? company.description,
        industry: result.industry ?? company.industry,
        phone: result.phone ?? company.phone,
        linkedinUrl: result.linkedinUrl ?? company.linkedinUrl,
      },
    });

    await db.enrichmentRecord.create({
      data: {
        companyId,
        provider: 'WEBSITE_SCRAPE',
        rawData: result as object,
        status: 'SUCCESS',
      },
    });

    if (leadId) {
      await db.lead.update({ where: { id: leadId }, data: { status: 'ENRICHED' } });
      await log({ type: 'LEAD_ENRICHED', description: 'Company enriched via website scrape', leadId });
    }

    await db.jobRecord.update({
      where: { id: jobRecordId },
      data: { status: 'COMPLETED', completedAt: new Date(), result: result as object },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';

    if (leadId) {
      await db.lead.update({ where: { id: leadId }, data: { status: 'ENRICHMENT_FAILED' } });
    }

    await db.jobRecord.update({
      where: { id: jobRecordId },
      data: { status: 'FAILED', failedAt: new Date(), errorMessage: msg },
    });

    throw err;
  }
}
