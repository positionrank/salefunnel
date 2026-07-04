'use client';

import { signOut } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  userEmail?: string | null;
}

export function Header({ title, userEmail }: HeaderProps) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-sm font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        {userEmail && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <User size={13} />
            {userEmail}
          </div>
        )}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </header>
  );
}
