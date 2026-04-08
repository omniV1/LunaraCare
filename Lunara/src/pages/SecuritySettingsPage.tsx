/**
 * @module SecuritySettingsPage
 * Security settings page where authenticated users can manage
 * two-factor authentication (TOTP) for their account.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import MfaSetup from '../components/security/MfaSetup';

/**
 * Security settings page rendered at `/security`.
 * Allows clients and providers to enable or disable TOTP-based MFA.
 * @returns The MFA setup section with a back-to-dashboard link.
 */
const SecuritySettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled ?? false);

  const dashboardPath = user?.role === 'provider' ? '/provider/dashboard' : '/client/dashboard';

  return (
    <div className="min-h-[100dvh] min-h-screen bg-[#FAF7F2] overflow-x-hidden w-full max-w-[100vw]">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16 min-w-0">
        <div className="mb-6">
          <Link
            to={dashboardPath}
            className="font-roman text-[#574640] text-sm tracking-wider hover:text-[#4e1b00] transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        <h1 className="font-serif text-[#4e1b00] text-3xl md:text-4xl mb-8">
          Security Settings
        </h1>

        <div className="bg-white rounded-2xl border border-[#4e1c00]/10 p-6 md:p-8 shadow-sm">
          <h2 className="font-roman text-[#4e1b00] text-xl mb-1">
            Two-Factor Authentication
          </h2>
          <p className="font-roman text-[#574640] text-sm mb-6">
            Protect your account even if someone knows your password.
          </p>
          <MfaSetup mfaEnabled={mfaEnabled} onStatusChange={setMfaEnabled} />
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
