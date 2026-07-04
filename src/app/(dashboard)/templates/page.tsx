'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Pencil } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

interface Template { id: string; name: string; description?: string | null; subject: string; bodyText: string; createdAt: string }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', description: '', subject: '', bodyText: '' });
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/templates');
    const json = await res.json() as { data: Template[] };
    setTemplates(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchTemplates(); }, [fetchTemplates]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', subject: '', bodyText: '' }); setShowForm(true); };
  const openEdit = (t: Template) => { setEditing(t); setForm({ name: t.name, description: t.description ?? '', subject: t.subject, bodyText: t.bodyText }); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    if (editing) {
      await fetch(`/api/templates/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setSaving(false); setShowForm(false); void fetchTemplates();
  };

  return (
    <div>
      <Header title="Email Templates" />
      <div className="p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
          <Button size="sm" onClick={openCreate}><Plus size={13} /> New Template</Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">{editing ? 'Edit Template' : 'New Template'}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Quick question about {{company_name}}" required />
              <Textarea label="Body" value={form.bodyText} onChange={(e) => setForm({ ...form, bodyText: e.target.value })} rows={10}
                placeholder="Hi {{first_name}},&#10;&#10;{{personalization_hook}}&#10;&#10;Best,&#10;{{sender_name}}" required />
              <p className="text-xs text-slate-400">Use <code className="bg-slate-100 px-1 py-0.5 rounded">{'{{variable_name}}'}</code> for dynamic content</p>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Template'}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {loading ? <div className="text-center text-sm text-slate-400 py-8">Loading…</div> :
            templates.length === 0 ? <div className="text-center text-sm text-slate-400 py-8">No templates yet.</div> :
            templates.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-slate-400 shrink-0" />
                    <h3 className="font-semibold text-slate-800 text-sm">{t.name}</h3>
                  </div>
                  <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                </div>
                {t.description && <p className="text-xs text-slate-500 mb-2">{t.description}</p>}
                <p className="text-xs text-slate-500">Subject: <span className="text-slate-700">{t.subject}</span></p>
                <pre className="mt-2 text-xs text-slate-500 whitespace-pre-wrap font-sans line-clamp-3 leading-relaxed">{t.bodyText}</pre>
                <p className="text-xs text-slate-400 mt-2">Created {formatDate(t.createdAt)}</p>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
