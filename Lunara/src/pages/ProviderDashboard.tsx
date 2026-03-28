import React, { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { ProviderClientProfileEdit } from '../components/client/ProviderClientProfileEdit';
import { ScheduleAppointmentModal } from '../components/ScheduleAppointmentModal';
import { CarePlanManager } from '../components/client/CarePlanManager';
import { ProviderClientCheckIns } from '../components/provider/ProviderClientCheckIns';
import { ProviderCalendar } from '../components/provider/ProviderCalendar';
import { ProviderProfileEdit } from '../components/provider/ProviderProfileEdit';
import { PushNotificationToggle } from '../components/PushNotificationToggle';
import { ProviderDashboardLayout, type NavItem } from '../components/provider/ProviderDashboardLayout';
import { OverviewTab } from '../components/provider/tabs/OverviewTab';
import { ClientsTab } from '../components/provider/tabs/ClientsTab';
import { BlogTab } from '../components/provider/tabs/BlogTab';
import { CreateProviderTab } from '../components/provider/tabs/CreateProviderTab';

type TabId = 'overview' | 'clients' | 'schedule' | 'blog' | 'profile' | 'createProvider';

const ProviderDashboard: React.FC = () => {
  const { user, isProvider, registerClient } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Page-level modals that overlay on top of any tab
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [carePlanClient, setCarePlanClient] = useState<{ clientId: string; clientUserId: string; clientName: string } | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [checkinsDetailClient, setCheckinsDetailClient] = useState<{
    clientUserId: string;
    clientName: string;
  } | null>(null);

  // Stats badge for schedule tab (passed up from OverviewTab)
  const [pendingAppointmentRequests, setPendingAppointmentRequests] = useState(0);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: pendingAppointmentRequests,
    },
    {
      id: 'blog',
      label: 'Blog',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'createProvider',
      label: 'Add Provider',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
  ];

  return (
    <ProviderDashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as TabId)}
    >
      <div className="min-w-0 overflow-x-hidden w-full max-w-full">
        {activeTab === 'overview' && (
          <OverviewTab
            user={user}
            isProvider={isProvider}
            registerClient={registerClient}
            onNavigate={(tab) => setActiveTab(tab as TabId)}
            onShowScheduleModal={() => setShowScheduleModal(true)}
            onCheckinsDetail={(userId, name) => setCheckinsDetailClient({ clientUserId: userId, clientName: name })}
            onPendingAppointmentRequestsChange={setPendingAppointmentRequests}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsTab
            user={user}
            onEditClient={(id) => setEditingClientId(id)}
            onCarePlan={(clientId, clientUserId, clientName) => setCarePlanClient({ clientId, clientUserId, clientName })}
          />
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <ProviderCalendar />
          </div>
        )}

        {activeTab === 'blog' && <BlogTab />}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
              <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
                <h2 className="text-lg font-medium text-dash-text-primary">My Profile</h2>
                <p className="text-sm text-dash-text-secondary/60 mt-1">
                  Edit your name, certifications, bio, contact info, and availability. This is shown to clients.
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <ProviderProfileEdit />
              </div>
            </div>
            <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
              <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
                <h2 className="text-lg font-medium text-dash-text-primary">Notifications</h2>
                <p className="text-sm text-dash-text-secondary/60 mt-1">
                  Manage how you receive alerts about appointments and messages.
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <PushNotificationToggle />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'createProvider' && <CreateProviderTab />}
      </div>

      {editingClientId && (
        <ProviderClientProfileEdit
          clientId={editingClientId}
          onClose={() => setEditingClientId(null)}
          onSaved={() => {}}
        />
      )}

      {showScheduleModal && (
        <ScheduleAppointmentModal
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => {}}
        />
      )}

      {carePlanClient && (
        <CarePlanManager
          clientId={carePlanClient.clientId}
          clientUserId={carePlanClient.clientUserId}
          clientName={carePlanClient.clientName}
          onClose={() => setCarePlanClient(null)}
        />
      )}

      {checkinsDetailClient && (
        <ProviderClientCheckIns
          clientUserId={checkinsDetailClient.clientUserId}
          clientName={checkinsDetailClient.clientName}
          onClose={() => setCheckinsDetailClient(null)}
        />
      )}
    </ProviderDashboardLayout>
  );
};

export default ProviderDashboard;
