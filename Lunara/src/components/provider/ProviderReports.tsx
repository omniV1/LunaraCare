/**
 * @module components/provider/ProviderReports
 * Analytics dashboard showing client stats, appointment breakdowns,
 * engagement metrics (messages, resources, blog), and recent activity.
 */
import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/apiClient';
import { DashboardStatSkeleton } from '../ui/Skeleton';

interface RecentActivityItem {
  _id: string;
  clientId?: { firstName?: string; lastName?: string };
  startTime?: string;
  status?: string;
  type?: string;
}

interface AnalyticsData {
  totalClients: number;
  activeClients: number;
  completedClients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  upcomingAppointments: number;
  averageCheckInMood: number | null;
  totalMessages: number;
  totalResources: number;
  totalBlogPosts: number;
  recentActivity: RecentActivityItem[];
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function clientName(client?: { firstName?: string; lastName?: string }): string {
  if (!client) return 'Unknown';
  return [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-[#3F4E4F]/10 text-[#3F4E4F]',
  cancelled: 'bg-red-100 text-red-800',
  scheduled: 'bg-[#6B4D37]/10 text-[#4E1B00]',
  confirmed: 'bg-[#6B4D37]/10 text-[#4E1B00]',
  requested: 'bg-amber-100 text-amber-800',
  'no-show': 'bg-[#EDE8E0]/60 text-dash-text-primary',
};

/** Provider analytics dashboard with stat cards, charts, and recent activity. */
export const ProviderReports: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ApiClient.getInstance().get<AnalyticsData>('/providers/me/analytics');
        if (!cancelled) setData(res);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load analytics. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-8 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-dash-text-primary mb-1">Unable to load reports</h3>
        <p className="text-sm text-dash-text-secondary/60 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-white bg-[#6B4D37] hover:bg-[#5a402e] rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatSkeleton />
          <DashboardStatSkeleton />
          <DashboardStatSkeleton />
          <DashboardStatSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-6 animate-pulse">
            <div className="h-5 bg-[#EDE8E0]/50 rounded w-48 mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-[#EDE8E0]/50 rounded w-full" />
              <div className="h-4 bg-[#EDE8E0]/50 rounded w-3/4" />
              <div className="h-4 bg-[#EDE8E0]/50 rounded w-5/6" />
            </div>
          </div>
          <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-6 animate-pulse">
            <div className="h-5 bg-[#EDE8E0]/50 rounded w-48 mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-[#EDE8E0]/50 rounded w-full" />
              <div className="h-4 bg-[#EDE8E0]/50 rounded w-2/3" />
            </div>
          </div>
        </div>
        <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-6 animate-pulse">
          <div className="h-5 bg-[#EDE8E0]/50 rounded w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 bg-[#EDE8E0]/50 rounded w-32" />
                <div className="h-4 bg-[#EDE8E0]/50 rounded w-24" />
                <div className="h-4 bg-[#EDE8E0]/50 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mood = data.averageCheckInMood;
  const moodColor =
    mood === null ? 'text-dash-text-secondary/40'
    : mood >= 7 ? 'text-[#3F4E4F]'
    : mood >= 5 ? 'text-amber-500'
    : 'text-red-500';
  const moodBg =
    mood === null ? 'bg-[#EDE8E0]/60'
    : mood >= 7 ? 'bg-[#3F4E4F]/5'
    : mood >= 5 ? 'bg-amber-50'
    : 'bg-red-50';
  const moodLabel =
    mood === null ? 'No data'
    : mood >= 7 ? 'Good'
    : mood >= 5 ? 'Moderate'
    : 'Needs attention';

  const apptTotal = data.totalAppointments || 1;
  const completedPct = Math.round((data.completedAppointments / apptTotal) * 100);
  const cancelledPct = Math.round((data.cancelledAppointments / apptTotal) * 100);
  const upcomingPct = Math.round((data.upcomingAppointments / apptTotal) * 100);
  const otherPct = Math.max(0, 100 - completedPct - cancelledPct - upcomingPct);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Clients"
          value={data.totalClients}
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          iconBg="bg-[#3F4E4F]/10"
          iconColor="text-[#3F4E4F]"
        />
        <StatCard
          label="Active Clients"
          value={data.activeClients}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          iconBg="bg-[#6B4D37]/10"
          iconColor="text-[#6B4D37]"
        />
        <StatCard
          label="Completed Clients"
          value={data.completedClients}
          icon="M5 13l4 4L19 7"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Upcoming Appointments"
          value={data.upcomingAppointments}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Appointment Breakdown + Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointment Breakdown */}
        <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
          <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
            <h3 className="text-lg font-medium text-dash-text-primary">Appointment Breakdown</h3>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {/* Visual bar */}
            {data.totalAppointments > 0 ? (
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-[#EDE8E0]/60">
                {completedPct > 0 && (
                  <div
                    className="bg-[#3F4E4F] transition-all"
                    style={{ width: `${completedPct}%` }}
                    title={`Completed: ${data.completedAppointments}`}
                  />
                )}
                {upcomingPct > 0 && (
                  <div
                    className="bg-[#6B4D37] transition-all"
                    style={{ width: `${upcomingPct}%` }}
                    title={`Upcoming: ${data.upcomingAppointments}`}
                  />
                )}
                {cancelledPct > 0 && (
                  <div
                    className="bg-red-400 transition-all"
                    style={{ width: `${cancelledPct}%` }}
                    title={`Cancelled: ${data.cancelledAppointments}`}
                  />
                )}
                {otherPct > 0 && (
                  <div
                    className="bg-[#EDE8E0] transition-all"
                    style={{ width: `${otherPct}%` }}
                    title="Other"
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-4 rounded-full bg-[#EDE8E0]/60" />
            )}

            <div className="grid grid-cols-2 gap-3">
              <MetricRow color="bg-[#3F4E4F]" label="Completed" value={data.completedAppointments} />
              <MetricRow color="bg-[#6B4D37]" label="Upcoming" value={data.upcomingAppointments} />
              <MetricRow color="bg-red-400" label="Cancelled" value={data.cancelledAppointments} />
              <MetricRow color="bg-dash-section-border" label="Total" value={data.totalAppointments} />
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
          <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
            <h3 className="text-lg font-medium text-dash-text-primary">Engagement Metrics</h3>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {/* Mood indicator */}
            <div className={`rounded-lg p-4 ${moodBg}`}>
              <p className="text-xs font-medium text-dash-text-secondary/60 uppercase tracking-wide mb-1">
                Avg Client Check-in Mood
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${moodColor}`}>
                  {mood !== null ? mood.toFixed(1) : '—'}
                </span>
                <span className="text-sm text-dash-text-secondary/60">/ 10</span>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                  mood === null ? 'bg-[#EDE8E0]/60 text-dash-text-secondary/80'
                  : mood >= 7 ? 'bg-[#3F4E4F]/20 text-[#4E1B00]'
                  : mood >= 5 ? 'bg-amber-200 text-amber-800'
                  : 'bg-red-200 text-red-800'
                }`}>
                  {moodLabel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <EngagementCard
                icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                label="Messages Sent"
                value={data.totalMessages}
              />
              <EngagementCard
                icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                label="Resources"
                value={data.totalResources}
              />
              <EngagementCard
                icon="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                label="Blog Posts"
                value={data.totalBlogPosts}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
        <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
          <h3 className="text-lg font-medium text-dash-text-primary">Recent Appointments</h3>
          <p className="text-sm text-dash-text-secondary/60 mt-1">Your latest appointment activity</p>
        </div>
        <div className="divide-y divide-dash-section-border">
          {data.recentActivity.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-dash-text-secondary/60">No appointment activity yet.</p>
            </div>
          ) : (
            data.recentActivity.map((item) => {
              const status = item.status ?? 'unknown';
              const badgeStyle = STATUS_STYLES[status] ?? 'bg-[#EDE8E0]/60 text-dash-text-secondary';
              return (
                <div key={item._id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-dash-text-primary truncate">
                      {clientName(item.clientId)}
                    </p>
                    <p className="text-sm text-dash-text-secondary/60">
                      {formatDate(item.startTime)}
                      {formatTime(item.startTime) && ` at ${formatTime(item.startTime)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${badgeStyle}`}>
                      {status}
                    </span>
                    {item.type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EDE8E0]/60 text-dash-text-secondary capitalize">
                        {item.type}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  iconBg: string;
  iconColor: string;
}> = ({ label, value, icon, iconBg, iconColor }) => (
  <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-4 sm:p-6">
    <div className="flex items-center">
      <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>
        <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div className="ml-4 min-w-0">
        <p className="text-sm font-medium text-dash-text-secondary/80 truncate">{label}</p>
        <p className="text-2xl font-semibold text-dash-text-primary">{value}</p>
      </div>
    </div>
  </div>
);

const MetricRow: React.FC<{ color: string; label: string; value: number }> = ({ color, label, value }) => (
  <div className="flex items-center gap-2">
    <span className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
    <span className="text-sm text-dash-text-secondary/80">{label}</span>
    <span className="ml-auto text-sm font-semibold text-dash-text-primary">{value}</span>
  </div>
);

const EngagementCard: React.FC<{ icon: string; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="rounded-lg border border-dash-section-border p-3 text-center">
    <svg className="w-5 h-5 text-dash-text-secondary/40 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
    </svg>
    <p className="text-2xl font-bold text-dash-text-primary">{value}</p>
    <p className="text-xs text-dash-text-secondary/60">{label}</p>
  </div>
);
