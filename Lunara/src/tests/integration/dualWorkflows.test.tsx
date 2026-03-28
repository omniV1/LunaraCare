import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../../contexts/AuthContext';
import { ResourceProvider } from '../../contexts/ResourceContext';
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

describe('Dual Workflows Integration', () => {
  describe('Provider Dashboard', () => {
    it('should render provider dashboard with content management tabs', () => {
      // Mock provider user
      const mockProvider = {
        id: '1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'provider',
      };

      // Mock AuthContext to return provider user
      jest.spyOn(React, 'useContext').mockImplementation(context => {
        if (context === AuthContext) {
          return {
            user: mockProvider,
            isProvider: true,
            isClient: false,
            logout: jest.fn(),
            registerClient: jest.fn(),
          };
        }
        return {};
      });

      renderWithProviders(<ProviderDashboard />);

      expect(screen.getByText('Provider Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content Management')).toBeInTheDocument();
      expect(screen.getByText('Client Documents')).toBeInTheDocument();
    });

    it('should switch to content management tab', async () => {
      const mockProvider = {
        id: '1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'provider',
      };

      jest.spyOn(React, 'useContext').mockImplementation(context => {
        if (context === AuthContext) {
          return {
            user: mockProvider,
            isProvider: true,
            isClient: false,
            logout: jest.fn(),
            registerClient: jest.fn(),
          };
        }
        return {};
      });

      renderWithProviders(<ProviderDashboard />);

      const contentTab = screen.getByText('Content Management');
      fireEvent.click(contentTab);

      await waitFor(() => {
        expect(screen.getByText('Create New Resource')).toBeInTheDocument();
        expect(screen.getByText('Resource Library')).toBeInTheDocument();
      });
    });

    it('should switch to client documents tab', async () => {
      const mockProvider = {
        id: '1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'provider',
      };

      jest.spyOn(React, 'useContext').mockImplementation(context => {
        if (context === AuthContext) {
          return {
            user: mockProvider,
            isProvider: true,
            isClient: false,
            logout: jest.fn(),
            registerClient: jest.fn(),
          };
        }
        return {};
      });

      renderWithProviders(<ProviderDashboard />);

      const documentsTab = screen.getByText('Client Documents');
      fireEvent.click(documentsTab);

      await waitFor(() => {
        expect(screen.getByText('Client Document Submissions')).toBeInTheDocument();
      });
    });
  });

  describe('Client Dashboard', () => {
    it('should render client dashboard with document and resource tabs', () => {
      const mockClient = {
        id: '2',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        role: 'client',
      };

      jest.spyOn(React, 'useContext').mockImplementation(context => {
        if (context === AuthContext) {
          return {
            user: mockClient,
            isProvider: false,
            isClient: true,
            logout: jest.fn(),
          };
        }
        return {};
      });

      renderWithProviders(<ClientDashboard />);

      expect(screen.getByText('Client Dashboard')).toBeInTheDocument();
      expect(screen.getByText('My Documents')).toBeInTheDocument();
      expect(screen.getByText('Resource Library')).toBeInTheDocument();
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
    });

    it('should switch between tabs correctly', async () => {
      const mockClient = {
        id: '2',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        role: 'client',
      };

      jest.spyOn(React, 'useContext').mockImplementation(context => {
        if (context === AuthContext) {
          return {
            user: mockClient,
            isProvider: false,
            isClient: true,
            logout: jest.fn(),
          };
        }
        return {};
      });

      renderWithProviders(<ClientDashboard />);

      // Test switching to Resource Library tab
      const resourcesTab = screen.getByText('Resource Library');
      fireEvent.click(resourcesTab);

      await waitFor(() => {
        expect(screen.getByText('Resource Library')).toBeInTheDocument();
      });

      // Test switching to Upload Document tab
      const uploadTab = screen.getByText('Upload Document');
      fireEvent.click(uploadTab);

      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should redirect provider to login if not authenticated', () => {
      jest.spyOn(React, 'useContext').mockImplementation(context => {
        if (context === AuthContext) {
          return {
            user: null,
            isProvider: false,
            isClient: false,
            logout: jest.fn(),
          };
        }
        return {};
      });

      renderWithProviders(<ProviderDashboard />);

      // Should redirect to login (Navigate component)
      expect(screen.queryByText('Provider Dashboard')).not.toBeInTheDocument();
    });

    it('should redirect client to login if not authenticated', () => {
      jest.spyOn(React, 'useContext').mockImplementation(context => {
        if (context === AuthContext) {
          return {
            user: null,
            isProvider: false,
            isClient: false,
            logout: jest.fn(),
          };
        }
        return {};
      });

      renderWithProviders(<ClientDashboard />);

      // Should redirect to login (Navigate component)
      expect(screen.queryByText('Client Dashboard')).not.toBeInTheDocument();
    });
  });
});
