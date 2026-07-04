import { notFound } from 'next/navigation';
import { getById } from '@/services/lead.service';
import { auth } from '@/lib/auth';
import { Header } from '@/components/layout/Header';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatRelative } from '@/lib/utils';

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const [session, lead] = await Promise.all([auth(), getById(params.id)]);
  if (!lead) notFound();

  return (
    <div>
      <Header title={lead.company.name} userEmail={session?.user?.email} />
      <div className="p-6 max-w-5xl flex flex-col gap-6">

        {/* Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-semibold text-slate-800">{lead.company.name}</h2>
              <LeadStatusBadge status={lead.status} />
              {lead.source && <Badge variant="outline">{lead.source}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {lead.company.website && <div><p className="text-xs text-slate-500 mb-0.5">Website</p><a href={lead.company.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{lead.company.website}</a></div>}
              {lead.company.industry && <div><p className="text-xs text-slate-500 mb-0.5">Industry</p><p>{lead.company.industry}</p></div>}
              {(lead.company.city || lead.company.state) && <div><p className="text-xs text-slate-500 mb-0.5">Location</p><p>{[lead.company.city, lead.company.state].filter(Boolean).join(', ')}</p></div>}
              {lead.company.phone && <div><p className="text-xs text-slate-500 mb-0.5">Phone</p><p>{lead.company.phone}</p></div>}
            </div>
            {lead.company.description && (
              <p className="mt-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">{lead.company.description}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Contact</h3>
            {lead.contact ? (
              <div className="flex flex-col gap-1.5 text-sm">
                <p className="font-medium text-slate-800">{lead.contact.fullName}</p>
                {lead.contact.title && <p className="text-slate-500">{lead.contact.title}</p>}
                {lead.contact.email && <p className="text-blue-600">{lead.contact.email}</p>}
                {lead.contact.phone && <p className="text-slate-500">{lead.contact.phone}</p>}
              </div>
            ) : <p className="text-sm text-slate-400">No contact assigned</p>}
          </div>
        </div>

        {/* Personalization */}
        {lead.personalizationRecord && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Personalization Notes</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              {lead.personalizationRecord.companySummary && (
                <div><p className="text-xs text-slate-500 mb-1">Company Summary</p><p className="text-slate-700">{lead.personalizationRecord.companySummary}</p></div>
              )}
              {lead.personalizationRecord.outreachAngle && (
                <div><p className="text-xs text-slate-500 mb-1">Outreach Angle</p><p className="text-slate-700">{lead.personalizationRecord.outreachAngle}</p></div>
              )}
              {lead.personalizationRecord.painPoints.length > 0 && (
                <div><p className="text-xs text-slate-500 mb-1">Pain Points</p><ul className="list-disc list-inside text-slate-700 space-y-0.5">{lead.personalizationRecord.painPoints.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
              )}
              {lead.personalizationRecord.icebreaker && (
                <div><p className="text-xs text-slate-500 mb-1">Icebreaker</p><p className="text-slate-700 italic">"{lead.personalizationRecord.icebreaker}"</p></div>
              )}
            </div>
            {lead.personalizationRecord.dataQualityNotes && (
              <p className="mt-3 text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2 border border-yellow-100">{lead.personalizationRecord.dataQualityNotes}</p>
            )}
          </div>
        )}

        {/* Email Drafts */}
        {lead.emailDrafts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Email Drafts</h2>
            <div className="flex flex-col gap-3">
              {lead.emailDrafts.map((draft) => (
                <div key={draft.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={draft.status === 'SENT' ? 'success' : draft.status === 'APPROVED' ? 'success' : draft.status === 'REJECTED' ? 'danger' : 'warning'}>{draft.status}</Badge>
                    {draft.sequence && <Badge variant="secondary">Step {draft.sequence.stepNumber}</Badge>}
                    {draft.aiGenerated && <Badge variant="purple">AI</Badge>}
                  </div>
                  <p className="text-sm font-medium text-slate-800">{draft.subject}</p>
                  <pre className="mt-2 text-xs text-slate-600 whitespace-pre-wrap font-sans line-clamp-4">{draft.bodyText}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Activity Timeline</h2>
          {lead.activityLogs.length === 0 ? (
            <p className="text-sm text-slate-400">No activity yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {lead.activityLogs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 py-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{log.description}</p>
                    {log.user && <p className="text-xs text-slate-400">{log.user.name}</p>}
                  </div>
                  <span className="text-xs text-slate-400">{formatRelative(log.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
