'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Building2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

interface Company {
  id: string; name: string; website?: string | null; industry?: string | null;
  city?: string | null; state?: string | null;
  createdAt: string;
  _count: { leads: number; contacts: number };
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', website: '', industry: '', city: '', state: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch(`/api/companies?${params}`);
    const json = await res.json() as { data: Company[] };
    setCompanies(json.data ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => { void fetchCompanies(); }, [fetchCompanies]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    setSaving(false);
    setShowForm(false);
    setFormData({ name: '', website: '', industry: '', city: '', state: '', notes: '' });
    void fetchCompanies();
  };

  return (
    <div>
      <Header title="Companies" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus size={13} /> Add Company</Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">New Company</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <Input label="Company Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
              <Input label="Industry" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} />
              <div className="flex gap-2">
                <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                <Input label="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Textarea label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
              </div>
              <div className="col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> :
            companies.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No companies yet.</div> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Industry</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Leads</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((co) => (
                  <tr key={co.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-800">{co.name}</p>
                          {co.website && <a href={co.website} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>{co.website}</a>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{co.industry ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{[co.city, co.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{co._count.leads}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(co.createdAt)}</td>
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
