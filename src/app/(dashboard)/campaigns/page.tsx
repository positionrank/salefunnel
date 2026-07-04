'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { formatDate } from '@/lib/utils';
import type { CampaignStatus } from '@prisma/client';

interface Campaign {
  id: string; name: string; status: CampaignStatus; autoSend: boolean;
  createdAt: string; _count: { campaignLeads: number };
  sequences: Array<{ id: string; stepNumber: number; name: string }>;
}

const STATUS_BADGE: Record<CampaignStatus, 'success' | 'warning' | 'secondary' | 'danger'> = {
  ACTIVE: 'success', DRAFT: 'warning', PAUSED: 'secondary', ARCHIVED: 'danger',
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/campaigns');
    const json = await res.json() as { data: Campaign[] };
    setCampaigns(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchCampaigns(); }, [fetchCampaigns]);

  const handleCreate = async (data: Parameters<React.ComponentProps<typeof CampaignForm>['onSubmit']>[0]) => {
    await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowForm(false);
    void fetchCampaigns();
  };

  return (
    <div>
      <Header title="Campaigns" />
      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus size={13} /> New Campaign</Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-5">New Campaign</h3>
            <CampaignForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {loading ? <div className="text-center text-sm text-slate-400 py-8">Loading…</div> :
            campaigns.length === 0 ? <div className="text-center text-sm text-slate-400 py-8">No campaigns yet.</div> :
            campaigns.map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/campaigns/${c.id}`)}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{c.name}</h3>
                      <Badge variant={STATUS_BADGE[c.status]}>{c.status}</Badge>
                      {c.autoSend && <Badge variant="purple">Auto-send</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{c._count.campaignLeads} lead{c._count.campaignLeads !== 1 ? 's' : ''} · {c.sequences.length} step{c.sequences.length !== 1 ? 's' : ''} · Created {formatDate(c.createdAt)}</p>
                  </div>
                </div>
                {c.sequences.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {c.sequences.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-1">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s.name}</span>
                        {i < c.sequences.length - 1 && <span className="text-slate-300 text-xs">→</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
