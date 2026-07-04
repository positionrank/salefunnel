import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  sub?: string;
}

const colorMap: Record<NonNullable<StatsCardProps['color']>, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-500' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-500' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-500' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-500' },
};

export function StatsCard({ label, value, icon: Icon, color = 'blue', sub }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={cn('p-2.5 rounded-xl', c.bg)}>
        <Icon size={20} className={c.icon} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
