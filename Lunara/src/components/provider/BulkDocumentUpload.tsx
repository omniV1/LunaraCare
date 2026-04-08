/**
 * @module components/provider/BulkDocumentUpload
 * Expandable form that lets providers create multiple client document
 * assignments at once by selecting client, type, and title per row.
 */
import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/apiClient';
import { toast } from 'react-toastify';

interface ClientOption {
  _id?: string;
  id?: string;
  userId?: { _id?: string; id?: string; firstName?: string; lastName?: string; email?: string } | string;
  user?: { _id?: string; id?: string; firstName?: string; lastName?: string; email?: string } | string;
}

interface DocRow {
  clientUserId: string;
  documentType: string;
  title: string;
  notes: string;
}

const DOC_TYPES = [
  { value: 'emotional-survey', label: 'Emotional Survey' },
  { value: 'health-assessment', label: 'Health Assessment' },
  { value: 'personal-assessment', label: 'Personal Assessment' },
  { value: 'feeding-log', label: 'Feeding Log' },
  { value: 'sleep-log', label: 'Sleep Log' },
  { value: 'mood-check-in', label: 'Mood Check-In' },
  { value: 'other', label: 'Other' },
];

const emptyRow = (): DocRow => ({ clientUserId: '', documentType: 'other', title: '', notes: '' });

function clientsFromApiPayload(data: unknown): ClientOption[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as ClientOption[];
    if (Array.isArray(o.clients)) return o.clients as ClientOption[];
  }
  return [];
}

function getClientInfo(c: ClientOption) {
  const u = (typeof c.userId === 'object' ? c.userId : null) ?? (typeof c.user === 'object' ? c.user : null);
  const uid = u?._id ?? u?.id ?? (typeof c.userId === 'string' ? c.userId : '') ?? '';
  const name = u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : uid;
  return { uid, name, email: u?.email ?? '' };
}

/** Multi-row form for bulk-creating document assignments across clients. */
export const BulkDocumentUpload: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [rows, setRows] = useState<DocRow[]>([emptyRow()]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [clientsError, setClientsError] = useState(false);

  useEffect(() => {
    ApiClient.getInstance()
      .get<ClientOption[]>('/providers/me/clients')
      .then((data) => {
        const list = clientsFromApiPayload(data);
        setClients(list);
        setClientsError(false);
      })
      .catch(() => {
        setClientsError(true);
        toast.error('Failed to load client list. Please refresh and try again.');
      });
  }, []);

  const updateRow = (i: number, field: keyof DocRow, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    if (rows.length < 20) setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (i: number) => {
    if (rows.length > 1) setRows((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    const valid = rows.filter((r) => r.clientUserId && r.title && r.documentType);
    if (valid.length === 0) {
      toast.error('Fill in at least one complete row');
      return;
    }
    setLoading(true);
    try {
      await ApiClient.getInstance().post('/documents/bulk-upload', { documents: valid });
      toast.success(`${valid.length} document(s) created`);
      setRows([emptyRow()]);
      setExpanded(false);
      onComplete?.();
    } catch {
      toast.error('Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B4D37] text-white rounded-md hover:bg-[#5a402e] transition-colors text-sm font-medium shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Bulk Assign Documents
      </button>
    );
  }

  return (
    <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-dash-text-primary">Bulk Document Assignment</h3>
        <button onClick={() => setExpanded(false)} className="text-dash-text-secondary/40 hover:text-dash-text-secondary/80">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {clientsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          Failed to load client list. Please refresh the page and try again.
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 bg-[#EDE8E0]/30 rounded-lg">
            <div className="sm:col-span-3">
              {i === 0 && <label className="block text-xs font-medium text-dash-text-secondary/80 mb-1">Client</label>}
              <select
                value={row.clientUserId}
                onChange={(e) => updateRow(i, 'clientUserId', e.target.value)}
                className="w-full border border-dash-border rounded-md px-2 py-1.5 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
              >
                <option value="">Select client...</option>
                {clients.map((c) => {
                  const info = getClientInfo(c);
                  return (
                    <option key={info.uid} value={info.uid}>
                      {info.name} {info.email ? `(${info.email})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="sm:col-span-2">
              {i === 0 && <label className="block text-xs font-medium text-dash-text-secondary/80 mb-1">Type</label>}
              <select
                value={row.documentType}
                onChange={(e) => updateRow(i, 'documentType', e.target.value)}
                className="w-full border border-dash-border rounded-md px-2 py-1.5 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              {i === 0 && <label className="block text-xs font-medium text-dash-text-secondary/80 mb-1">Title</label>}
              <input
                type="text"
                value={row.title}
                onChange={(e) => updateRow(i, 'title', e.target.value)}
                placeholder="Document title"
                className="w-full border border-dash-border rounded-md px-2 py-1.5 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
              />
            </div>
            <div className="sm:col-span-3">
              {i === 0 && <label className="block text-xs font-medium text-dash-text-secondary/80 mb-1">Notes</label>}
              <input
                type="text"
                value={row.notes}
                onChange={(e) => updateRow(i, 'notes', e.target.value)}
                placeholder="Optional notes"
                className="w-full border border-dash-border rounded-md px-2 py-1.5 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
              />
            </div>
            <div className="sm:col-span-1 flex justify-end">
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                  title="Remove row"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={addRow}
          disabled={rows.length >= 20}
          className="inline-flex items-center gap-1 text-sm text-[#6B4D37] hover:text-[#4E1B00] font-medium disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add row ({rows.length}/20)
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B4D37] text-white rounded-md hover:bg-[#5a402e] transition-colors text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Creating...' : `Create ${rows.filter((r) => r.clientUserId && r.title).length} Document(s)`}
        </button>
      </div>
    </div>
  );
};
