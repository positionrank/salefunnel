import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import * as LeadService from '@/services/lead.service';
import * as ActivityService from '@/services/activity.service';
import * as DraftService from '@/services/draft.service';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const [leadStats, draftCounts, recentActivity, pendingFollowUps, activeCampaigns] = await Promise.all([
    LeadService.getStats(),
    DraftService.countByStatus(),
    ActivityService.getRecent(10),
    db.followUpSchedule.count({ where: { status: 'PENDING', scheduledAt: { lte: new Date() } } }),
    db.campaign.count({ where: { status: 'ACTIVE', active: true } }),
  ]);

  const sentCount = await db.emailMessage.count({ where: { status: 'SENT' } });

  return NextResponse.json({
    data: {
      leads: leadStats,
      drafts: draftCounts,
      sentCount,
      pendingFollowUps,
      activeCampaigns,
      recentActivity,
    },
  });
}
