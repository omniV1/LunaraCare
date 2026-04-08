/**
 * @module App
 * Root component of the LUNARA frontend. Defines top-level routing,
 * context providers, error boundaries, and lazy-loaded page code-splitting.
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import ResourceProvider from './contexts/ResourceContext';
import { MainLayout } from './components/layout/MainLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageErrorBoundary, ErrorBoundary } from './components/ui/ErrorBoundary';

// Lazy-loaded page components for code splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const BlogPage = React.lazy(() => import('./pages/BlogPage'));
const BlogPostDetail = React.lazy(() => import('./pages/BlogPostDetail'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const ProviderDashboard = React.lazy(() => import('./pages/ProviderDashboard'));
const ClientDashboard = React.lazy(() => import('./pages/ClientDashboard'));
const SecuritySettingsPage = React.lazy(() => import('./pages/SecuritySettingsPage'));

/**
 * Invisible component that listens to route changes for analytics tracking.
 * @returns Always returns `null`; renders nothing.
 */
const NavigationLogger: React.FC = () => {
  const location = useLocation();

  // Track navigation changes (could be used for analytics)
  useEffect(() => {
    // Navigation tracked: location.pathname
  }, [location]);

  return null;
};

/**
 * Application shell that wraps the entire SPA in error boundaries,
 * authentication/resource context providers, and the React Router.
 * @returns The rendered application with all routes and layout.
 */
const App: React.FC = () => {
  return (
    <PageErrorBoundary>
      <AuthProvider>
        <ResourceProvider>
          <Router>
            <NavigationLogger />
            <div className="min-h-[100dvh] min-h-screen flex flex-col bg-white overflow-x-hidden w-full max-w-[100vw] min-w-0">
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />

              <main className="flex-grow min-w-0 overflow-x-hidden">
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B4D37]" />
                  </div>
                }>
                <Routes>
                  {/* Home / Landing page - has its own layout */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Login page - has its own layout */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Password reset flow */}
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Email verification */}
                  <Route path="/verify-email" element={<VerifyEmailPage />} />

                  {/* Blog post detail */}
                  <Route
                    path="/blog/:slug"
                    element={
                      <MainLayout>
                        <BlogPostDetail />
                      </MainLayout>
                    }
                  />

                  {/* Blog list page */}
                  <Route
                    path="/blog"
                    element={
                      <MainLayout>
                        <BlogPage />
                      </MainLayout>
                    }
                  />

                  {/* Provider dashboard - wrapped in ErrorBoundary for isolation */}
                  <Route
                    path="/provider/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['provider']}>
                        <ErrorBoundary>
                          <ProviderDashboard />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />

                  {/* Client dashboard - wrapped in ErrorBoundary for isolation */}
                  <Route
                    path="/client/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['client']}>
                        <ErrorBoundary>
                          <ClientDashboard />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />

                  {/* Security settings - any authenticated user */}
                  <Route
                    path="/settings/security"
                    element={
                      <ProtectedRoute allowedRoles={['client', 'provider']}>
                        <SecuritySettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </Suspense>
              </main>
            </div>
          </Router>
        </ResourceProvider>
      </AuthProvider>
    </PageErrorBoundary>
  );
};

export default App;
