import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { UserService } from '../../services/userService';
import type { NotificationPreferences } from '../../services/userService';
import { PushNotificationToggle } from '../PushNotificationToggle';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function getErrorMessage(e: unknown, fallback: string): string {
  if (isRecord(e) && isRecord(e.response) && isRecord(e.response.data) && typeof e.response.data.error === 'string') {
    return e.response.data.error;
  }
  return e instanceof Error ? e.message : fallback;
}

type SettingsSection = 'profile' | 'password' | 'notifications' | 'security' | 'danger';

export const ClientSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  // Profile state
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFetching, setProfileFetching] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    appointmentReminders: true,
    messageAlerts: true,
    checkInReminders: true,
    loginAlerts: true,
  });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsFetching, setPrefsFetching] = useState(true);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const svc = UserService.getInstance();

    const loadProfile = async () => {
      try {
        const data = await svc.getCurrentProfile() as {
          user?: { firstName?: string; lastName?: string };
          profile?: { babyBirthDate?: string };
        };
        setFirstName(data.user?.firstName ?? user?.firstName ?? '');
        setLastName(data.user?.lastName ?? user?.lastName ?? '');
        const bd = data.profile?.babyBirthDate;
        if (bd) {
          const d = new Date(bd);
          if (!isNaN(d.getTime())) setBabyBirthDate(d.toISOString().split('T')[0]);
        }
      } catch { /* profile will use auth context defaults */ }
      setProfileFetching(false);
    };

    const loadPrefs = async () => {
      try {
        const res = await svc.getPreferences();
        setPreferences(res.preferences);
      } catch { /* defaults remain */ }
      setPrefsFetching(false);
    };

    loadProfile();
    loadPrefs();
  }, [user?.id, user?.firstName, user?.lastName]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    setProfileLoading(true);
    try {
      await UserService.getInstance().updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(babyBirthDate ? { babyBirthDate } : {}),
      });
      toast.success('Profile updated');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update profile'));
    }
    setProfileLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      toast.error('Password must contain uppercase, lowercase, and a number');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await UserService.getInstance().changePassword(currentPassword, newPassword);
      toast.success('Password changed. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Brief delay so the success toast is visible before the page redirects to login
      logoutTimerRef.current = setTimeout(() => logout(), 1500);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to change password'));
    }
    setPasswordLoading(false);
  };

  const handlePrefToggle = async (key: keyof NotificationPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setPrefsLoading(true);
    try {
      await UserService.getInstance().updatePreferences({ [key]: updated[key] });
    } catch {
      setPreferences(prev => ({ ...prev, [key]: !updated[key] }));
      toast.error('Failed to update preference');
    }
    setPrefsLoading(false);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      toast.error('Password is required');
      return;
    }
    setDeleteLoading(true);
    try {
      await UserService.getInstance().deleteAccount(deletePassword);
      toast.success('Account deleted');
      // Shorter delay than password change — account is gone, just flash the toast
      logoutTimerRef.current = setTimeout(() => logout(), 1000);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to delete account'));
    }
    setDeleteLoading(false);
  };

  const sections: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
    {
      id: 'password',
      label: 'Password',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    },
    {
      id: 'security',
      label: 'Security',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    },
    {
      id: 'danger',
      label: 'Delete Account',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    },
  ];

  const inputClass = 'w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 text-sm';
  const labelClass = 'block text-sm font-medium text-sage-700 mb-1';
  const btnPrimary = 'px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium';

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-[#4E1B00] mb-6">Profile</h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <nav className="md:w-56 shrink-0">
          <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {sections.map(s => (
              <li key={s.id}>
                <button
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap w-full transition-colors ${
                    activeSection === s.id
                      ? s.id === 'danger' ? 'bg-red-50 text-red-700' : 'bg-sage-100 text-sage-800'
                      : s.id === 'danger' ? 'text-red-500 hover:bg-red-50' : 'text-[#6B4D37] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {s.icon}
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* PROFILE */}
          {activeSection === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-lg font-semibold text-[#4E1B00] mb-1">Edit Profile</h3>
                <p className="text-sm text-[#6B4D37]/70">Update your personal information.</p>
              </div>

              {profileFetching ? (
                <div className="text-sm text-[#6B4D37]/70">Loading profile...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className={labelClass}>First Name</label>
                      <input id="firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} required />
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelClass}>Last Name</label>
                      <input id="lastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} required />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input id="email" type="email" value={user?.email ?? ''} disabled className={`${inputClass} bg-[#FAF7F2] text-[#6B4D37]/70 cursor-not-allowed`} />
                    <p className="text-xs text-[#BCADA5] mt-1">Email cannot be changed.</p>
                  </div>

                  <div>
                    <label htmlFor="deliveryDate" className={labelClass}>Delivery Date</label>
                    <input id="deliveryDate" type="date" value={babyBirthDate} onChange={e => setBabyBirthDate(e.target.value)} className={inputClass} />
                    <p className="text-xs text-[#BCADA5] mt-1">Used to personalize your postpartum recommendations.</p>
                  </div>

                  <button type="submit" disabled={profileLoading} className={btnPrimary}>
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </form>
          )}

          {/* PASSWORD */}
          {activeSection === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-lg font-semibold text-[#4E1B00] mb-1">Change Password</h3>
                <p className="text-sm text-[#6B4D37]/70">You will be logged out after changing your password.</p>
              </div>

              <div>
                <label htmlFor="currentPassword" className={labelClass}>Current Password</label>
                <input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} required />
              </div>

              <div>
                <label htmlFor="newPassword" className={labelClass}>New Password</label>
                <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} required minLength={8} />
                <p className="text-xs text-[#BCADA5] mt-1">Minimum 8 characters with uppercase, lowercase, and a number.</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelClass}>Confirm New Password</label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} required />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                )}
              </div>

              <button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || newPassword !== confirmPassword} className={btnPrimary}>
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-lg font-semibold text-[#4E1B00] mb-1">Notification Preferences</h3>
                <p className="text-sm text-[#6B4D37]/70">Choose which notifications you receive.</p>
              </div>

              {prefsFetching ? (
                <div className="text-sm text-[#6B4D37]/70">Loading preferences...</div>
              ) : (
                <div className="space-y-3">
                  {([
                    { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Receive general email updates' },
                    { key: 'appointmentReminders' as const, label: 'Appointment Reminders', desc: 'Get reminded before upcoming appointments' },
                    { key: 'messageAlerts' as const, label: 'Message Alerts', desc: 'Notified when your provider sends a message' },
                    { key: 'checkInReminders' as const, label: 'Check-in Reminders', desc: 'Periodic reminders to complete check-ins' },
                    { key: 'loginAlerts' as const, label: 'Login Alerts', desc: 'Email when a new login is detected on your account' },
                  ]).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-[#4E1B00]">{label}</p>
                        <p className="text-xs text-[#6B4D37]/70">{desc}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={preferences[key]}
                        disabled={prefsLoading}
                        onClick={() => handlePrefToggle(key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-50 ${
                          preferences[key] ? 'bg-sage-600' : 'bg-[#CAC3BC]'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                          preferences[key] ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-[#DED7CD]">
                <PushNotificationToggle />
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-lg font-semibold text-[#4E1B00] mb-1">Security</h3>
                <p className="text-sm text-[#6B4D37]/70">Manage two-factor authentication and other security settings.</p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-lg border border-[#DED7CD]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#4E1B00]">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-[#6B4D37]/70 mt-0.5">
                      {user?.mfaEnabled
                        ? 'Your account is protected with 2FA.'
                        : 'Add an extra layer of security to your account.'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    user?.mfaEnabled ? 'bg-[#8C9A8C]/20 text-[#3F4E4F]' : 'bg-[#AA6641]/20 text-[#AA6641]'
                  }`}>
                    {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/settings/security')}
                  className="mt-3 text-sm text-sage-600 hover:text-sage-800 font-medium underline underline-offset-2"
                >
                  Manage 2FA Settings
                </button>
              </div>
            </div>
          )}

          {/* DELETE ACCOUNT */}
          {activeSection === 'danger' && (
            <form onSubmit={handleDeleteAccount} className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-1">Delete Account</h3>
                <p className="text-sm text-[#6B4D37]/70">Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-2">This will permanently:</p>
                <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
                  <li>Delete your profile and personal information</li>
                  <li>Remove all your documents and uploads</li>
                  <li>Cancel any upcoming appointments</li>
                  <li>Remove your message history</li>
                </ul>
              </div>

              <div>
                <label htmlFor="deletePassword" className={labelClass}>Enter your password</label>
                <input id="deletePassword" type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} className={inputClass} required />
              </div>

              <div>
                <label htmlFor="deleteConfirm" className={labelClass}>
                  Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input id="deleteConfirm" type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className={inputClass} />
              </div>

              <button
                type="submit"
                disabled={deleteLoading || deleteConfirmText !== 'DELETE' || !deletePassword}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
