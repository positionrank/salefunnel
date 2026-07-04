'use client';

import { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import type { CsvRow } from '@/services/import.service';

interface ImportModalProps {
  onClose: () => void;
  onSuccess: (result: { created: number; failed: number }) => void;
}

export function ImportModal({ onClose, onSuccess }: ImportModalProps) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; errors: Array<{ row: number; error: string }> } | null>(null);

  const handleFile = useCallback((file: File) => {
    setParseError('');
    setRows([]);
    setFileName(file.name);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length > 0) {
          setParseError(`CSV parse error: ${res.errors[0]?.message}`);
          return;
        }
        setRows(res.data);
      },
      error: (err) => setParseError(err.message),
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, fileName }),
      });
      const json = await res.json() as { data: { created: number; failed: number; errors: Array<{ row: number; error: string }> } };
      setResult(json.data);
      onSuccess({ created: json.data.created, failed: json.data.failed });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Import Leads from CSV</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <Upload size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">Drop a CSV here or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">Columns: company_name, website, city, state, industry, contact_name, contact_title, contact_email, notes</p>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            {parseError && <p className="mt-3 text-sm text-red-600">{parseError}</p>}

            {rows.length > 0 && (
              <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-700"><span className="font-semibold">{rows.length}</span> rows ready to import from <span className="font-medium">{fileName}</span></p>
                <p className="text-xs text-slate-500 mt-0.5">First row preview: {rows[0]?.company_name}</p>
              </div>
            )}

            <div className="flex gap-3 mt-5 justify-end">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={rows.length === 0 || loading}>
                {loading ? 'Importing…' : `Import ${rows.length} rows`}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
            <p className="font-semibold text-slate-800">Import complete</p>
            <p className="text-sm text-slate-500 mt-1">
              <span className="text-green-600 font-medium">{result.created} created</span>
              {result.failed > 0 && <span className="text-red-500 font-medium ml-2">{result.failed} failed</span>}
            </p>
            {result.errors.length > 0 && (
              <div className="mt-3 text-left rounded-lg bg-red-50 border border-red-100 px-3 py-2 max-h-32 overflow-y-auto">
                {result.errors.map((e) => (
                  <p key={e.row} className="text-xs text-red-700">Row {e.row}: {e.error}</p>
                ))}
              </div>
            )}
            <Button className="mt-4" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}
