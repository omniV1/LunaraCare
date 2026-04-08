/**
 * @module components/provider/tabs/CreateClientModal
 * Modal dialog for creating a new client account with optional
 * auto-generated password, used from the provider overview quick actions.
 */
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import type { ClientFormData } from '../../../pages/providerDashboardUtils';
import {
  isRecord,
  getErrorResponseData,
} from '../../../pages/providerDashboardUtils';

interface CreateClientModalProps {
  userId?: string;
  registerClient: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    providerId?: string;
  }) => Promise<unknown>;
  onClose: () => void;
}

const generateTempPassword = (): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const allChars = lowercase + uppercase + numbers;

  const getRandomInt = (max: number): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };

  const chars: string[] = [];

  chars.push(
    lowercase.charAt(getRandomInt(lowercase.length)),
    uppercase.charAt(getRandomInt(uppercase.length)),
    numbers.charAt(getRandomInt(numbers.length))
  );

  for (let i = chars.length; i < 12; i++) {
    chars.push(allChars.charAt(getRandomInt(allChars.length)));
  }

  // Fisher-Yates shuffle for uniform distribution
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};

/** Modal form for registering a new client with auto-generated or manual password. */
export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  userId,
  registerClient,
  onClose,
}) => {
  const [clientFormData, setClientFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const validateClientForm = (): string | null => {
    if (!clientFormData.firstName.trim()) return 'First name is required';
    if (!clientFormData.lastName.trim()) return 'Last name is required';
    const emailTrimmed = clientFormData.email.trim();
    if (!emailTrimmed) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) return 'Please enter a valid email address';
    const pw = clientFormData.password?.trim() ?? '';
    if (pw && pw.length < 8) return 'Password must be at least 8 characters (or leave blank to auto-generate)';
    return null;
  };

  const handleClientFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateClientForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setIsCreatingClient(true);

    try {
      const rawPassword = clientFormData.password?.trim() ?? '';
      const password = rawPassword.length >= 8 ? rawPassword : generateTempPassword();

      if (rawPassword.length < 8) {
        toast.info('Password will be auto-generated and should be shared with the client.');
      }

      const payload: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        providerId?: string;
      } = {
        firstName: clientFormData.firstName,
        lastName: clientFormData.lastName,
        email: clientFormData.email,
        password: password,
      };
      if (userId) payload.providerId = userId;

      await registerClient(payload);

      // Reset form and close
      setClientFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
      });
      onClose();

      toast.success(
        `Client "${clientFormData.firstName} ${clientFormData.lastName}" created successfully! An account has been created and they will receive a welcome email.`
      );
    } catch (error: unknown) {
      const data = getErrorResponseData(error);
      const message = isRecord(data) ? data.message : undefined;
      const genericError = isRecord(data) ? data.error : undefined;
      const errors = isRecord(data) ? data.errors : undefined;
      const validationMessages =
        errors && typeof errors === 'object'
          ? (Object.values(errors).filter((v): v is string => typeof v === 'string') as string[])
          : [];
      const errorMessage =
        (typeof message === 'string' ? message : null) ??
        (validationMessages.length > 0 ? validationMessages.join('. ') : null) ??
        (typeof genericError === 'string' ? genericError : null) ??
        'Failed to create client. Please try again.';

      toast.error(errorMessage);
    } finally {
      setIsCreatingClient(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-4 sm:mx-auto p-5 border border-dash-border max-w-sm sm:w-96 shadow-[var(--dash-card-shadow-hover)] rounded-2xl bg-dash-card">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-dash-text-primary">Create New Client</h3>
            <button
              onClick={onClose}
              className="text-dash-text-secondary/40 hover:text-dash-text-secondary/80"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleCreateClient} className="space-y-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-dash-text-secondary"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={clientFormData.firstName}
                onChange={handleClientFormChange}
                required
                className="mt-1 block w-full border-dash-border rounded-md shadow-sm focus:ring-[#6B4D37] focus:border-[#6B4D37] sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-dash-text-secondary"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={clientFormData.lastName}
                onChange={handleClientFormChange}
                required
                className="mt-1 block w-full border-dash-border rounded-md shadow-sm focus:ring-[#6B4D37] focus:border-[#6B4D37] sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dash-text-secondary">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={clientFormData.email}
                onChange={handleClientFormChange}
                required
                className="mt-1 block w-full border-dash-border rounded-md shadow-sm focus:ring-[#6B4D37] focus:border-[#6B4D37] sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-dash-text-secondary"
              >
                Password (optional - will generate if empty)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={clientFormData.password}
                onChange={handleClientFormChange}
                className="mt-1 block w-full border-dash-border rounded-md shadow-sm focus:ring-[#6B4D37] focus:border-[#6B4D37] sm:text-sm"
                placeholder="Leave empty to auto-generate"
              />
              <p className="mt-1 text-xs text-dash-text-secondary/60">
                If provided, must be at least 8 characters with uppercase, lowercase, and
                number
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-dash-text-secondary bg-[#EDE8E0]/60 hover:bg-[#EDE8E0] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingClient}
                className="px-4 py-2 text-sm font-medium text-white bg-[#6B4D37] hover:bg-[#5a402e] rounded-md transition-colors disabled:opacity-50"
              >
                {isCreatingClient ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
