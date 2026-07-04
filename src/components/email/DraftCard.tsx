'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface DraftCardProps {
  draft: {
    id: string;
    subject: string;
    bodyText: string;
    aiGenerated: boolean;
    lead: {
      company: { name: string; industry?: string | null };
      contact?: { fullName?: string | null; email?: string | null; title?: string | null } | null;
    };
    sequence?: { name: string; stepNumber: number } | null;
  };
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onEdit: (id: string, subject: string, bodyText: string) => Promise<void>;
}

export function DraftCard({ draft, onApprove, onReject, onEdit }: DraftCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.bodyText);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(draft.id);
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject(draft.id, rejectReason || undefined);
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    await onEdit(draft.id, subject, body);
    setEditing(false);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800 text-sm">{draft.lead.company.name}</span>
            {draft.lead.company.industry && (
              <Badge variant="outline">{draft.lead.company.industry}</Badge>
            )}
            {draft.aiGenerated && <Badge variant="purple">AI</Badge>}
            {draft.sequence && <Badge variant="secondary">Step {draft.sequence.stepNumber}: {draft.sequence.name}</Badge>}
          </div>
          {draft.lead.contact?.fullName && (
            <p className="text-xs text-slate-500">{draft.lead.contact.fullName} · {draft.lead.contact.title} · {draft.lead.contact.email}</p>
          )}
          <p className="text-sm text-slate-700 mt-1.5 font-medium">Subject: {draft.subject}</p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600 transition-colors mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-4 border-t border-slate-100">
          {editing ? (
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Textarea label="Body" value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={loading}>Save</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <pre className="mt-3 text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-4 border border-slate-100">
              {draft.bodyText}
            </pre>
          )}

          {showReject && (
            <div className="mt-3">
              <input
                placeholder="Reason for rejection (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={handleApprove} disabled={loading}>
              <CheckCircle size={13} /> Approve & Queue
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(!editing)} disabled={loading}>
              <Edit3 size={13} /> Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={showReject ? handleReject : () => setShowReject(true)}
              disabled={loading}
            >
              <XCircle size={13} /> {showReject ? 'Confirm Reject' : 'Reject'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
