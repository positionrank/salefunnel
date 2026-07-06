'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Upload, Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { ImportModal } from '@/components/leads/ImportModal';
import { AddLeadModal } from '@/components/leads/AddLeadModal';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { LeadStatus } from '@prisma/client';

interface Lead {
  id: string;
  status: LeadStatus;
  source?: string | null;
  createdAt: string;
  company: { id: string; name: string; industry?: string | null; city?: string | null; state?: string | null };
  contact?: { fullName?: string | null; email?: string | null; title?: string | null } | null;
  campaignLeads: Array<{ campaign: { name: string; status: string } }>;
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/leads?${params}`);
    const json = await res.json() as { data: Lead[] };
    setLeads(json.data ?? []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { void fetchLeads(); }, [fetchLeads]);

  return (
    <div>
      <Header title="Leads" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, contact…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {['NEW','ENRICHING','ENRICHED','READY','IN_CAMPAIGN','REPLIED','OPTED_OUT','ARCHIVED'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            <Upload size={13} /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddLead(true)}>
            <Plus size={13} /> Add Lead
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No leads found. Import a CSV or add one manually.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Campaign</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{lead.company.name}</p>
                      {lead.company.industry && <p className="text-xs text-slate-400">{lead.company.industry}</p>}
                      {(lead.company.city || lead.company.state) && (
                        <p className="text-xs text-slate-400">{[lead.company.city, lead.company.state].filter(Boolean).join(', ')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.contact ? (
                        <>
                          <p className="text-slate-700">{lead.contact.fullName ?? '—'}</p>
                          <p className="text-xs text-slate-400">{lead.contact.title}</p>
                          <p className="text-xs text-slate-400">{lead.contact.email}</p>
                        </>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3"><LeadStatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3">
                      {lead.campaignLeads[0]
                        ? <span className="text-xs text-slate-600">{lead.campaignLeads[0].campaign.name}</span>
                        : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { void fetchLeads(); }}
        />
      )}

      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onSuccess={() => { setShowAddLead(false); void fetchLeads(); }}
        />
      )}
    </div>
  );
}
