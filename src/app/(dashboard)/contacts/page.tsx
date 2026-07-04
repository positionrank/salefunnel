'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';

interface Contact {
  id: string; fullName?: string | null; title?: string | null; email?: string | null;
  source: string; createdAt: string;
  company?: { id: string; name: string } | null;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch(`/api/contacts?${params}`);
    const json = await res.json() as { data: Contact[] };
    setContacts(json.data ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => { void fetchContacts(); }, [fetchContacts]);

  return (
    <div>
      <Header title="Contacts" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> :
            contacts.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No contacts yet.</div> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.fullName ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{c.title ?? '—'}</td>
                    <td className="px-4 py-3 text-blue-600">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.company?.name ?? '—'}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{c.source.replace(/_/g, ' ')}</Badge></td>
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
