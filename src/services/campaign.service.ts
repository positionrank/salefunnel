import { db } from '@/lib/db';
import { log } from './activity.service';
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
  return cl;
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
