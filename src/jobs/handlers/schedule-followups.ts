import { db } from '@/lib/db';
import { log } from '@/services/activity.service';
import { addDays } from 'date-fns';

export interface ScheduleFollowUpsPayload {
  campaignLeadId: string;
  sentMessageId: string;
  jobRecordId: string;
}

export async function handleScheduleFollowUps(payload: ScheduleFollowUpsPayload): Promise<void> {
  const { campaignLeadId, sentMessageId, jobRecordId } = payload;

  await db.jobRecord.update({
    where: { id: jobRecordId },
    data: { status: 'RUNNING', startedAt: new Date(), attemptCount: { increment: 1 } },
  });

  try {
    const campaignLead = await db.campaignLead.findUnique({
      where: { id: campaignLeadId },
      include: {
        campaign: {
          include: {
            sequences: { where: { active: true }, orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    });

    if (!campaignLead) throw new Error('CampaignLead not found');

    const currentStep = campaignLead.currentStep;
    const nextSequences = campaignLead.campaign.sequences.filter((s) => s.stepNumber > currentStep);

    let cumulativeDelay = 0;
    const now = new Date();

    for (const seq of nextSequences) {
      cumulativeDelay += seq.delayDays;
      const scheduledAt = addDays(now, cumulativeDelay);

      await db.followUpSchedule.create({
        data: {
          campaignLeadId,
          parentMessageId: sentMessageId,
          stepNumber: seq.stepNumber,
          scheduledAt,
          status: 'PENDING',
        },
      });
    }

    const nextFollowUp = nextSequences[0];
    if (nextFollowUp) {
      await db.campaignLead.update({
        where: { id: campaignLeadId },
        data: { nextFollowUpAt: addDays(now, nextFollowUp.delayDays) },
      });
    }

    await log({
      type: 'FOLLOWUP_SCHEDULED',
      description: `Scheduled ${nextSequences.length} follow-up(s)`,
      leadId: campaignLead.leadId,
      campaignId: campaignLead.campaignId,
    });

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
