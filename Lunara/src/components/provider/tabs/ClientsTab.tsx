import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../../api/apiClient';
import { InviteClient } from '../InviteClient';
import { BulkDocumentUpload } from '../BulkDocumentUpload';
import { ProviderDocumentsList } from '../../documents/ProviderDocumentsList';
import {
  getUserId,
  getUserName,
  getErrorResponseData,
  isRecord,
} from '../../../pages/providerDashboardUtils';
import type { ProviderClientItem } from '../../../pages/providerDashboardUtils';

interface ClientsTabProps {
  user: { id?: string; role?: string } | null;
  onEditClient: (clientId: string) => void;
  onCarePlan: (clientId: string, clientUserId: string, clientName: string) => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({ user, onEditClient, onCarePlan }) => {
  const [myClients, setMyClients] = useState<ProviderClientItem[]>([]);
  const [allClients, setAllClients] = useState<ProviderClientItem[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const apiClient = ApiClient.getInstance();
      const myRes = await apiClient.get<{ clients?: ProviderClientItem[] } | ProviderClientItem[]>('/client');
      const myList = Array.isArray(myRes) ? myRes : myRes?.clients ?? [];
      setMyClients(Array.isArray(myList) ? myList : []);

      if (user?.role === 'provider' || user?.role === 'admin') {
        const allRes = await apiClient.get<{ clients?: ProviderClientItem[] } | ProviderClientItem[]>('/client?all=1');
        const allList = Array.isArray(allRes) ? allRes : allRes?.clients ?? [];
        setAllClients(Array.isArray(allList) ? allList : []);
      } else {
        setAllClients([]);
      }
    } catch {
      setMyClients([]);
      setAllClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  return (
    <div className="space-y-6">
      <InviteClient onInvited={loadClients} />
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
        <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
          <h2 className="text-lg font-medium text-dash-text-primary">My clients</h2>
          <p className="text-sm text-dash-text-secondary/60 mt-1">
            Clients assigned to you. Remove from list only unassigns them; they remain in the system.
          </p>
        </div>
        <div className="p-4 sm:p-6">
          {clientsLoading ? (
            <p className="text-dash-text-secondary/60">Loading...</p>
          ) : myClients.length === 0 ? (
            <p className="text-dash-text-secondary/60">You have no clients assigned yet. Add clients from the list below or create new clients from Overview.</p>
          ) : (
            <ul className="divide-y divide-dash-section-border">
              {myClients.map((c) => {
                const u = c.userId ?? c.user;
                const info = getUserName(u);
                const name = u ? info.name : 'Unknown';
                const email = info.email ?? '';
                const clientUserId = getUserId(u);
                const clientKey = c._id ?? c.id ?? clientUserId;
                return (
                  <li key={clientKey} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-dash-text-primary truncate">{name}</p>
                      {email && <p className="text-sm text-dash-text-secondary/60 truncate">{email}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const id = c._id ?? c.id;
                          if (id) onEditClient(String(id));
                        }}
                        className="text-sm text-[#6B4D37] hover:text-[#4E1B00] font-medium py-2 px-1 min-h-[44px] flex items-center"
                      >
                        View / Edit profile
                      </button>
                      {clientUserId && (
                        <button
                          type="button"
                          onClick={() =>
                            onCarePlan(
                              String(c._id ?? c.id ?? clientUserId),
                              String(clientUserId),
                              name,
                            )
                          }
                          className="text-sm text-[#3F4E4F] hover:text-[#2C3639] font-medium py-2 px-1 min-h-[44px] flex items-center"
                        >
                          Care plans
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await ApiClient.getInstance().patch(`/client/${c._id ?? c.id}/unassign`);
                            toast.success('Removed from your list. Client remains in the system.');
                            loadClients();
                          } catch (e: unknown) {
                            const data = getErrorResponseData(e);
                            const message =
                              isRecord(data) && typeof data.message === 'string'
                                ? data.message
                                : 'Failed to remove';
                            toast.error(message);
                          }
                        }}
                        className="text-sm text-amber-700 hover:text-amber-800 font-medium py-2 px-1 min-h-[44px] flex items-center"
                      >
                        Remove from my list
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {(user?.role === 'provider' || user?.role === 'admin') && (
        <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
          <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
            <h2 className="text-lg font-medium text-dash-text-primary">All created clients</h2>
            <p className="text-sm text-dash-text-secondary/60 mt-1">
              Add any client to your list. Only clients not already assigned to you are shown with an Add button.
            </p>
          </div>
          <div className="p-4 sm:p-6">
            {clientsLoading ? (
              <p className="text-dash-text-secondary/60">Loading...</p>
            ) : allClients.length === 0 ? (
              <p className="text-dash-text-secondary/60">No clients in the system yet.</p>
            ) : (
              <ul className="divide-y divide-dash-section-border">
                {allClients.map((c) => {
                  const u = c.userId ?? c.user;
                  const info = getUserName(u);
                  const name = u ? info.name : 'Unknown';
                  const email = info.email ?? '';
                  const assignedProviderId = getUserId(c.assignedProvider);
                  const isMine = Boolean(assignedProviderId && user?.id && assignedProviderId === String(user.id));
                  const clientUserId = getUserId(u);
                  const clientKey = c._id ?? c.id ?? clientUserId;
                  return (
                    <li key={clientKey} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-dash-text-primary truncate">{name}</p>
                        {email && <p className="text-sm text-dash-text-secondary/60 truncate">{email}</p>}
                        {c.assignedProvider && (
                          <span className="text-xs text-[#3F4E4F]">
                            Provider: {getUserName(c.assignedProvider).name}
                          </span>
                        )}
                        {isMine && <span className="text-xs text-[#6B4D37] ml-2">On your list</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isMine && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const id = c._id ?? c.id;
                                if (id) onEditClient(String(id));
                              }}
                              className="text-sm text-[#6B4D37] hover:text-[#4E1B00] font-medium py-2 px-1 min-h-[44px] flex items-center"
                            >
                              View / Edit profile
                            </button>
                            {clientUserId && (
                              <button
                                type="button"
                                onClick={() =>
                                  onCarePlan(
                                    String(c._id ?? c.id ?? clientUserId),
                                    String(clientUserId),
                                    name,
                                  )
                                }
                                className="text-sm text-[#3F4E4F] hover:text-[#2C3639] font-medium py-2 px-1 min-h-[44px] flex items-center"
                              >
                                Care plans
                              </button>
                            )}
                          </>
                        )}
                      {!isMine && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await ApiClient.getInstance().patch(`/client/${c._id ?? c.id}/assign`);
                              toast.success('Added to your list.');
                              loadClients();
                            } catch (e: unknown) {
                              const data = getErrorResponseData(e);
                              const message =
                                isRecord(data) && typeof data.message === 'string'
                                  ? data.message
                                  : 'Failed to add';
                              toast.error(message);
                            }
                          }}
                          className="text-sm text-[#6B4D37] hover:text-[#4E1B00] font-medium py-2 px-1 min-h-[44px] flex items-center"
                        >
                          Add to my list
                        </button>
                      )}
                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = globalThis.confirm(
                              `Permanently delete ${name}? This removes their account, appointments, documents, and all associated data. This cannot be undone.`
                            );
                            if (!confirmed) return;
                            try {
                              await ApiClient.getInstance().delete(`/client/${c._id ?? c.id}`);
                              toast.success('Client permanently deleted.');
                              loadClients();
                            } catch (e: unknown) {
                              const data = getErrorResponseData(e);
                              const message =
                                isRecord(data) && typeof data.message === 'string'
                                  ? data.message
                                  : 'Failed to delete client';
                              toast.error(message);
                            }
                          }}
                          className="text-sm text-red-600 hover:text-red-800 font-medium py-2 px-1 min-h-[44px] flex items-center"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
      {/* Inline Client Documents */}
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
        <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
          <h2 className="text-lg font-medium text-dash-text-primary">Client Documents</h2>
          <p className="text-sm text-dash-text-secondary/60 mt-1">
            Document submissions from your clients. Upload or review documents here.
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <BulkDocumentUpload />
          <div className="mt-4">
            <ProviderDocumentsList />
          </div>
        </div>
      </div>
    </div>
  );
};
