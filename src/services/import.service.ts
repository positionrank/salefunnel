import { db } from '@/lib/db';
import { log } from './activity.service';

export interface CsvRow {
  company_name?: string;
  website?: string;
  city?: string;
  state?: string;
  industry?: string;
  contact_name?: string;
  contact_title?: string;
  contact_email?: string;
  notes?: string;
}

export interface ImportResult {
  batchId: string;
  total: number;
  created: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export async function importCsv(rows: CsvRow[], fileName: string, userId?: string): Promise<ImportResult> {
  const batch = await db.importBatch.create({
    data: { fileName, source: 'csv', totalRows: rows.length },
  });

  const errors: Array<{ row: number; error: string }> = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    if (!row.company_name?.trim()) {
      errors.push({ row: i + 1, error: 'Missing company_name' });
      continue;
    }

    try {
      const company = await db.company.create({
        data: {
          name: row.company_name.trim(),
          website: row.website?.trim() || undefined,
          city: row.city?.trim() || undefined,
          state: row.state?.trim() || undefined,
          industry: row.industry?.trim() || undefined,
        },
      });

      let contactId: string | undefined;
      const hasContact = row.contact_name?.trim() || row.contact_email?.trim();
      if (hasContact) {
        const [firstName, ...rest] = (row.contact_name ?? '').split(' ');
        const contact = await db.contact.create({
          data: {
            companyId: company.id,
            firstName: firstName || undefined,
            lastName: rest.join(' ') || undefined,
            fullName: row.contact_name?.trim() || undefined,
            title: row.contact_title?.trim() || undefined,
            email: row.contact_email?.trim() || undefined,
            source: 'CSV_IMPORT',
          },
        });
        contactId = contact.id;
      }

      const lead = await db.lead.create({
        data: {
          companyId: company.id,
          contactId,
          source: 'csv',
          importBatchId: batch.id,
          notes: row.notes?.trim() || undefined,
        },
      });

      await log({ type: 'LEAD_IMPORTED', description: `Imported lead for ${company.name}`, leadId: lead.id, userId });
      created++;
    } catch (err) {
      errors.push({ row: i + 1, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  await db.importBatch.update({
    where: { id: batch.id },
    data: {
      processedRows: created,
      failedRows: errors.length,
      status: errors.length === rows.length ? 'FAILED' : 'COMPLETED',
      completedAt: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    },
  });

  return { batchId: batch.id, total: rows.length, created, failed: errors.length, errors };
}
