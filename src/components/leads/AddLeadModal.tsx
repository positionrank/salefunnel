'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CsvRow } from '@/services/import.service';

interface AddLeadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const emptyForm: CsvRow = {
  company_name: '',
  website: '',
  city: '',
  state: '',
  industry: '',
  contact_name: '',
  contact_title: '',
  contact_email: '',
  notes: '',
};

export function AddLeadModal({ onClose, onSuccess }: AddLeadModalProps) {
  const [form, setForm] = useState<CsvRow>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof CsvRow) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.company_name?.trim()) {
      setError('Company name is required.');
      return;
    }

    setSaving(true);
    try {
      // Reuses the CSV import path (single row) so a manually added lead goes
      // through the exact same creation + auto-enrich pipeline as an import.
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: [form], fileName: 'manual-entry' }),
      });
      const json = await res.json() as {
        data?: { created: number; failed: number; errors: Array<{ row: number; error: string }> };
        error?: string;
      };

      if (!res.ok) {
        setError(json.error ?? 'Failed to add lead.');
        return;
      }
      if (!json.data || json.data.created === 0) {
        setError(json.data?.errors[0]?.error ?? 'Failed to add lead.');
        return;
      }

      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Add Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Company</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.company_name}
                onChange={set('company_name')}
                placeholder="Company name *"
                className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.website}
                onChange={set('website')}
                placeholder="Website"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.industry}
                onChange={set('industry')}
                placeholder="Industry"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.city}
                onChange={set('city')}
                placeholder="City"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.state}
                onChange={set('state')}
                placeholder="State"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Contact (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.contact_name}
                onChange={set('contact_name')}
                placeholder="Full name"
                className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.contact_title}
                onChange={set('contact_title')}
                placeholder="Title"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.contact_email}
                onChange={set('contact_email')}
                type="email"
                placeholder="Email"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Notes"
            rows={2}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Lead'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
