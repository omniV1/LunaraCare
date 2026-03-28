import React, { useState } from 'react';
import { ApiClient } from '../../api/apiClient';
import { toast } from 'react-toastify';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function getErrorMessage(e: unknown, fallback: string): string {
  if (isRecord(e) && isRecord(e.response) && isRecord(e.response.data) && typeof e.response.data.error === 'string') {
    return e.response.data.error;
  }
  return e instanceof Error ? e.message : fallback;
}

interface Props {
  onInvited?: () => void;
}

export const InviteClient: React.FC<Props> = ({ onInvited }) => {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errs.email = 'Please enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await ApiClient.getInstance().post('/providers/invite-client', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      toast.success(`Invite sent to ${email}`);
      setFirstName('');
      setLastName('');
      setEmail('');
      setOpen(false);
      onInvited?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to send invite'));
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B4D37] text-white rounded-md hover:bg-[#5a402e] transition-colors text-sm font-medium shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Invite New Client
      </button>
    );
  }

  return (
    <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-dash-text-primary">Invite a New Client</h3>
        <button onClick={() => setOpen(false)} className="text-dash-text-secondary/40 hover:text-dash-text-secondary/80 text-xl leading-none">&times;</button>
      </div>
      <p className="text-sm text-dash-text-secondary/60 mb-4">
        Enter the client's details. They'll receive an email to set their password and access their dashboard.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="invite-first" className="block text-sm font-medium text-dash-text-secondary mb-1">First Name</label>
            <input id="invite-first" type="text" required value={firstName} onChange={e => { setFirstName(e.target.value); setErrors(prev => ({ ...prev, firstName: '' })); }}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4D37] ${errors.firstName ? 'border-red-400' : 'border-dash-border'}`} />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="invite-last" className="block text-sm font-medium text-dash-text-secondary mb-1">Last Name</label>
            <input id="invite-last" type="text" required value={lastName} onChange={e => { setLastName(e.target.value); setErrors(prev => ({ ...prev, lastName: '' })); }}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4D37] ${errors.lastName ? 'border-red-400' : 'border-dash-border'}`} />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="invite-email" className="block text-sm font-medium text-dash-text-secondary mb-1">Email</label>
          <input id="invite-email" type="email" required value={email} onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4D37] ${errors.email ? 'border-red-400' : 'border-dash-border'}`} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={loading}
            className="px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 disabled:opacity-50 transition-colors text-sm font-medium">
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
          <button type="button" onClick={() => setOpen(false)}
            className="px-4 py-2 text-dash-text-secondary/80 hover:text-dash-text-primary text-sm font-medium">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
