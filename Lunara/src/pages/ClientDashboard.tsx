/**
 * @module ClientDashboard
 * Primary dashboard for authenticated clients. Provides tabbed navigation
 * across overview stats, messages, appointments, and profile/documents.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DocumentsList } from '../components/documents/DocumentsList';
import { DocumentUpload } from '../components/documents/DocumentUpload';
import { ResourceLibrary } from '../components/resource/ResourceLibrary';
import { ResourceViewModal } from '../components/resource/ResourceViewModal';
import type { Resource } from '../services/resourceService';
import { ClientSettings } from '../components/client/ClientSettings';
import { MessagesList } from '../components/MessagesList';
import { ClientMessageProvider } from '../components/ClientMessageProvider';
import { ClientAppointments } from '../components/client/ClientAppointments.tsx';
import { MoodCheckIn } from '../components/client/MoodCheckIn';
import { ClientDocument, documentService } from '../services/documentService';
import { blogService, type BlogPost } from '../services/blogService';
import { ApiClient } from '../api/apiClient';
import { useResource } from '../contexts/useResource';
import { ClientDashboardLayout, type NavItem } from '../components/client/ClientDashboardLayout';

/** Identifiers for the client dashboard navigation tabs. */
type TabId = 'overview' | 'messages' | 'appointments' | 'profile';

/**
 * Client dashboard page rendered at `/client/dashboard`.
 * Shows stats cards, mood check-ins, blog suggestions, resources,
 * messaging, appointments, and profile/document management.
 * Redirects to `/login` if the user is not a client.
 * @returns The tabbed client dashboard layout.
 */
const ClientDashboard: React.FC = () => {
  const { isClient } = useAuth();
  const { resources } = useResource();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [showResources, setShowResources] = useState(false);

  const loadCounts = useCallback(async () => {
    const apiClient = ApiClient.getInstance();

    // allSettled so one failing endpoint doesn't break the whole dashboard
    const [notifResult, docsResult, apptResult] = await Promise.allSettled([
      apiClient.get<{ count?: number }>('/messages/unread/count'),
      documentService.getDocuments(),
      apiClient.get<{ data?: unknown[] } | unknown[]>('/appointments/upcoming?limit=100'),
    ]);

    if (notifResult.status === 'fulfilled') {
      setNotificationCount(notifResult.value?.count ?? 0);
    }
    if (docsResult.status === 'fulfilled') {
      const documents = Array.isArray(docsResult.value)
        ? docsResult.value
        : (docsResult.value as { documents?: unknown[] }).documents ?? [];
      setDocumentCount(documents.length);
    }
    if (apptResult.status === 'fulfilled') {
      const appointments = Array.isArray(apptResult.value)
        ? apptResult.value
        : (apptResult.value as { data?: unknown[] })?.data ?? [];
      setUpcomingAppointments(Array.isArray(appointments) ? appointments.length : 0);
    }
  }, []);

  useEffect(() => {
    loadCounts();
    // Poll every 60s as a fallback; real-time updates come via socket events.
    // Skip when the tab is backgrounded to avoid wasted API calls.
    const interval = setInterval(() => {
      if (!document.hidden) loadCounts();
    }, 60_000);

    const handleVisibility = () => {
      if (!document.hidden) loadCounts();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadCounts]);

  const resourceCount = resources.filter(r => r.isPublished).length;

  useEffect(() => {
    const loadBlogPosts = async () => {
      try {
        const response = await blogService.getBlogPosts({ limit: 4 });
        setBlogPosts(response.posts?.filter(p => p.isPublished) ?? []);
      } catch { /* non-critical */ }
    };
    loadBlogPosts();
  }, []);

  const refreshDocumentCount = async () => {
    try {
      const documentsResponse = await documentService.getDocuments();
      const documents = Array.isArray(documentsResponse)
        ? documentsResponse
        : (documentsResponse as { documents?: unknown[] }).documents ?? [];
      setDocumentCount(documents.length);
    } catch { /* non-critical */ }
  };

  const handleViewDocument = async (clientDocument: ClientDocument) => {
    if (clientDocument.files && clientDocument.files.length > 0) {
      const file = clientDocument.files[0];

      // Some files are stored as base64 data URIs (offline/draft uploads) rather than Cloudinary URLs
      if (file.cloudinaryUrl.startsWith('data:')) {
        const blob = dataURItoBlob(file.cloudinaryUrl);
        const url = URL.createObjectURL(blob);
        const a = globalThis.document.createElement('a');
        a.href = url;
        a.download = file.originalFileName;
        globalThis.document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('File download started');
        return;
      }

      try {
        const newTab = window.open(file.cloudinaryUrl, '_blank');
        if (!newTab) {
          toast.error('Failed to open file. Please check your popup blocker.');
        }
      } catch {
        toast.error('Failed to view document');
      }
    } else {
      toast.error('No file to view');
    }
  };

  const dataURItoBlob = (dataURI: string): Blob => {
    const parts = dataURI.split(',');
    if (parts.length < 2) {
      return new Blob([dataURI], { type: 'application/octet-stream' });
    }
    const byteString = atob(parts[1]);
    const metaParts = parts[0].split(':');
    const mimeString = metaParts.length > 1 ? metaParts[1].split(';')[0] : 'application/octet-stream';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.codePointAt(i) ?? 0;
    }
    return new Blob([ab], { type: mimeString });
  };

  if (!isClient) {
    return <Navigate to="/login" replace />;
  }

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'messages',
      label: 'Messages',
      badge: notificationCount > 0 ? notificationCount : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
  ];

  return (
    <ClientDashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as TabId)}
    >
      <div className="min-w-0 overflow-x-hidden w-full">
        {/* ═══ OVERVIEW ═══ */}
        {activeTab === 'overview' && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
              <StatCard
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                label="My Documents"
                value={documentCount}
                onClick={() => setActiveTab('profile')}
                accentIndex={0}
              />
              <StatCard
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
                label="Resources"
                value={resourceCount}
                onClick={() => setShowResources(!showResources)}
                accentIndex={1}
              />
              <StatCard
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                label="Upcoming Appointments"
                value={upcomingAppointments}
                onClick={() => setActiveTab('appointments')}
                accentIndex={2}
              />
            </div>

            {/* Mood Check-In */}
            <div className="mb-5 sm:mb-6">
              <MoodCheckIn />
            </div>

            {/* Suggested Reading */}
            <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border mb-5 sm:mb-6">
              <div className="px-5 sm:px-6 py-5 border-b border-dash-section-border bg-gradient-to-r from-[#3F4E4F]/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full bg-gradient-to-b from-[#3F4E4F] to-[#8C9A8C]" />
                  <div>
                    <h2 className="font-roman text-lg text-dash-text-primary tracking-wide">Suggested Reading</h2>
                    <p className="text-sm text-dash-text-secondary/60 mt-0.5 font-roman">
                      Articles for your postpartum journey
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResources(!showResources)}
                  className="px-4 py-2 text-sm font-medium text-[#3F4E4F] bg-[#3F4E4F]/10 hover:bg-[#3F4E4F]/20 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Resources
                </button>
              </div>
              <div className="p-4 sm:p-6">
                {blogPosts.length === 0 ? (
                  <p className="text-sm text-dash-text-secondary/60 text-center py-4">
                    No articles available yet. Check back soon!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {blogPosts.map(post => (
                      <a
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-xl border border-dash-border hover:border-[#3F4E4F]/30 hover:shadow-sm transition-all group"
                      >
                        {post.featuredImage && (
                          <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                            <img
                              src={post.featuredImage}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <h3 className="font-medium text-sm text-dash-text-primary group-hover:text-[#3F4E4F] line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-xs text-dash-text-secondary/60 mt-1 line-clamp-2">{post.excerpt}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {post.category && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#3F4E4F]/10 text-[#3F4E4F]">
                              {post.category}
                            </span>
                          )}
                          {post.readTime && (
                            <span className="text-[10px] text-dash-text-secondary/50">{post.readTime} min read</span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resources Section (togglable) */}
            {showResources && (
              <div className="mb-5 sm:mb-6">
                <ResourceLibrary onResourceSelect={setSelectedResource} />
                <ResourceViewModal resource={selectedResource} onClose={() => setSelectedResource(null)} />
              </div>
            )}
          </>
        )}

        {/* ═══ MESSAGES ═══ */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border overflow-hidden">
              <MessagesList
                onNotificationCleared={() => {
                  const apiClient = ApiClient.getInstance();
                  apiClient.get<{ count?: number }>('/messages/unread/count').then(
                    (r) => setNotificationCount(r?.count ?? 0)
                  ).catch(() => { /* non-critical */ });
                }}
              />
            </div>
            <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border overflow-hidden">
              <div className="px-5 sm:px-6 py-5 border-b border-dash-section-border bg-gradient-to-r from-[#6B4D37]/5 to-transparent flex items-center gap-3">
                <div className="w-1 h-10 rounded-full bg-gradient-to-b from-[#6B4D37] to-[#A27B5C]" />
                <div>
                  <h2 className="font-roman text-lg text-dash-text-primary tracking-wide">Message Your Provider</h2>
                  <p className="text-sm text-dash-text-secondary/60 mt-0.5 font-roman">
                    Chat with your assigned provider. Real-time when connected.
                  </p>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <ClientMessageProvider />
              </div>
            </div>
          </div>
        )}

        {/* ═══ APPOINTMENTS ═══ */}
        {activeTab === 'appointments' && (
          <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-dash-section-border bg-gradient-to-r from-[#AA6641]/5 to-transparent flex items-center gap-3">
              <div className="w-1 h-10 rounded-full bg-gradient-to-b from-[#AA6641] to-[#D4956B]" />
              <div>
                <h2 className="font-roman text-lg text-dash-text-primary tracking-wide">Appointments</h2>
                <p className="text-sm text-dash-text-secondary/60 mt-0.5 font-roman">
                  View upcoming appointments and request a new time with your provider.
                </p>
              </div>
            </div>
            <ClientAppointments />
          </div>
        )}

        {/* ═══ PROFILE ═══ */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border overflow-hidden">
              <ClientSettings />
            </div>

            {/* Document Upload */}
            <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border overflow-hidden">
              <div className="px-5 sm:px-6 py-5 border-b border-dash-section-border bg-gradient-to-r from-[#6B4D37]/5 to-transparent flex items-center gap-3">
                <div className="w-1 h-10 rounded-full bg-gradient-to-b from-[#6B4D37] to-[#A27B5C]" />
                <div>
                  <h2 className="font-roman text-lg text-dash-text-primary tracking-wide">Upload Documents</h2>
                  <p className="text-sm text-dash-text-secondary/60 mt-0.5 font-roman">
                    Upload insurance cards, birth plans, and other important documents.
                  </p>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <DocumentUpload onDocumentCreated={refreshDocumentCount} />
              </div>
            </div>

            {/* Document List */}
            <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border overflow-hidden">
              <div className="px-5 sm:px-6 py-5 border-b border-dash-section-border">
                <h2 className="font-roman text-lg text-dash-text-primary tracking-wide">My Documents</h2>
                <p className="text-sm text-dash-text-secondary/60 mt-0.5 font-roman">
                  View and manage your uploaded documents.
                </p>
              </div>
              <DocumentsList onView={handleViewDocument} onRefresh={refreshDocumentCount} />
            </div>
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

/** Color accent theme presets for the dashboard stat cards. */
const STAT_ACCENTS = [
  { bg: 'bg-[#6B4D37]', iconBg: 'bg-[#6B4D37]/10', iconText: 'text-[#6B4D37]', bar: 'from-[#6B4D37] to-[#A27B5C]' },
  { bg: 'bg-[#3F4E4F]', iconBg: 'bg-[#3F4E4F]/10', iconText: 'text-[#3F4E4F]', bar: 'from-[#3F4E4F] to-[#8C9A8C]' },
  { bg: 'bg-[#AA6641]', iconBg: 'bg-[#AA6641]/10', iconText: 'text-[#AA6641]', bar: 'from-[#AA6641] to-[#D4956B]' },
];

/**
 * Compact stat card used in the client dashboard overview row.
 * @param props.icon - SVG icon element displayed beside the label.
 * @param props.label - Short descriptor (e.g. "My Documents").
 * @param props.value - Numeric count to display.
 * @param props.onClick - Callback when the card is clicked.
 * @param props.accentIndex - Index into {@link STAT_ACCENTS} for theming.
 * @returns A styled clickable stat card.
 */
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  onClick: () => void;
  accentIndex?: number;
}> = ({ icon, label, value, onClick, accentIndex = 0 }) => {
  const accent = STAT_ACCENTS[accentIndex % STAT_ACCENTS.length];
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] p-4 sm:p-5 flex items-center gap-4 min-w-0 text-left hover:shadow-[var(--dash-card-shadow-hover)] hover:-translate-y-0.5 transition-all duration-200 w-full group overflow-hidden border border-dash-border"
    >
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${accent.bar} rounded-l-2xl`} />
      <div className={`p-2.5 ${accent.iconBg} rounded-xl ${accent.iconText} group-hover:scale-110 transition-transform duration-200 shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-roman text-xs uppercase tracking-widest text-dash-text-secondary/60 truncate">{label}</p>
        <p className="text-2xl font-semibold text-dash-text-primary font-serif mt-0.5">{value}</p>
      </div>
    </button>
  );
};

export default ClientDashboard;
