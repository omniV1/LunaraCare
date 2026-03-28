import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../api/apiClient';

interface ClientOption {
  _id: string;
  userId?: { _id: string; firstName?: string; lastName?: string; email?: string } | string;
  displayName?: string;
  clientUserId?: string;
}
interface ProviderOption {
  _id: string;
  userId?: { _id: string; firstName?: string; lastName?: string; email?: string } | string;
  /** Server-computed; prefer over parsing userId */
  displayName?: string;
  providerUserId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface ScheduleAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

export const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({
  open,
  onClose,
  onScheduled,
}) => {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<'virtual' | 'in_person'>('virtual');
  const [notes, setNotes] = useState('');

  const api = ApiClient.getInstance();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      api.get<ClientOption[] | { clients?: ClientOption[] }>('/client?all=1'),
      api.get<ProviderOption[]>('/providers'),
    ])
      .then(([clientsRes, providersRes]) => {
        const clientList = Array.isArray(clientsRes) ? clientsRes : clientsRes?.clients ?? [];
        setClients(Array.isArray(clientList) ? clientList : []);
        setProviders(Array.isArray(providersRes) ? providersRes : []);
        setClientId('');
        setProviderId('');
        setStartTime('');
        setEndTime('');
        setType('virtual');
        setNotes('');
      })
      .catch(() => {
        toast.error('Failed to load clients or providers');
      })
      .finally(() => setLoading(false));
  }, [open, api]);

  const getClientUserId = (c: ClientOption) => {
    if (c.clientUserId) return c.clientUserId;
    const u = c.userId;
    if (u && typeof u === 'object' && u._id) return u._id;
    if (typeof u === 'string') return u;
    return c._id;
  };
  const getProviderUserId = (p: ProviderOption) => {
    if (p.providerUserId) return p.providerUserId;
    const u = p.userId;
    if (u && typeof u === 'object' && typeof u._id === 'string') return u._id;
    if (typeof u === 'string') return u;
    return p._id;
  };
  const clientDisplayName = (c: ClientOption) => {
    if (c.displayName && c.displayName !== 'Unknown') return c.displayName;
    const u = c.userId;
    if (u && typeof u === 'object') {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
      if (name || u.email) return name || u.email!;
    }
    return 'Unknown';
  };
  const providerDisplayName = (p: ProviderOption) => {
    if (p.displayName && p.displayName !== 'Unknown') return p.displayName;
    const u = p.userId;
    if (u && typeof u === 'object') {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
      if (name || u.email) return name || u.email!;
    }
    if (p.firstName || p.lastName || p.email) {
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
      return name || p.email!;
    }
    return 'Unknown';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !providerId || !startTime || !endTime) {
      toast.error('Please select client, provider, and set start and end time.');
      return;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      toast.error('End time must be after start time.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/appointments', {
        clientId,
        providerId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type,
        notes: notes || undefined,
      });
      toast.success('Appointment scheduled.');
      onScheduled?.();
      onClose();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : err instanceof Error
            ? err.message
            : undefined;
      toast.error(message ?? 'Failed to schedule appointment');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" aria-hidden onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Schedule appointment</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close">
              ✕
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c._id} value={getClientUserId(c)}>
                      {clientDisplayName(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select provider</option>
                  {providers.map((p) => (
                    <option key={p._id} value={getProviderUserId(p)}>
                      {providerDisplayName(p)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'virtual' | 'in_person')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="virtual">Virtual</option>
                  <option value="in_person">In person</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Scheduling…' : 'Schedule'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
