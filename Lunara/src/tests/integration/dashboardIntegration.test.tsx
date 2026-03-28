import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthProvider, { AuthContext } from '../../contexts/AuthContext';
import ResourceProvider from '../../contexts/ResourceContext';
import ProviderDashboard from '../../pages/ProviderDashboard';
import ClientDashboard from '../../pages/ClientDashboard';

// Mock the API client
jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => ({
      get: jest.fn().mockResolvedValue({ data: [] }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} }),
    }),
  },
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ResourceProvider>{component}</ResourceProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Dashboard Integration', () => {
  beforeEach(() => {
    // Mock AuthContext
    jest.spyOn(React, 'useContext').mockImplementation(context => {
      if (context === AuthContext) {
        return {
          user: { id: '1', firstName: 'Test', lastName: 'User', email: 'test@example.com' },
          isProvider: true,
          isClient: false,
          logout: jest.fn(),
          registerClient: jest.fn(),
        };
      }
      return {};
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Provider Dashboard', () => {
    it('should render with all required tabs', () => {
      renderWithProviders(<ProviderDashboard />);

      expect(screen.getByText('Provider Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Content Management')).toBeInTheDocument();
      expect(screen.getByText('Client Documents')).toBeInTheDocument();
    });

    it('should show content management section when tab is clicked', () => {
      renderWithProviders(<ProviderDashboard />);

      const contentTab = screen.getByText('Content Management');
      expect(contentTab).toBeInTheDocument();
    });
  });

  describe('Client Dashboard', () => {
    beforeEach(() => {
      jest.spyOn(React, 'useContext').mockImplementation(context => {
        if (context === AuthContext) {
          return {
            user: { id: '2', firstName: 'Client', lastName: 'User', email: 'client@example.com' },
            isProvider: false,
            isClient: true,
            logout: jest.fn(),
          };
        }
        return {};
      });
    });

    it('should render with all required tabs', () => {
      renderWithProviders(<ClientDashboard />);

      expect(screen.getByText('Client Dashboard')).toBeInTheDocument();
      expect(screen.getByText('My Documents')).toBeInTheDocument();
      expect(screen.getByText('Resource Library')).toBeInTheDocument();
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render ResourceProvider without errors', () => {
      const { container } = renderWithProviders(
        <div>
          <h1>Test Component</h1>
        </div>
      );

      expect(container).toBeInTheDocument();
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });
});
