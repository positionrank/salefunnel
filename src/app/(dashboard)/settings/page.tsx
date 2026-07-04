import { auth } from '@/lib/auth';
import { Header } from '@/components/layout/Header';
import { db } from '@/lib/db';
import { Mail, Brain, Database, AlertCircle } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  const gmailAccount = session?.user?.id
    ? await db.integrationAccount.findFirst({ where: { userId: session.user.id, provider: 'GMAIL', active: true } })
    : null;

  return (
    <div>
      <Header title="Settings" userEmail={session?.user?.email} />
      <div className="p-6 max-w-2xl flex flex-col gap-6">

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Mail size={16} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Gmail / Google Workspace</h2>
              <p className="text-xs text-slate-500">Used to send outbound emails from your account.</p>
            </div>
          </div>
          {gmailAccount ? (
            <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
              ✓ Connected as <strong>{gmailAccount.accountEmail}</strong>
            </div>
          ) : (
            <div>
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 mb-3 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <div>
                  <p>Gmail is not connected. Email sending is disabled.</p>
                  <p className="text-xs mt-0.5">Note: Gmail does not support open/click tracking. For tracking, connect SendGrid or Mailgun in a future update.</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">OAuth connection flow — Phase 2 feature. Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env with Gmail scopes.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Brain size={16} className="text-purple-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">AI / Claude API</h2>
              <p className="text-xs text-slate-500">Used for email draft generation and personalization.</p>
            </div>
          </div>
          {process.env.ANTHROPIC_API_KEY ? (
            <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
              ✓ ANTHROPIC_API_KEY is configured (model: claude-sonnet-4-6)
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              ANTHROPIC_API_KEY is not set. AI draft generation is disabled.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <Database size={16} className="text-slate-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Enrichment Providers</h2>
              <p className="text-xs text-slate-500">Data sources for company enrichment.</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Website Scrape</p>
                <p className="text-xs text-slate-400">Extracts meta description and title from company websites</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-400">Clearbit / Breeze</p>
                <p className="text-xs text-slate-400">Phase 4 — requires API key</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Not configured</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-400">Apollo / ZoomInfo</p>
                <p className="text-xs text-slate-400">Phase 4 — requires API key</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Not configured</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
