/**
 * @module components/provider/tabs/OverviewTab
 * Provider dashboard overview assembling stats, check-in alerts, quick
 * actions, upcoming appointments, to-do list, message center, and activity feed.
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../../api/apiClient';
import { ProviderTodoList } from '../ProviderTodoList';
import { MessageCenter } from '../../MessageCenter';
import type {
  DashboardStats,
  CheckinReviewItem,
  AppointmentLike,
  DocumentLike,
  ActivityItem,
  ProviderClientItem,
} from '../../../pages/providerDashboardUtils';
import {
  isRecord,
  getUserName,
  getErrorResponseData,
} from '../../../pages/providerDashboardUtils';

import { DashboardStatsSection } from './DashboardStatsSection';
import { CheckInsReviewSection } from './CheckInsReviewSection';
import { QuickActionsSection } from './QuickActionsSection';
import { CreateClientModal } from './CreateClientModal';
import { UpcomingAppointmentsSection } from './UpcomingAppointmentsSection';

interface OverviewTabProps {
  user: { id?: string; role?: string } | null;
  isProvider: boolean;
  registerClient: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    providerId?: string;
  }) => Promise<unknown>;
  onNavigate: (tab: string) => void;
  onShowScheduleModal: () => void;
  onCheckinsDetail: (clientUserId: string, clientName: string) => void;
  onPendingAppointmentRequestsChange?: (count: number) => void;
}

/** Main overview tab composing stats, check-in review, quick actions, and activity. */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  user,
  isProvider,
  registerClient,
  onNavigate,
  onShowScheduleModal,
  onCheckinsDetail,
  onPendingAppointmentRequestsChange,
}) => {
  // --- State ---
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    upcomingAppointments: 0,
    pendingCheckins: 0,
    pendingAppointmentRequests: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  const [showClientForm, setShowClientForm] = useState(false);

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [checkinsNeedingReview, setCheckinsNeedingReview] = useState<CheckinReviewItem[]>([]);
  const [checkinsLoading, setCheckinsLoading] = useState(false);

  // --- Handlers ---
  const handleMarkCheckinsReviewed = async (clientUserId: string) => {
    try {
      await ApiClient.getInstance().patch(`/checkins/user/${clientUserId}/mark-reviewed`, {});
      toast.success('Recent check-ins marked as reviewed.');
      setCheckinsNeedingReview((prev) =>
        prev.filter((item) => String(item.clientUserId) !== String(clientUserId))
      );
      setStats((prev) => ({
        ...prev,
        pendingCheckins: Math.max(0, prev.pendingCheckins - 1),
      }));
    } catch (e: unknown) {
      const data = getErrorResponseData(e);
      const message =
        isRecord(data) && typeof data.error === 'string'
          ? data.error
          : 'Failed to mark these check-ins as reviewed. Please try again.';
      toast.error(message);
    }
  };

  // --- Effects ---

  // Mark messages as read when overview loads
  useEffect(() => {
    if (notificationCount > 0) {
      ApiClient.getInstance().put('/messages/read-all', {}).catch(() => {/* non-critical */});
    }
  }, [notificationCount]);

  // Load recent activity for providers
  useEffect(() => {
    if (!isProvider) return;
    let cancelled = false;
    setActivityLoading(true);
    const api = ApiClient.getInstance();
    Promise.all([
      api.get<AppointmentLike[]>('/appointments/upcoming?limit=10').catch(() => []),
      api
        .get<{ documents?: DocumentLike[] } | DocumentLike[]>('/documents?limit=10')
        .then((r) => (Array.isArray(r) ? r : (r as { documents?: DocumentLike[] })?.documents ?? []))
        .catch(() => []),
      api
        .get<{ clients?: ProviderClientItem[] } | ProviderClientItem[]>('/client')
        .then((r) => (Array.isArray(r) ? r : (r as { clients?: ProviderClientItem[] })?.clients ?? []))
        .catch(() => []),
    ])
      .then(([appointments, documents, clients]) => {
        if (cancelled) return;
        const apptList = Array.isArray(appointments) ? (appointments as AppointmentLike[]) : [];
        const docList = Array.isArray(documents) ? (documents as DocumentLike[]) : [];
        const clientList = Array.isArray(clients) ? (clients as ProviderClientItem[]) : [];
        const items: ActivityItem[] = [];
        apptList.forEach((a) => {
          const clientName = a.clientId ? getUserName(a.clientId).name : 'Client';
          const at = a.startTime ? new Date(a.startTime).toISOString() : '';
          items.push({
            type: 'appointment',
            date: at,
            label: `Upcoming: ${clientName}`,
            subtitle: at ? new Date(at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : undefined,
          });
        });
        docList.forEach((d) => {
          const at = d.submissionData?.submittedDate ? new Date(d.submissionData.submittedDate).toISOString() : (d.createdAt ? new Date(d.createdAt).toISOString() : '');
          const from = d.uploadedBy ? getUserName(d.uploadedBy).name : 'Client';
          items.push({
            type: 'document',
            date: at || new Date(0).toISOString(),
            label: d.title ? `Document: ${d.title}` : 'Document submitted',
            subtitle: from ? `from ${from}` : undefined,
          });
        });
        clientList.forEach((c) => {
          const u = c.userId ?? c.user;
          const name = u ? getUserName(u).name : 'Client';
          const at = c.createdAt ? new Date(c.createdAt).toISOString() : '';
          items.push({
            type: 'client',
            date: at,
            label: `Client on your list: ${name}`,
            subtitle: at ? new Date(at).toLocaleDateString(undefined, { dateStyle: 'short' }) : undefined,
          });
        });
        items.sort((a, b) => (b.date > a.date ? 1 : -1));
        setRecentActivity(items.slice(0, 15));
      })
      .catch(() => {
        if (!cancelled) setRecentActivity([]);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });
    return () => { cancelled = true; };
  }, [isProvider]);

  // Load dashboard stats and notification count on mount + 30s polling
  useEffect(() => {
    if (!isProvider) return;

    const logDevError = (label: string, error: unknown) => {
      if (process.env.NODE_ENV === 'development' && error instanceof Error) {
        console.debug(`${label}:`, error.message);
      }
    };

    const fetchNotificationCount = async (
      client: { get: <T>(url: string) => Promise<T> }
    ): Promise<number> => {
      try {
        const res = await client.get<{ count?: number }>('/messages/unread/count');
        return res?.count ?? 0;
      } catch (error) {
        logDevError('Notification count load failed', error);
        return 0;
      }
    };

    const fetchClientCount = async (
      client: { get: <T>(url: string) => Promise<T> }
    ): Promise<number> => {
      try {
        const res = await client.get<
          { data?: unknown[]; clients?: unknown[] } | unknown[]
        >('/providers/me/clients');
        const arr = Array.isArray(res)
          ? res
          : (res as { data?: unknown[] })?.data ?? (res as { clients?: unknown[] })?.clients ?? [];
        return Array.isArray(arr) ? arr.length : 0;
      } catch (error) {
        logDevError('Client count load failed', error);
        return 0;
      }
    };

    const fetchUpcomingCount = async (
      client: { get: <T>(url: string) => Promise<T> }
    ): Promise<number> => {
      try {
        const res = await client.get<{ data?: unknown[] } | unknown[]>(
          '/appointments/upcoming?limit=100'
        );
        const arr = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data ?? [];
        return Array.isArray(arr) ? arr.length : 0;
      } catch (error) {
        logDevError('Appointments load failed', error);
        return 0;
      }
    };

    const fetchPendingCheckinsCount = async (
      client: { get: <T>(url: string) => Promise<T> }
    ): Promise<number> => {
      try {
        const res = await client.get<
          { data?: unknown[]; count?: number } | unknown[]
        >('/checkins/needs-review');
        const arr = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data ?? [];
        return Array.isArray(arr) ? arr.length : (res as { count?: number })?.count ?? 0;
      } catch (error) {
        logDevError('Check-ins load failed', error);
        return 0;
      }
    };

    const fetchPendingAppointmentRequests = async (
      client: { get: <T>(url: string, config?: unknown) => Promise<T> }
    ): Promise<number> => {
      try {
        const res = await client.get<Array<{ status?: string }> | { data?: Array<{ status?: string }> }>(
          '/appointments?limit=100'
        );
        const list = Array.isArray(res) ? res : (res as { data?: Array<{ status?: string }> })?.data ?? [];
        return list.filter((a) => a.status === 'requested').length;
      } catch (error) {
        logDevError('Pending appointment requests count failed', error);
        return 0;
      }
    };

    let cancelled = false;

    const loadDashboardData = async () => {
      setStatsLoading(true);
      const apiClient = ApiClient.getInstance();

      const [nc, totalClients, upcomingAppointments, pendingCheckins, pendingAppointmentRequests] =
        await Promise.all([
          fetchNotificationCount(apiClient),
          fetchClientCount(apiClient),
          fetchUpcomingCount(apiClient),
          fetchPendingCheckinsCount(apiClient),
          fetchPendingAppointmentRequests(apiClient),
        ]);

      if (cancelled) return;
      setNotificationCount(nc);
      setStats((prev) => ({
        ...prev,
        totalClients,
        upcomingAppointments,
        pendingCheckins,
        pendingAppointmentRequests,
      }));
      onPendingAppointmentRequestsChange?.(pendingAppointmentRequests);
      setStatsLoading(false);
    };

    loadDashboardData();

    const interval = setInterval(() => {
      if (!document.hidden) loadDashboardData();
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isProvider, onPendingAppointmentRequestsChange]);

  // Load check-ins needing review
  useEffect(() => {
    let cancelled = false;
    const loadCheckinsNeedingReview = async () => {
      setCheckinsLoading(true);
      try {
        const apiClient = ApiClient.getInstance();
        const res = await apiClient.get<{ data?: CheckinReviewItem[]; count?: number } | CheckinReviewItem[]>(
          '/checkins/needs-review'
        );
        if (cancelled) return;
        const arr = Array.isArray(res) ? res : (res as { data?: CheckinReviewItem[] }).data ?? [];
        setCheckinsNeedingReview(Array.isArray(arr) ? arr : []);
      } catch {
        if (!cancelled) setCheckinsNeedingReview([]);
      } finally {
        if (!cancelled) setCheckinsLoading(false);
      }
    };
    loadCheckinsNeedingReview();
    return () => { cancelled = true; };
  }, []);

  // --- Render ---
  return (
    <>
      <DashboardStatsSection
        stats={stats}
        statsLoading={statsLoading}
        notificationCount={notificationCount}
        onNavigate={onNavigate}
      />

      <CheckInsReviewSection
        checkinsNeedingReview={checkinsNeedingReview}
        checkinsLoading={checkinsLoading}
        onCheckinsDetail={onCheckinsDetail}
        onMarkReviewed={handleMarkCheckinsReviewed}
      />

      <QuickActionsSection
        user={user}
        onCreateClient={() => setShowClientForm(true)}
        onShowScheduleModal={onShowScheduleModal}
        onNavigate={onNavigate}
      />

      {showClientForm && (
        <CreateClientModal
          userId={user?.id}
          registerClient={registerClient}
          onClose={() => setShowClientForm(false)}
        />
      )}

      <UpcomingAppointmentsSection
        recentActivity={recentActivity}
        activityLoading={activityLoading}
      />

      {/* Personal To-Do */}
      <div className="mb-6 sm:mb-8">
        <ProviderTodoList />
      </div>

      {/* Message Center */}
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border mb-6 sm:mb-8">
        <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
          <h2 className="text-lg font-medium text-dash-text-primary">Message Center</h2>
          <p className="text-sm text-dash-text-secondary/60 mt-1">
            Message clients in your list. Real-time via Socket.io when connected.
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <MessageCenter />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
        <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
          <h2 className="text-lg font-medium text-dash-text-primary">Recent Activity</h2>
          <p className="text-sm text-dash-text-secondary/60 mt-1">Upcoming appointments, recent documents from clients, and your client list.</p>
        </div>
        <div className="p-4 sm:p-6">
          {activityLoading ? (
            <p className="text-dash-text-secondary/60 text-center py-8">Loading activity…</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-dash-text-secondary/60 text-center py-8">
              No recent activity yet. Assign clients, get document submissions, or schedule appointments to see activity here.
            </p>
          ) : (
            <ul className="divide-y divide-dash-section-border">
              {recentActivity.map((item, i) => (
                <li key={`${item.type}-${item.date}-${i}`} className="py-3 first:pt-0">
                  <p className="font-medium text-dash-text-primary">{item.label}</p>
                  {item.subtitle && <p className="text-sm text-dash-text-secondary/60 mt-0.5">{item.subtitle}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};
