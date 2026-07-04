'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Megaphone, CheckSquare, FileText, Settings, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/leads',      label: 'Leads',      icon: Users },
  { href: '/campaigns',  label: 'Campaigns',  icon: Megaphone },
  { href: '/approvals',  label: 'Approvals',  icon: CheckSquare },
  { href: '/templates',  label: 'Templates',  icon: FileText },
  { href: '/settings',   label: 'Settings',   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-slate-900 flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <span className="text-white font-semibold text-sm">SalesFunnel</span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
