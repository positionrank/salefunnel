'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { DraftCard } from '@/components/email/DraftCard';

interface Draft {
  id: string;
  subject: string;
  bodyText: string;
  aiGenerated: boolean;
  lead: {
    company: { name: string; industry?: string | null };
    contact?: { fullName?: string | null; email?: string | null; title?: string | null } | null;
  };
  sequence?: { name: string; stepNumber: number } | null;
}

export default function ApprovalsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/drafts');
    const json = await res.json() as { data: Draft[] };
    setDrafts(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchDrafts(); }, [fetchDrafts]);

  const handleApprove = async (id: string) => {
    setError(null);
    const res = await fetch(`/api/drafts/${id}/approve`, { method: 'POST' });
    if (!res.ok) {
      const json = await res.json().catch(() => null) as { message?: string } | null;
      setError(json?.message ?? 'Failed to approve draft.');
      return;
    }
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleReject = async (id: string, reason?: string) => {
    await fetch(`/api/drafts/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleEdit = async (id: string, subject: string, bodyText: string) => {
    await fetch(`/api/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, bodyText }),
    });
    setDrafts((prev) => prev.map((d) => d.id === id ? { ...d, subject, bodyText } : d));
  };

  return (
    <div>
      <Header title="Approval Queue" />
      <div className="p-6 max-w-3xl">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center text-sm text-slate-400 py-12">Loading drafts…</div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No drafts pending review.</p>
            <p className="text-xs text-slate-400 mt-1">Approved emails will be queued for sending.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">{drafts.length} draft{drafts.length !== 1 ? 's' : ''} awaiting review</p>
            <div className="flex flex-col gap-3">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
