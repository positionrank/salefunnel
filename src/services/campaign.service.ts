import { db } from '@/lib/db';
import { log } from './activity.service';
import { JOB_TYPES, enqueueJob } from '@/lib/queue';
import type { CampaignStatus } from '@prisma/client';

export interface CreateCampaignInput {
  name: string;
  description?: string;
  autoSend?: boolean;
  fromName?: string;
  replyTo?: string;
  dailySendLimit?: number;
  sequences?: Array<{
    stepNumber: number;
    name: string;
    subject?: string;
    templateId?: string;
    delayDays: number;
  }>;
}

export async function list() {
  return db.campaign.findMany({
    where: { active: true },
    include: {
      _count: { select: { campaignLeads: true } },
      sequences: { orderBy: { stepNumber: 'asc' } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getById(id: string) {
  return db.campaign.findFirst({
    where: { id, active: true },
    include: {
      sequences: {
        orderBy: { stepNumber: 'asc' },
        include: { template: true },
      },
      campaignLeads: {
        include: {
          lead: {
            include: {
              company: { select: { name: true } },
              contact: { select: { fullName: true, email: true, title: true } },
            },
          },
          followUps: { where: { status: 'PENDING' }, orderBy: { scheduledAt: 'asc' }, take: 1 },
        },
        orderBy: { addedAt: 'desc' },
      },
      activityLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
}

export async function create(input: CreateCampaignInput, userId: string) {
  const { sequences, ...rest } = input;
  const campaign = await db.campaign.create({
    data: {
      ...rest,
      createdByUserId: userId,
      ...(sequences
        ? { sequences: { create: sequences } }
        : {}),
    },
    include: { sequences: true },
  });
  await log({ type: 'CAMPAIGN_CREATED', description: `Campaign "${campaign.name}" created`, campaignId: campaign.id, userId });
  return campaign;
}

export async function updateStatus(id: string, status: CampaignStatus, userId?: string) {
  const campaign = await db.campaign.update({ where: { id }, data: { status } });
  const type = status === 'ACTIVE' ? 'CAMPAIGN_ACTIVATED' : 'CAMPAIGN_PAUSED';
  await log({ type, description: `Campaign ${status.toLowerCase()}`, campaignId: id, userId });

  if (status === 'ACTIVE') {
    const campaignLeads = await db.campaignLead.findMany({ where: { campaignId: id, status: 'ACTIVE' } });
    for (const cl of campaignLeads) {
      await enqueueNextDraftIfReady(cl.leadId, id);
    }
  }

  return campaign;
}

export async function addLead(campaignId: string, leadId: string, userId?: string) {
  const cl = await db.campaignLead.upsert({
    where: { campaignId_leadId: { campaignId, leadId } },
    create: { campaignId, leadId },
    update: { status: 'ACTIVE' },
  });
  await db.lead.update({ where: { id: leadId }, data: { status: 'IN_CAMPAIGN' } });
  await log({ type: 'LEAD_ADDED_TO_CAMPAIGN', description: 'Lead added to campaign', leadId, campaignId, userId });
  await enqueueNextDraftIfReady(leadId, campaignId);
  return cl;
}

// Called both when a lead is added to a (potentially already-active) campaign
// and after generate-personalization completes for a lead already in one —
// whichever happens last is what actually kicks off draft generation.
export async function enqueueNextDraftIfReady(leadId: string, onlyCampaignId?: string) {
  const personalization = await db.personalizationRecord.findUnique({ where: { leadId } });
  if (!personalization) return;

  const campaignLeads = await db.campaignLead.findMany({
    where: { leadId, status: 'ACTIVE', campaign: { status: 'ACTIVE', ...(onlyCampaignId ? { id: onlyCampaignId } : {}) } },
    include: { campaign: { include: { sequences: { where: { active: true } } } } },
  });

  for (const cl of campaignLeads) {
    const seq = cl.campaign.sequences.find((s) => s.stepNumber === cl.currentStep);
    if (!seq?.templateId) continue;

    const existingDraft = await db.emailDraft.findFirst({ where: { campaignLeadId: cl.id, sequenceId: seq.id } });
    if (existingDraft) continue;

    // A draft row only appears once the generate-draft job actually runs, so
    // guard against re-enqueuing while an earlier call's job is still queued/running
    // (e.g. addLead and the personalization-complete callback both firing for the same lead).
    const existingJob = await db.jobRecord.findFirst({
      where: {
        type: JOB_TYPES.GENERATE_DRAFT,
        status: { in: ['PENDING', 'RUNNING'] },
        AND: [
          { payload: { path: ['campaignLeadId'], equals: cl.id } },
          { payload: { path: ['sequenceId'], equals: seq.id } },
        ],
      },
    });
    if (existingJob) continue;

    await enqueueJob(JOB_TYPES.GENERATE_DRAFT, {
      leadId,
      campaignLeadId: cl.id,
      sequenceId: seq.id,
      templateId: seq.templateId,
      senderName: cl.campaign.fromName ?? undefined,
    });
  }
}

export async function remove(id: string) {
  return db.campaign.update({ where: { id }, data: { active: false, deletedAt: new Date() } });
}

export async function getAnalytics(campaignId: string) {
  const [leads, followUpsPending, replied] = await Promise.all([
    db.campaignLead.count({ where: { campaignId } }),
    db.followUpSchedule.count({ where: { campaignLead: { campaignId }, status: 'PENDING' } }),
    db.campaignLead.count({ where: { campaignId, repliedAt: { not: null } } }),
  ]);
  const sent = await db.emailMessage.count({
    where: { draft: { campaignLeadId: { in: (await db.campaignLead.findMany({ where: { campaignId }, select: { id: true } })).map(cl => cl.id) } }, status: 'SENT' },
  });
  return { leads, sent, followUpsPending, replied };
}
