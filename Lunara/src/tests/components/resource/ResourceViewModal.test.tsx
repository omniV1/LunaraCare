import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ResourceViewModal } from '../../../components/resource/ResourceViewModal';
import type { Resource } from '../../../services/resourceService';

jest.mock('dompurify', () => ({
  __esModule: true,
  default: { sanitize: (html: string) => html },
}));

jest.mock('../../../utils/getBaseApiUrl', () => ({
  getBaseApiUrl: () => 'http://api.test/api',
}));

const api = { post: jest.fn().mockResolvedValue({}) };
jest.mock('../../../api/apiClient', () => ({
  ApiClient: { getInstance: () => api },
}));

describe('ResourceViewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when resource is null', () => {
    const { container } = render(<ResourceViewModal resource={null} onClose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders resource content and tracks view/download interactions', async () => {
    const onClose = jest.fn();
    render(
      <ResourceViewModal
        resource={{
          id: 'r1',
          title: 'R',
          description: 'D',
          content: '&lt;p&gt;Hello&lt;/p&gt;',
          fileUrl: '/files/x.pdf',
          category: { name: 'Cat' },
        } as unknown as Resource}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByText('Category:')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/interactions', { resourceId: 'r1', interactionType: 'view' }),
    );

    const link = screen.getByRole('link', { name: /View \/ Download file/ });
    expect(link).toHaveAttribute('href', 'http://api.test/files/x.pdf');
    fireEvent.click(link);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/interactions', { resourceId: 'r1', interactionType: 'download' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

