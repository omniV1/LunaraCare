/**
 * @module components/ProtectedRoute
 * Route guard that checks authentication and role-based access.
 * Redirects unauthenticated users to login and unauthorized users
 * to their own dashboard.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { Spinner } from './ui/Spinner';

/** Props for the protected route wrapper. */
interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: ('client' | 'provider')[];
}

/** Renders children if the user is authenticated and has an allowed role, otherwise redirects. */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Treat admin as provider for route access; then check allowed roles
  const roleForAccess: 'client' | 'provider' = user.role === 'admin' ? 'provider' : user.role;
  if (!allowedRoles.includes(roleForAccess)) {
    if (roleForAccess === 'client') {
      return <Navigate to="/client/dashboard" replace />;
    }
    return <Navigate to="/provider/dashboard" replace />;
  }

  return children;
};
