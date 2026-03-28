import React from 'react';
import { toast } from 'react-toastify';

interface QuickActionsSectionProps {
  user: { id?: string; role?: string } | null;
  onCreateClient: () => void;
  onShowScheduleModal: () => void;
  onNavigate: (tab: string) => void;
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  user,
  onCreateClient,
  onShowScheduleModal,
  onNavigate,
}) => {
  return (
    <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border mb-8">
      <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
        <h2 className="text-lg font-medium text-dash-text-primary">Quick Actions</h2>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={onCreateClient}
            className="flex items-center justify-center px-4 py-3 border border-dash-border rounded-md shadow-sm text-sm font-medium text-dash-text-secondary bg-dash-card hover:bg-[#EDE8E0]/50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Client
          </button>

          <button
            onClick={() =>
              (user?.role === 'provider' || user?.role === 'admin')
                ? onShowScheduleModal()
                : toast.info(
                    'Appointment scheduling is available for providers. Use the client request flow as a client.'
                  )
            }
            className="flex items-center justify-center px-4 py-3 border border-dash-border rounded-md shadow-sm text-sm font-medium text-dash-text-secondary bg-dash-card hover:bg-[#EDE8E0]/50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Schedule Appointment
          </button>

          <button
            onClick={() => onNavigate('clients')}
            className="flex items-center justify-center px-4 py-3 border border-dash-border rounded-md shadow-sm text-sm font-medium text-dash-text-secondary bg-dash-card hover:bg-[#EDE8E0]/50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            View Clients
          </button>

          <button
            onClick={() => onNavigate('blog')}
            className="flex items-center justify-center px-4 py-3 border border-dash-border rounded-md shadow-sm text-sm font-medium text-dash-text-secondary bg-dash-card hover:bg-[#EDE8E0]/50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            Blog &amp; Resources
          </button>
        </div>
      </div>
    </div>
  );
};
