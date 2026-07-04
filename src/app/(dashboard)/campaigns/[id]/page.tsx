import { notFound } from 'next/navigation';
import { getById } from '@/services/campaign.service';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { formatDate } from '@/lib/utils';
import type { CampaignStatus } from '@prisma/client';

const STATUS_BADGE: Record<CampaignStatus, 'success' | 'warning' | 'secondary' | 'danger'> = {
  ACTIVE: 'success', DRAFT: 'warning', PAUSED: 'secondary', ARCHIVED: 'danger',
};

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await getById(params.id);
  if (!campaign) notFound();

  return (
    <div>
      <Header title={campaign.name} />
      <div className="p-6 max-w-5xl flex flex-col gap-6">

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-base font-semibold text-slate-800">{campaign.name}</h2>
            <Badge variant={STATUS_BADGE[campaign.status]}>{campaign.status}</Badge>
            {campaign.autoSend && <Badge variant="purple">Auto-send</Badge>}
          </div>
          {campaign.description && <p className="text-sm text-slate-500">{campaign.description}</p>}
          <div className="flex gap-6 mt-4 text-sm text-slate-500">
            <span><b className="text-slate-800">{campaign.campaignLeads.length}</b> leads</span>
            <span><b className="text-slate-800">{campaign.sequences.length}</b> sequence steps</span>
            <span>Daily limit: <b className="text-slate-800">{campaign.dailySendLimit}</b></span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Email Sequence</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {campaign.sequences.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="font-medium text-slate-700">Step {s.stepNumber}: {s.name}</p>
                  <p className="text-slate-400">Day {s.delayDays}{s.template && ` · ${s.template.name}`}</p>
                </div>
                {i < campaign.sequences.length - 1 && <span className="text-slate-300">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Leads in Campaign</h2>
          </div>
          {campaign.campaignLeads.length === 0 ? (
            <p className="p-5 text-sm text-slate-400">No leads added yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Lead Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Step</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Next Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaign.campaignLeads.map((cl) => (
                  <tr key={cl.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{cl.lead.company.name}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{cl.lead.contact?.fullName ?? '—'}</p>
                      <p className="text-xs text-slate-400">{cl.lead.contact?.email}</p>
                    </td>
                    <td className="px-4 py-3"><LeadStatusBadge status={cl.lead.status} /></td>
                    <td className="px-4 py-3 text-slate-600">Step {cl.currentStep}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {cl.followUps[0] ? formatDate(cl.followUps[0].scheduledAt) : cl.repliedAt ? '✓ Replied' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
