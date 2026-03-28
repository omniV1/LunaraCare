import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { CreateProviderTab } from '../../../../components/provider/tabs/CreateProviderTab';
import { BlogTab } from '../../../../components/provider/tabs/BlogTab';
import { ClientsTab } from '../../../../components/provider/tabs/ClientsTab';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const api = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() };
jest.mock('../../../../api/apiClient', () => ({
  ApiClient: { getInstance: () => api },
}));

jest.mock('../../../../components/provider/InviteClient', () => ({ InviteClient: () => <div>invite</div> }));
jest.mock('../../../../components/provider/BulkDocumentUpload', () => ({ BulkDocumentUpload: () => <div>bulk</div> }));
jest.mock('../../../../components/documents/ProviderDocumentsList', () => ({ ProviderDocumentsList: () => <div>provider-docs</div> }));

jest.mock('../../../../components/blog/BlogManagement', () => ({
  BlogManagement: ({ onEditPost, onCreatePost }: { onEditPost: (post: { id: string; title: string }) => void; onCreatePost: () => void }) => (
    <div>
      <div>manage</div>
      <button onClick={() => onEditPost({ id: 'p1', title: 'T' })}>edit-post</button>
      <button onClick={onCreatePost}>create-post</button>
    </div>
  ),
}));
jest.mock('../../../../components/blog/BlogEditor', () => ({
  BlogEditor: ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div>
      <div>editor</div>
      <button onClick={onSave}>save</button>
      <button onClick={onCancel}>cancel</button>
    </div>
  ),
}));
jest.mock('../../../../components/resource/ResourceEditor', () => ({ ResourceEditor: () => <div>resource-editor</div> }));
jest.mock('../../../../components/resource/ResourceLibrary', () => ({
  ResourceLibrary: ({ onResourceSelect }: { onResourceSelect: (r: { id: string }) => void }) => (
    <div>
      <div>resource-library</div>
      <button onClick={() => onResourceSelect({ id: 'r1' })}>pick-resource</button>
    </div>
  ),
}));
jest.mock('../../../../components/resource/ResourceViewModal', () => ({
  ResourceViewModal: ({ resource, onClose }: { resource: { id: string } | null; onClose: () => void }) =>
    resource ? (
      <div>
        <div>modal:{resource.id}</div>
        <button onClick={onClose}>close-modal</button>
      </div>
    ) : null,
}));

describe('provider/tabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as unknown as Record<string, unknown>).confirm = jest.fn(() => true);
  });

  it('CreateProviderTab submits and shows success', async () => {
    api.post.mockResolvedValue({});
    render(<CreateProviderTab />);

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: '  A ' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: ' B ' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'A@B.COM' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Provider' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/providers', expect.any(Object)));
    expect(toast.success).toHaveBeenCalledWith('Provider "A B" created successfully.');
  });

  it('BlogTab toggles, edits, saves and cancels', () => {
    render(<BlogTab />);

    expect(screen.getByText('manage')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Create New Post/i }));
    expect(screen.getByText('editor')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(toast.success).toHaveBeenCalledWith('Blog post created successfully');

    // Edit flow from manage
    fireEvent.click(screen.getByRole('button', { name: /Manage Posts/i }));
    fireEvent.click(screen.getByRole('button', { name: 'edit-post' }));
    expect(screen.getByText(/Edit: T/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));
    expect(screen.getByText('manage')).toBeInTheDocument();

    // Resource modal flow
    fireEvent.click(screen.getByRole('button', { name: 'pick-resource' }));
    expect(screen.getByText('modal:r1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close-modal' }));
    expect(screen.queryByText('modal:r1')).not.toBeInTheDocument();
  });

  it('ClientsTab loads, assigns and unassigns client', async () => {
    api.get.mockImplementation((path: string) => {
      if (path === '/client') return Promise.resolve([{ _id: 'c1', userId: { firstName: 'A', lastName: 'B', _id: 'u1', email: 'e' } }]);
      if (path === '/client?all=1')
        return Promise.resolve([{ _id: 'c2', userId: { firstName: 'C', lastName: 'D', _id: 'u2', email: 'e2' } }]);
      return Promise.resolve([]);
    });
    api.patch.mockResolvedValue({});

    render(<ClientsTab user={{ id: 'p1', role: 'provider' }} onEditClient={jest.fn()} onCarePlan={jest.fn()} />);

    expect(await screen.findByText('My clients')).toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/client'));

    fireEvent.click(screen.getByRole('button', { name: /Remove from my list/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Add to my list/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Added to your list.'));
  });
});

