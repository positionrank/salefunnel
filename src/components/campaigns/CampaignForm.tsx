'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';

interface SequenceStep {
  stepNumber: number;
  name: string;
  delayDays: number;
}

interface CampaignFormProps {
  onSubmit: (data: {
    name: string;
    description?: string;
    autoSend: boolean;
    fromName?: string;
    replyTo?: string;
    dailySendLimit: number;
    sequences: SequenceStep[];
  }) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_SEQUENCES: SequenceStep[] = [
  { stepNumber: 1, name: 'Initial Email', delayDays: 0 },
  { stepNumber: 2, name: 'Follow-up 1',   delayDays: 3 },
  { stepNumber: 3, name: 'Follow-up 2',   delayDays: 7 },
  { stepNumber: 4, name: 'Follow-up 3',   delayDays: 12 },
];

export function CampaignForm({ onSubmit, onCancel }: CampaignFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [autoSend, setAutoSend] = useState(false);
  const [fromName, setFromName] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [dailySendLimit, setDailySendLimit] = useState(50);
  const [sequences, setSequences] = useState<SequenceStep[]>(DEFAULT_SEQUENCES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addStep = () => {
    const last = sequences[sequences.length - 1]!;
    setSequences([...sequences, { stepNumber: last.stepNumber + 1, name: `Follow-up ${sequences.length}`, delayDays: last.delayDays + 7 }]);
  };

  const removeStep = (i: number) => {
    setSequences(sequences.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit({ name, description: description || undefined, autoSend, fromName: fromName || undefined, replyTo: replyTo || undefined, dailySendLimit, sequences });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input label="Campaign Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Q3 Healthcare Outreach" required />
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional description" />

      <div className="grid grid-cols-2 gap-4">
        <Input label="From Name" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Your Name" />
        <Input label="Reply-To Email" type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="you@company.com" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Daily Send Limit</label>
          <input
            type="number"
            min={1} max={500}
            value={dailySendLimit}
            onChange={(e) => setDailySendLimit(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm text-slate-700">Auto-send (no approval required)</span>
        </label>
      </div>

      {/* Sequence steps */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Email Sequence</p>
        <div className="flex flex-col gap-2">
          {sequences.map((step, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-medium text-slate-500 w-6">#{step.stepNumber}</span>
              <input
                value={step.name}
                onChange={(e) => setSequences(sequences.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s))}
                className="flex-1 text-sm bg-transparent border-none outline-none text-slate-700"
              />
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Day</span>
                <input
                  type="number"
                  min={0}
                  value={step.delayDays}
                  onChange={(e) => setSequences(sequences.map((s, idx) => idx === i ? { ...s, delayDays: Number(e.target.value) } : s))}
                  className="w-12 rounded border border-slate-200 px-1.5 py-0.5 text-center text-sm"
                />
              </div>
              {i > 0 && (
                <button type="button" onClick={() => removeStep(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep} className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
          <Plus size={12} /> Add step
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Campaign'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
