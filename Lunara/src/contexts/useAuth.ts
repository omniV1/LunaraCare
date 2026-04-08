/**
 * @module useAuth
 * Convenience hook for consuming the {@link AuthContext}.
 */

import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * Returns the current authentication context value.
 * Must be called inside an {@link AuthProvider}.
 * @returns The {@link AuthContextType} with user state and auth actions.
 * @throws If called outside of an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

