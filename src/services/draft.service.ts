import { db } from '@/lib/db';
import { log } from './activity.service';
import { JOB_TYPES, enqueueJob } from '@/lib/queue';
import type { EmailDraftStatus } from '@prisma/client';

export interface CreateDraftInput {
  leadId: string;
  campaignLeadId?: string;
  sequenceId?: string;
  templateId?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  aiGenerated?: boolean;
  aiModel?: string;
  aiPromptSnapshot?: Record<string, unknown>;
}

export async function listPendingApproval() {
  return db.emailDraft.findMany({
    where: { status: { in: ['GENERATED', 'EDITED'] } },
    include: {
      lead: {
        include: {
          company: { select: { name: true, industry: true } },
          contact: { select: { fullName: true, email: true, title: true } },
        },
      },
      sequence: { select: { name: true, stepNumber: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getById(id: string) {
  return db.emailDraft.findUnique({
    where: { id },
    include: {
      lead: { include: { company: true, contact: true, personalizationRecord: true } },
      sequence: true,
      template: true,
      emailMessage: true,
    },
  });
}

export async function create(input: CreateDraftInput, userId?: string) {
  const draft = await db.emailDraft.create({
    data: {
      leadId: input.leadId,
      campaignLeadId: input.campaignLeadId,
      sequenceId: input.sequenceId,
      templateId: input.templateId,
      subject: input.subject,
      bodyText: input.bodyText,
      bodyHtml: input.bodyHtml,
      aiGenerated: input.aiGenerated ?? false,
      aiModel: input.aiModel,
      aiPromptSnapshot: (input.aiPromptSnapshot as object | undefined) ?? undefined,
      status: 'GENERATED',
    },
  });
  await log({ type: 'DRAFT_GENERATED', description: 'Email draft generated', leadId: input.leadId, userId });
  return draft;
}

export async function update(id: string, subject: string, bodyText: string, bodyHtml?: string) {
  return db.emailDraft.update({
    where: { id },
    data: { subject, bodyText, bodyHtml, status: 'EDITED' },
  });
}

export async function approve(id: string, userId: string) {
  const integration = await db.integrationAccount.findUnique({
    where: { userId_provider: { userId, provider: 'GMAIL' } },
  });
  if (!integration?.active) {
    throw new Error('Gmail is not connected — connect it in Settings before approving a draft to send.');
  }

  const draft = await db.emailDraft.update({
    where: { id },
    data: { status: 'APPROVED', reviewedAt: new Date() },
    include: { lead: { include: { contact: true } } },
  });
  await log({ type: 'DRAFT_APPROVED', description: 'Draft approved for sending', leadId: draft.leadId, userId });
  await enqueueJob(JOB_TYPES.SEND_EMAIL, { draftId: draft.id, integrationAccountId: integration.id });
  return draft;
}

export async function reject(id: string, userId: string, reason?: string) {
  const draft = await db.emailDraft.update({
    where: { id },
    data: { status: 'REJECTED', reviewedAt: new Date(), rejectionReason: reason },
  });
  await log({ type: 'DRAFT_REJECTED', description: `Draft rejected${reason ? `: ${reason}` : ''}`, leadId: draft.leadId, userId });
  return draft;
}

export async function markSent(id: string) {
  return db.emailDraft.update({ where: { id }, data: { status: 'SENT' } });
}

export async function markFailed(id: string) {
  return db.emailDraft.update({ where: { id }, data: { status: 'FAILED' } });
}

export async function countByStatus() {
  return db.emailDraft.groupBy({ by: ['status'], _count: true });
}
