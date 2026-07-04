import { formatRelative } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string | Date;
  lead?: { company?: { name?: string } | null } | null;
  user?: { name?: string | null; email?: string | null } | null;
}

const TYPE_COLORS: Record<string, string> = {
  EMAIL_SENT:     'bg-blue-400',
  REPLY_DETECTED: 'bg-green-500',
  DRAFT_APPROVED: 'bg-green-400',
  DRAFT_REJECTED: 'bg-red-400',
  LEAD_CREATED:   'bg-slate-400',
  LEAD_IMPORTED:  'bg-slate-400',
  CAMPAIGN_CREATED: 'bg-purple-400',
  EMAIL_FAILED:   'bg-red-400',
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">No recent activity.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-3">
          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TYPE_COLORS[item.type] ?? 'bg-slate-300'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 truncate">{item.description}</p>
            {item.lead?.company?.name && (
              <p className="text-xs text-slate-400">{item.lead.company.name}</p>
            )}
          </div>
          <span className="text-xs text-slate-400 shrink-0">{formatRelative(item.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
