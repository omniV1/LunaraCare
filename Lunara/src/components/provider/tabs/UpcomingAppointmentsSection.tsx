import React from 'react';
import type { ActivityItem } from '../../../pages/providerDashboardUtils';

interface UpcomingAppointmentsSectionProps {
  recentActivity: ActivityItem[];
  activityLoading: boolean;
}

export const UpcomingAppointmentsSection: React.FC<UpcomingAppointmentsSectionProps> = ({
  recentActivity,
  activityLoading,
}) => {
  const appointments = recentActivity.filter(a => a.type === 'appointment');

  return (
    <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border mb-6 sm:mb-8">
      <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
        <h2 className="text-lg font-medium text-dash-text-primary">Upcoming Appointments</h2>
        <p className="text-sm text-dash-text-secondary/60 mt-1">Your next scheduled appointments with clients.</p>
      </div>
      <div className="p-4 sm:p-6">
        {activityLoading ? (
          <p className="text-dash-text-secondary/60 text-center py-4">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-dash-text-secondary/60 text-center py-4">No upcoming appointments.</p>
        ) : (
          <ul className="divide-y divide-dash-section-border">
            {appointments.slice(0, 5).map((item, i) => (
              <li key={`appt-${i}`} className="py-3 flex items-center justify-between first:pt-0">
                <div className="min-w-0">
                  <p className="font-medium text-dash-text-primary truncate">{item.label}</p>
                </div>
                {item.subtitle && (
                  <span className="text-xs font-mono text-dash-text-secondary/60 shrink-0 ml-3 bg-[#EDE8E0]/60 px-2 py-1 rounded-md">
                    {item.subtitle}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
