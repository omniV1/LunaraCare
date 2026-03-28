import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../api/apiClient';

interface Appointment {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
  type?: string;
  notes?: string;
  clientId?: { _id: string; firstName?: string; lastName?: string; email?: string };
}

export const ProviderAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const api = ApiClient.getInstance();

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Appointment[] | { data?: Appointment[] }>('/appointments');
      const list = Array.isArray(data) ? data : data.data ?? [];
      setAppointments(Array.isArray(list) ? list : []);
    } catch {
      setAppointments([]);
      toast.error('Could not load appointments');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleConfirm = async (id: string) => {
    setActionId(id);
    try {
      await api.post(`/appointments/${id}/confirm`, {});
      toast.success('Appointment confirmed.');
      loadAppointments();
    } catch (e: unknown) {
      const message =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message ?? 'Failed to confirm');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionId(id);
    try {
      await api.post(`/appointments/${id}/cancel`, { reason: 'Declined by provider' });
      toast.success('Appointment declined.');
      loadAppointments();
    } catch (e: unknown) {
      const message =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message ?? 'Failed to decline');
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const requested = appointments.filter((a) => a.status === 'requested');
  const others = appointments.filter((a) => a.status !== 'requested');

  const clientName = (a: Appointment) =>
    a.clientId
      ? [a.clientId.firstName, a.clientId.lastName].filter(Boolean).join(' ') || a.clientId?.email || 'Client'
      : 'Client';

  if (loading) {
    return (
      <div className="p-2 sm:p-6 flex justify-center min-w-0">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 sm:space-y-8 min-w-0 overflow-x-hidden">
      {requested.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending approval</h2>
          <p className="text-sm text-gray-500 mb-4">Clients have requested these times. Approve or decline.</p>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {requested.map((a) => (
              <li key={a._id} className="p-4 bg-white hover:bg-gray-50 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{clientName(a)}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(a.startTime)} · {formatTime(a.startTime)}
                    {a.type && ` · ${a.type === 'in_person' ? 'In person' : 'Virtual'}`}
                  </p>
                  {a.notes && <p className="text-sm text-gray-500 mt-1">Note: {a.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfirm(a._id)}
                    disabled={actionId !== null}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionId === a._id ? '…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(a._id)}
                    disabled={actionId !== null}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {requested.length > 0 ? 'All appointments' : 'Appointments'}
        </h2>
        {appointments.length === 0 ? (
          <p className="text-gray-500">No appointments.</p>
        ) : (
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {others.map((a) => (
              <li key={a._id} className="p-4 bg-white">
                <p className="font-medium text-gray-900">{clientName(a)}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(a.startTime)} · {formatTime(a.startTime)} · {a.status}
                  {a.type && ` · ${a.type === 'in_person' ? 'In person' : 'Virtual'}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
