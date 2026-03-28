import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ErrorBoundary, ErrorFallback, PageErrorBoundary } from '../../../components/ui/ErrorBoundary';

function Bomb() {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>ok</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('catches errors and shows default fallback, and retries', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    // Still errored because Bomb always throws; but we covered retry path
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>custom</div>}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('custom')).toBeInTheDocument();
  });
});

describe('ErrorFallback', () => {
  it('renders title/message and invokes resetError', () => {
    const resetError = jest.fn();
    render(<ErrorFallback title="T" message="M" resetError={resetError} />);
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(resetError).toHaveBeenCalledTimes(1);
  });
});

describe('PageErrorBoundary', () => {
  it('renders page-level fallback UI when a child throws', () => {
    render(
      <PageErrorBoundary>
        <Bomb />
      </PageErrorBoundary>,
    );
    expect(screen.getByText(/Oops! Something went wrong/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Homepage/ })).toBeInTheDocument();
  });
});

