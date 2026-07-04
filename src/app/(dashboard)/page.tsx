import { auth } from '@/lib/auth';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { getStats } from '@/services/lead.service';
import { getRecent } from '@/services/activity.service';
import { countByStatus } from '@/services/draft.service';
import { db } from '@/lib/db';
import { Users, Send, CheckSquare, Megaphone, Clock, MessageSquare } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  const [leadStats, recentActivity, draftCounts, pendingFollowUps, activeCampaigns, sentCount] = await Promise.all([
    getStats(),
    getRecent(8),
    countByStatus(),
    db.followUpSchedule.count({ where: { status: 'PENDING', scheduledAt: { lte: new Date() } } }),
    db.campaign.count({ where: { status: 'ACTIVE', active: true } }),
    db.emailMessage.count({ where: { status: 'SENT' } }),
  ]);

  const pendingApprovals = draftCounts.find((d) => d.status === 'GENERATED' || d.status === 'EDITED')?._count ?? 0;

  return (
    <div>
      <Header title="Dashboard" userEmail={session?.user?.email} />
      <div className="p-6 max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatsCard label="Total Leads" value={leadStats.total} icon={Users} color="blue" />
          <StatsCard label="Emails Sent" value={sentCount} icon={Send} color="green" />
          <StatsCard label="Active Campaigns" value={activeCampaigns} icon={Megaphone} color="purple" />
          <StatsCard label="Pending Approvals" value={pendingApprovals} icon={CheckSquare} color="yellow" />
          <StatsCard label="Follow-ups Due" value={pendingFollowUps} icon={Clock} color="red" />
          <StatsCard label="Replied" value={leadStats.recentReplies} icon={MessageSquare} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Lead Pipeline</h2>
            <div className="flex flex-col gap-2">
              {leadStats.byStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 capitalize">{s.status.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="text-sm font-semibold text-slate-800">{s._count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Recent Activity</h2>
            <ActivityFeed items={recentActivity as Parameters<typeof ActivityFeed>[0]['items']} />
          </div>
        </div>
      </div>
    </div>
  );
}
