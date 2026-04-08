/**
 * @module components/provider/tabs/CreateProviderTab
 * Admin-only form for creating new provider accounts with name,
 * email, and password fields.
 */
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../../api/apiClient';
import { getErrorResponseData, isRecord } from '../../../pages/providerDashboardUtils';

interface CreateProviderFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** Admin form for registering a new provider account. */
export const CreateProviderTab: React.FC = () => {
  const [providerFormData, setProviderFormData] = useState<CreateProviderFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);

  const handleProviderFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProviderFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProvider(true);
    const firstName = providerFormData.firstName.trim();
    const lastName = providerFormData.lastName.trim();
    try {
      await ApiClient.getInstance().post('/admin/providers', {
        firstName,
        lastName,
        email: providerFormData.email.trim().toLowerCase(),
        password: providerFormData.password,
      });
      setProviderFormData({ firstName: '', lastName: '', email: '', password: '' });
      toast.success(`Provider "${firstName} ${lastName}" created successfully.`);
    } catch (error: unknown) {
      const data = getErrorResponseData(error);
      const message =
        isRecord(data) && (typeof data.message === 'string' || typeof data.error === 'string')
          ? ((typeof data.message === 'string' ? data.message : data.error) as string)
          : 'Failed to create provider.';
      toast.error(message);
    } finally {
      setIsCreatingProvider(false);
    }
  };

  return (
    <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
      <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
        <h2 className="text-lg font-medium text-dash-text-primary">Create Provider</h2>
        <p className="text-sm text-dash-text-secondary/60 mt-1">
          Add a new provider account. They will be able to sign in and manage their own profile and clients.
        </p>
      </div>
      <div className="p-6 max-w-md">
        <form onSubmit={handleCreateProvider} className="space-y-4">
          <div>
            <label htmlFor="provider-firstName" className="block text-sm font-medium text-dash-text-secondary">
              First Name
            </label>
            <input
              type="text"
              id="provider-firstName"
              name="firstName"
              value={providerFormData.firstName}
              onChange={handleProviderFormChange}
              required
              className="mt-1 block w-full border border-dash-border rounded-md shadow-sm focus:ring-[#6B4D37] focus:border-[#6B4D37] sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="provider-lastName" className="block text-sm font-medium text-dash-text-secondary">
              Last Name
            </label>
            <input
              type="text"
              id="provider-lastName"
              name="lastName"
              value={providerFormData.lastName}
              onChange={handleProviderFormChange}
              required
              className="mt-1 block w-full border border-dash-border rounded-md shadow-sm focus:ring-[#6B4D37] focus:border-[#6B4D37] sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="provider-email" className="block text-sm font-medium text-dash-text-secondary">
              Email
            </label>
            <input
              type="email"
              id="provider-email"
              name="email"
              value={providerFormData.email}
              onChange={handleProviderFormChange}
              required
              className="mt-1 block w-full border border-dash-border rounded-md shadow-sm focus:ring-[#6B4D37] focus:border-[#6B4D37] sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="provider-password" className="block text-sm font-medium text-dash-text-secondary">
              Password
            </label>
            <input
              type="password"
              id="provider-password"
              name="password"
              value={providerFormData.password}
              onChange={handleProviderFormChange}
              required
              minLength={8}
              className="mt-1 block w-full border border-dash-border rounded-md shadow-sm focus:ring-[#6B4D37] focus:border-[#6B4D37] sm:text-sm"
            />
            <p className="mt-1 text-xs text-dash-text-secondary/60">
              At least 8 characters with one uppercase, one lowercase, and one number.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isCreatingProvider}
              className="px-4 py-2 text-sm font-medium text-white bg-[#6B4D37] hover:bg-[#5a402e] rounded-md transition-colors disabled:opacity-50"
            >
              {isCreatingProvider ? 'Creating...' : 'Create Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
