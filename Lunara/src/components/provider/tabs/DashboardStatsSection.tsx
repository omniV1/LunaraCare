import React from 'react';
import { DashboardStatSkeleton } from '../../ui/Skeleton';
import type { DashboardStats } from '../../../pages/providerDashboardUtils';

interface DashboardStatsSectionProps {
  stats: DashboardStats;
  statsLoading: boolean;
  notificationCount: number;
  onNavigate: (tab: string) => void;
}

export const DashboardStatsSection: React.FC<DashboardStatsSectionProps> = ({
  stats,
  statsLoading,
  notificationCount,
  onNavigate,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-8">
      <div className="flex items-center gap-3 flex-wrap">
        {statsLoading ? (
          <>
            <DashboardStatSkeleton />
            <DashboardStatSkeleton />
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6B4D37]/10 border border-[#6B4D37]/20 text-sm font-medium text-[#6B4D37]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Active Clients: <span className="font-bold">{stats.totalClients}</span>
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#AA6641]/10 border border-[#AA6641]/20 text-sm font-medium text-[#AA6641]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending Inquiries: <span className="font-bold">{stats.pendingCheckins}</span>
            </span>
          </>
        )}
      </div>
      {/* Notification Bell */}
      <button
        type="button"
        onClick={() => onNavigate('overview')}
        className="relative p-2.5 rounded-xl bg-dash-card border border-dash-border shadow-sm hover:shadow-md transition-all"
        title="Notifications"
      >
        <svg className="w-5 h-5 text-dash-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {notificationCount}
          </span>
        )}
      </button>
    </div>
  );
};
