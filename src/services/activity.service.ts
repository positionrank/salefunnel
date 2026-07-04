import { db } from '@/lib/db';
import type { ActivityType } from '@prisma/client';

export interface LogActivityInput {
  type: ActivityType;
  description: string;
  leadId?: string;
  campaignId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export async function log(input: LogActivityInput): Promise<void> {
  await db.activityLog.create({
    data: {
      type: input.type,
      description: input.description,
      leadId: input.leadId,
      campaignId: input.campaignId,
      userId: input.userId,
      metadata: input.metadata ? (input.metadata as object) : undefined,
    },
  });
}

export async function getRecent(limit = 20) {
  return db.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      lead: { include: { company: { select: { name: true } } } },
      campaign: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

export async function getForLead(leadId: string, limit = 50) {
  return db.activityLog.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });
}
