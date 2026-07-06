import { db } from '@/lib/db';
import { log } from './activity.service';
import { JOB_TYPES, enqueueJob } from '@/lib/queue';
import type { LeadStatus } from '@prisma/client';

export interface CreateLeadInput {
  companyId: string;
  contactId?: string;
  source?: string;
  importBatchId?: string;
  notes?: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  search?: string;
  campaignId?: string;
  source?: string;
}

export async function list(filters: LeadFilters = {}) {
  const { status, search, source } = filters;

  return db.lead.findMany({
    where: {
      active: true,
      ...(status ? { status } : {}),
      ...(source ? { source } : {}),
      ...(search
        ? {
            OR: [
              { company: { name: { contains: search, mode: 'insensitive' } } },
              { contact: { email: { contains: search, mode: 'insensitive' } } },
              { contact: { fullName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      company: { select: { id: true, name: true, industry: true, city: true, state: true } },
      contact: { select: { id: true, fullName: true, firstName: true, lastName: true, title: true, email: true } },
      campaignLeads: {
        where: { campaign: { active: true } },
        include: { campaign: { select: { id: true, name: true, status: true } } },
        take: 1,
        orderBy: { addedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getById(id: string) {
  return db.lead.findFirst({
    where: { id, active: true },
    include: {
      company: {
        include: { enrichmentRecords: { orderBy: { createdAt: 'desc' }, take: 3 } },
      },
      contact: true,
      campaignLeads: {
        include: {
          campaign: true,
          followUps: { orderBy: { scheduledAt: 'asc' } },
        },
      },
      personalizationRecord: true,
      emailDrafts: {
        orderBy: { createdAt: 'desc' },
        include: { emailMessage: true, sequence: true },
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { user: { select: { name: true } } },
      },
      leadNotes: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
}

export async function create(input: CreateLeadInput, userId?: string) {
  const lead = await db.lead.create({ data: input });
  await log({ type: 'LEAD_CREATED', description: 'Lead created', leadId: lead.id, userId });
  await enqueueJob(JOB_TYPES.ENRICH_COMPANY, { companyId: lead.companyId, leadId: lead.id });
  return lead;
}

export async function updateStatus(id: string, status: LeadStatus, userId?: string) {
  const lead = await db.lead.update({ where: { id }, data: { status } });
  await log({ type: 'LEAD_ENRICHED', description: `Lead status changed to ${status}`, leadId: id, userId });
  return lead;
}

export async function update(id: string, data: Partial<CreateLeadInput>) {
  return db.lead.update({ where: { id }, data });
}

export async function remove(id: string) {
  return db.lead.update({ where: { id }, data: { active: false, deletedAt: new Date() } });
}

export async function addNote(leadId: string, userId: string, body: string) {
  const note = await db.leadNote.create({ data: { leadId, userId, body } });
  await log({ type: 'NOTE_ADDED', description: 'Note added to lead', leadId, userId });
  return note;
}

export async function getStats() {
  const [total, byStatus, recentReplies] = await Promise.all([
    db.lead.count({ where: { active: true } }),
    db.lead.groupBy({ by: ['status'], where: { active: true }, _count: true }),
    db.lead.count({ where: { active: true, status: 'REPLIED' } }),
  ]);

  return { total, byStatus, recentReplies };
}
