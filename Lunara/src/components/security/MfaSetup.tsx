/**
 * @module components/security/MfaSetup
 * Multi-step TOTP two-factor authentication setup and management.
 * Guides users through QR scanning, code verification, backup-code display,
 * and provides a disable flow requiring password + auth code confirmation.
 */
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../api/apiClient';

/** Props for {@link MfaSetup}. */
interface MfaSetupProps {
  mfaEnabled: boolean;
  onStatusChange: (enabled: boolean) => void;
}

type Step = 'idle' | 'qr' | 'backup-codes';

/** Renders the MFA setup wizard or current MFA status with enable/disable controls. */
const MfaSetup: React.FC<MfaSetupProps> = ({ mfaEnabled, onStatusChange }) => {
  const [step, setStep] = useState<Step>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const api = ApiClient.getInstance();

  const startSetup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.post<{ qrCode: string; secret: string }>('/auth/mfa/setup', {});
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('qr');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Setup failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSetup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.post<{ backupCodes: string[] }>('/auth/mfa/confirm-setup', { code });
      setBackupCodes(data.backupCodes);
      setStep('backup-codes');
      setSecret('');
      onStatusChange(true);
      toast.success('Two-factor authentication enabled!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const disableMfa = async () => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/mfa/disable', { password: disablePassword, code: disableCode });
      onStatusChange(false);
      setShowDisable(false);
      setDisablePassword('');
      setDisableCode('');
      toast.success('Two-factor authentication disabled.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to disable';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-white border border-[#571e00]/20 rounded-xl font-roman text-[#4e1b00] text-base tracking-wider placeholder:text-[#4e1b00]/50 focus:outline-none focus:ring-2 focus:ring-[#4e1b00]/20';
  const btnClass =
    'px-6 py-3 bg-[#4e1b00] text-white rounded-xl font-roman text-base tracking-wider hover:bg-[#3a1400] disabled:opacity-50 transition-all';
  const btnSecondary =
    'px-6 py-3 bg-white border border-[#4e1b00]/30 text-[#4e1b00] rounded-xl font-roman text-base tracking-wider hover:bg-[#faf7f2] transition-all';

  if (mfaEnabled && step === 'idle') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-green-700 text-lg">&#10003;</span>
          <span className="font-roman text-[#4e1b00] text-base">
            Two-factor authentication is <strong>enabled</strong>
          </span>
        </div>

        {!showDisable ? (
          <button onClick={() => setShowDisable(true)} className={btnSecondary}>
            Disable 2FA
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="font-roman text-red-800 text-sm">
              Enter your password and a verification code to disable 2FA.
            </p>
            <input
              type="password"
              value={disablePassword}
              onChange={e => setDisablePassword(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
              className={inputClass}
            />
            <input
              type="text"
              inputMode="numeric"
              value={disableCode}
              onChange={e => setDisableCode(e.target.value.replace(/\s/g, ''))}
              placeholder="Auth code or backup code"
              maxLength={8}
              className={inputClass}
            />
            {error && <p className="text-red-700 text-sm font-roman">{error}</p>}
            <div className="flex gap-3">
              <button onClick={disableMfa} disabled={isLoading} className={`${btnClass} bg-red-700 hover:bg-red-800`}>
                {isLoading ? 'Disabling...' : 'Confirm Disable'}
              </button>
              <button onClick={() => { setShowDisable(false); setError(''); }} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'backup-codes') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-green-700 text-4xl mb-2">&#10003;</div>
          <h3 className="font-roman text-[#4e1b00] text-xl">2FA Enabled</h3>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
          <p className="font-roman text-amber-900 text-sm font-bold mb-2">
            Save these backup codes in a safe place. Each can only be used once.
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-base text-amber-900">
            {backupCodes.map(c => (
              <div key={c} className="bg-white/60 px-3 py-1.5 rounded text-center">{c}</div>
            ))}
          </div>
        </div>
        <button onClick={() => { setStep('idle'); setBackupCodes([]); }} className={btnClass}>
          Done
        </button>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="space-y-4">
        <h3 className="font-roman text-[#4e1b00] text-lg">Scan QR Code</h3>
        <p className="font-roman text-[#574640] text-sm">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
        </p>
        <div className="flex justify-center p-4 bg-white rounded-xl">
          <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
        </div>
        <details className="text-sm">
          <summary className="font-roman text-[#574640] cursor-pointer">
            Can&apos;t scan? Enter this code manually
          </summary>
          <code className="block mt-2 p-3 bg-white rounded-lg font-mono text-xs break-all select-all">
            {secret}
          </code>
        </details>
        <div>
          <label htmlFor="mfa-confirm-code" className="font-roman text-[#4e1b00] text-sm block mb-1">
            Enter the 6-digit code from your app to confirm
          </label>
          <input
            id="mfa-confirm-code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            maxLength={6}
            className={`${inputClass} text-center text-xl tracking-[0.3em]`}
          />
        </div>
        {error && <p className="text-red-700 text-sm font-roman">{error}</p>}
        <div className="flex gap-3">
          <button onClick={confirmSetup} disabled={isLoading || code.length < 6} className={btnClass}>
            {isLoading ? 'Verifying...' : 'Verify & Enable'}
          </button>
          <button onClick={() => { setStep('idle'); setError(''); }} className={btnSecondary}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // idle + not enabled
  return (
    <div className="space-y-4">
      <p className="font-roman text-[#574640] text-base">
        Add an extra layer of security to your account. When enabled, you&apos;ll need your
        authenticator app code in addition to your password to log in.
      </p>
      {error && <p className="text-red-700 text-sm font-roman">{error}</p>}
      <button onClick={startSetup} disabled={isLoading} className={btnClass}>
        {isLoading ? 'Setting up...' : 'Set Up Two-Factor Authentication'}
      </button>
    </div>
  );
};

export default MfaSetup;
