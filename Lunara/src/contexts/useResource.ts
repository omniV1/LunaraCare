/**
 * @module useResource
 * Convenience hook for consuming the {@link ResourceContext}.
 */

import { useContext } from 'react';
import { ResourceContext } from './ResourceContext';

/**
 * Returns the current resource context value.
 * Must be called inside a {@link ResourceProvider}.
 * @returns The {@link ResourceContextType} with resource/category state and actions.
 * @throws If called outside of a ResourceProvider.
 */
export function useResource() {
  const context = useContext(ResourceContext);
  if (context === undefined) {
    throw new Error('useResource must be used within a ResourceProvider');
  }
  return context;
}

