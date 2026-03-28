import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useResource } from '../../contexts/useResource';
import { ResourceContext } from '../../contexts/ResourceContext';
import type { ResourceContextType } from '../../contexts/ResourceContext';

function Harness() {
  const ctx = useResource();
  return <div>resources:{Array.isArray(ctx.resources) ? ctx.resources.length : 'na'}</div>;
}

describe('useResource', () => {
  it('throws when used outside provider', () => {
    // Silence React error boundary logging
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow('useResource must be used within a ResourceProvider');
    spy.mockRestore();
  });

  it('returns context when used within provider', () => {
    render(
      <ResourceContext.Provider value={{ resources: [{ id: 'r1', isPublished: true }] } as unknown as ResourceContextType}>
        <Harness />
      </ResourceContext.Provider>,
    );
    expect(screen.getByText('resources:1')).toBeInTheDocument();
  });
});
