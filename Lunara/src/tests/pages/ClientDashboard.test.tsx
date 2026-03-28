import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import ClientDashboard from '../../pages/ClientDashboard';

const mockUseAuth = jest.fn();
jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseResource = jest.fn();
jest.mock('../../contexts/useResource', () => ({
  useResource: () => mockUseResource(),
}));

jest.mock('../../components/client/ClientDashboardLayout', () => ({
  ClientDashboardLayout: ({ navItems, activeTab, onTabChange, children }: { navItems: { id: string; label: string }[]; activeTab: string; onTabChange: (id: string) => void; children: React.ReactNode }) => (
    <div>
      <div>active:{activeTab}</div>
      <div>
        {navItems.map((n: { id: string; label: string }) => (
          <button key={n.id} onClick={() => onTabChange(n.id)}>
            {n.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  ),
}));

jest.mock('../../components/client/MoodCheckIn', () => ({ MoodCheckIn: () => <div>mood</div> }));
jest.mock('../../components/documents/DocumentsList', () => ({ DocumentsList: () => <div>docs-list</div> }));
jest.mock('../../components/documents/DocumentUpload', () => ({ DocumentUpload: () => <div>upload</div> }));
jest.mock('../../components/resource/ResourceLibrary', () => ({ ResourceLibrary: () => <div>library</div> }));
jest.mock('../../components/resource/ResourceViewModal', () => ({ ResourceViewModal: () => <div>view-modal</div> }));
jest.mock('../../components/client/ClientSettings', () => ({ ClientSettings: () => <div>settings</div> }));
jest.mock('../../components/MessagesList', () => ({ MessagesList: () => <div>messages</div> }));
jest.mock('../../components/ClientMessageProvider', () => ({ ClientMessageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('../../components/client/ClientAppointments.tsx', () => ({ ClientAppointments: () => <div>appointments</div> }));

const api = { get: jest.fn() };
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: () => api },
}));

jest.mock('../../services/documentService', () => ({
  documentService: { getDocuments: () => Promise.resolve([]) },
}));
jest.mock('../../services/blogService', () => ({
  blogService: { getBlogPosts: jest.fn() },
}));

import { documentService } from '../../services/documentService';
import { blogService } from '../../services/blogService';

describe('ClientDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseResource.mockReturnValue({
      resources: [
        { id: 'r1', isPublished: true },
        { id: 'r2', isPublished: false },
      ],
    });
  });

  it('redirects to login when not client', () => {
    mockUseAuth.mockReturnValue({ isClient: false });
    render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>,
    );
    // Navigate renders nothing visible; sanity check that overview content isn't present
    expect(screen.queryByText('mood')).not.toBeInTheDocument();
  });

  it('loads counts and switches tabs', async () => {
    mockUseAuth.mockReturnValue({ isClient: true });
    Object.defineProperty(documentService, 'getDocuments', {
      value: jest.fn().mockResolvedValue([{ id: 'd1' }]),
      writable: true,
      configurable: true,
    });
    api.get.mockImplementation((path: string) => {
      if (path.includes('/messages/unread/count')) return Promise.resolve({ count: 2 });
      if (path.includes('/appointments/upcoming')) return Promise.resolve([{ id: 'a1' }]);
      return Promise.resolve({});
    });
    (blogService.getBlogPosts as jest.Mock).mockResolvedValue({ posts: [{ id: 'b1', isPublished: true }] });

    render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => expect(documentService.getDocuments).toHaveBeenCalled());
    expect(screen.getByText('mood')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Messages' }));
    expect(screen.getByText('messages')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Appointments' }));
    expect(screen.getByText('appointments')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
    expect(screen.getByText('settings')).toBeInTheDocument();
  });
});
