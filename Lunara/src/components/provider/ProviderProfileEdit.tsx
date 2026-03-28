import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/apiClient';
import { UserService } from '../../services/userService';
import type { NotificationPreferences } from '../../services/userService';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// ── Constants ────────────────────────────────────────────────────────────────

const CERTIFICATION_OPTIONS = [
  'DONA Birth Doula',
  'DONA Postpartum Doula',
  'CAPPA Postpartum Doula',
  'ToLabor Doula',
  'ProDoula Postpartum Doula',
  'Lactation Consultant (IBCLC)',
  'Childbirth Educator',
  'Prenatal Yoga Instructor',
  'Infant Massage Instructor',
  'Other',
];

const CERT_ENUM_TO_LABEL: Record<string, string> = {
  DONA_Birth_Doula: 'DONA Birth Doula',
  DONA_Postpartum_Doula: 'DONA Postpartum Doula',
  CAPPA_Postpartum_Doula: 'CAPPA Postpartum Doula',
  ToLabor_Birth_Doula: 'ToLabor Doula',
  ProDoula_Postpartum_Doula: 'ProDoula Postpartum Doula',
  Lactation_Consultant_IBCLC: 'Lactation Consultant (IBCLC)',
  Childbirth_Educator: 'Childbirth Educator',
  Prenatal_Yoga_Instructor: 'Prenatal Yoga Instructor',
  Infant_Massage_Instructor: 'Infant Massage Instructor',
  Other: 'Other',
};

const SPECIALTY_OPTIONS = [
  { value: 'first_time_parents', label: 'First Time Parents' },
  { value: 'cesarean_recovery', label: 'Cesarean Recovery' },
  { value: 'vbac_support', label: 'VBAC Support' },
  { value: 'breastfeeding_support', label: 'Breastfeeding Support' },
  { value: 'postpartum_depression', label: 'Postpartum Depression' },
  { value: 'infant_sleep_guidance', label: 'Infant Sleep Guidance' },
  { value: 'newborn_care', label: 'Newborn Care' },
  { value: 'sibling_preparation', label: 'Sibling Preparation' },
  { value: 'loss_and_grief', label: 'Loss & Grief' },
  { value: 'lgbtq_families', label: 'LGBTQ+ Families' },
  { value: 'teen_mothers', label: 'Teen Mothers' },
  { value: 'military_families', label: 'Military Families' },
  { value: 'high_risk_pregnancies', label: 'High Risk Pregnancies' },
  { value: 'multiples_twins', label: 'Multiples / Twins' },
];

const SERVICE_OPTIONS = [
  { value: 'postpartum_support', label: 'Postpartum Support' },
  { value: 'overnight_care', label: 'Overnight Care' },
  { value: 'meal_preparation', label: 'Meal Preparation' },
  { value: 'sibling_care', label: 'Sibling Care' },
  { value: 'household_assistance', label: 'Household Assistance' },
  { value: 'breastfeeding_support', label: 'Breastfeeding Support' },
  { value: 'sleep_training', label: 'Sleep Training' },
  { value: 'infant_care_education', label: 'Infant Care Education' },
  { value: 'prenatal_support', label: 'Prenatal Support' },
  { value: 'birth_support', label: 'Birth Support' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProviderProfile {
  _id: string;
  userId: { _id: string; firstName: string; lastName: string; email: string };
  status: string;
  professionalInfo?: {
    bio?: string;
    certifications?: string[];
    specialties?: string[];
    yearsExperience?: number;
    languages?: string[];
  };
  services?: string[];
  serviceAreas?: string[];
  contactInfo?: {
    businessPhone?: string;
    businessEmail?: string;
    website?: string;
    socialMedia?: { instagram?: string; facebook?: string; linkedin?: string };
  };
  availability?: { isAcceptingClients?: boolean; maxClients?: number };
}

type ActiveTab = 'profile' | 'settings';

// ── Component ─────────────────────────────────────────────────────────────────

export const ProviderProfileEdit: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const api = ApiClient.getInstance();

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // ── Profile state ──────────────────────────────────────────────────────────

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  interface ProfileForm {
    firstName: string;
    lastName: string;
    bio: string;
    certifications: string[];
    specialties: string[];
    services: string[];
    yearsExperience: string;
    languages: string;
    serviceAreas: string;
    businessPhone: string;
    businessEmail: string;
    website: string;
    instagram: string;
    facebook: string;
    linkedin: string;
    isAcceptingClients: boolean;
    maxClients: string;
  }

  const [form, setForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    bio: '',
    certifications: [],
    specialties: [],
    services: [],
    yearsExperience: '',
    languages: '',
    serviceAreas: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    isAcceptingClients: true,
    maxClients: '',
  });

  const updateForm = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // ── Account settings state ─────────────────────────────────────────────────

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    appointmentReminders: true,
    messageAlerts: true,
    checkInReminders: true,
    loginAlerts: true,
  });
  const [prefsFetching, setPrefsFetching] = useState(true);
  const [prefsLoading, setPrefsLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Data loading ───────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    api.get<ProviderProfile>('/providers/me')
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setForm({
          firstName: data.userId?.firstName ?? '',
          lastName: data.userId?.lastName ?? '',
          bio: data.professionalInfo?.bio ?? '',
          certifications: (data.professionalInfo?.certifications ?? []).map((c: string) => CERT_ENUM_TO_LABEL[c] ?? c),
          specialties: data.professionalInfo?.specialties ?? [],
          services: data.services ?? [],
          yearsExperience: String(data.professionalInfo?.yearsExperience ?? ''),
          languages: (data.professionalInfo?.languages ?? []).join(', '),
          serviceAreas: (data.serviceAreas ?? []).join(', '),
          businessPhone: data.contactInfo?.businessPhone ?? '',
          businessEmail: data.contactInfo?.businessEmail ?? '',
          website: data.contactInfo?.website ?? '',
          instagram: data.contactInfo?.socialMedia?.instagram ?? '',
          facebook: data.contactInfo?.socialMedia?.facebook ?? '',
          linkedin: data.contactInfo?.socialMedia?.linkedin ?? '',
          isAcceptingClients: data.availability?.isAcceptingClients ?? true,
          maxClients: String(data.availability?.maxClients ?? ''),
        });
      })
      .catch(() => { if (!cancelled) toast.error('Failed to load your profile'); })
      .finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    const svc = UserService.getInstance();
    svc.getPreferences()
      .then((res: { preferences?: NotificationPreferences } | null) => { if (!cancelled && res?.preferences) setPreferences(res.preferences); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPrefsFetching(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggleArrayField = (key: 'certifications' | 'specialties' | 'services', item: string) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(item) ? prev[key].filter((x) => x !== item) : [...prev[key], item],
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.put('/providers/me', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        bio: form.bio.trim(),
        certifications: form.certifications,
        specialties: form.specialties,
        services: form.services,
        yearsExperience: form.yearsExperience !== '' ? parseInt(form.yearsExperience, 10) : undefined,
        languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
        serviceAreas: form.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean),
        contactInfo: {
          businessPhone: form.businessPhone.trim() || undefined,
          businessEmail: form.businessEmail.trim() || undefined,
          website: form.website.trim() || undefined,
          socialMedia: {
            instagram: form.instagram.trim() || undefined,
            facebook: form.facebook.trim() || undefined,
            linkedin: form.linkedin.trim() || undefined,
          },
        },
        isAcceptingClients: form.isAcceptingClients,
        maxClients: form.maxClients !== '' ? parseInt(form.maxClients, 10) : undefined,
      });
      toast.success('Profile saved successfully');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error('Password must contain uppercase, lowercase, and a number'); return;
    }
    setPasswordLoading(true);
    try {
      await UserService.getInstance().changePassword(currentPassword, newPassword);
      toast.success('Password changed. Please log in again.');
      logout();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setPrefsLoading(true);
    try {
      await UserService.getInstance().updatePreferences(preferences);
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setPrefsLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') { toast.error('Type DELETE to confirm'); return; }
    setDeleteLoading(true);
    try {
      await UserService.getInstance().deleteAccount(deletePassword);
      toast.success('Account deleted.');
      logout();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const checkboxGroup = (
    title: string,
    options: { value: string; label: string }[],
    fieldKey: 'certifications' | 'specialties' | 'services'
  ) => (
    <div className="mb-6">
      <p className="block text-sm font-medium text-dash-text-secondary mb-2">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form[fieldKey].includes(value)}
              onChange={() => toggleArrayField(fieldKey, value)}
              className="rounded border-dash-border text-[#6B4D37]"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );

  const inputClass = 'w-full border border-dash-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4D37] focus:border-[#6B4D37]';
  const labelClass = 'block text-sm font-medium text-dash-text-secondary mb-1';
  const sectionHeadingClass = 'text-base font-semibold text-dash-text-primary mb-4 border-b border-dash-section-border pb-2';

  // ── Loading ────────────────────────────────────────────────────────────────

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B4D37]" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-8 text-dash-text-secondary/60">Provider profile not found. Contact support.</div>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Sub-tab nav */}
      <div className="flex gap-1 border-b border-dash-section-border mb-6">
        {([
          { key: 'profile', label: 'My Profile' },
          { key: 'settings', label: 'Account Settings' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-[#6B4D37] text-[#6B4D37]'
                : 'border-transparent text-dash-text-secondary/60 hover:text-dash-text-secondary hover:border-dash-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-8">
          {/* Personal info */}
          <section>
            <h3 className={sectionHeadingClass}>Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input type="text" value={form.firstName} onChange={(e) => updateForm('firstName', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input type="text" value={form.lastName} onChange={(e) => updateForm('lastName', e.target.value)} className={inputClass} />
              </div>
            </div>
            <p className="text-xs text-dash-text-secondary/60 mt-1">This name is displayed publicly to clients.</p>
          </section>

          {/* Professional info */}
          <section>
            <h3 className={sectionHeadingClass}>Professional Information</h3>
            <div className="mb-4">
              <label className={labelClass}>Bio <span className="text-dash-text-secondary/40">(displayed publicly)</span></label>
              <textarea
                value={form.bio}
                onChange={(e) => updateForm('bio', e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Describe your background, approach, and what makes you unique as a postpartum doula..."
                className={inputClass}
              />
              <p className="text-xs text-dash-text-secondary/40 text-right">{form.bio.length}/1000</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>Years of experience</label>
                <input type="number" min="0" max="50" value={form.yearsExperience} onChange={(e) => updateForm('yearsExperience', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Languages (comma-separated)</label>
                <input type="text" value={form.languages} onChange={(e) => updateForm('languages', e.target.value)} placeholder="English, Spanish" className={inputClass} />
              </div>
            </div>
            <div className="mb-6">
              <p className={labelClass}>Certifications</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CERTIFICATION_OPTIONS.map((cert) => (
                  <label key={cert} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.certifications.includes(cert)} onChange={() => toggleArrayField('certifications', cert)} className="rounded border-dash-border text-[#6B4D37]" />
                    {cert}
                  </label>
                ))}
              </div>
            </div>
            {checkboxGroup('Specialties', SPECIALTY_OPTIONS, 'specialties')}
            {checkboxGroup('Services offered', SERVICE_OPTIONS, 'services')}
          </section>

          {/* Service areas */}
          <section>
            <h3 className={sectionHeadingClass}>Service Areas</h3>
            <div>
              <label className={labelClass}>Cities, zip codes, or regions (comma-separated)</label>
              <input type="text" value={form.serviceAreas} onChange={(e) => updateForm('serviceAreas', e.target.value)} placeholder="Denver, 80202, Aurora CO" className={inputClass} />
            </div>
          </section>

          {/* Availability */}
          <section>
            <h3 className={sectionHeadingClass}>Availability</h3>
            <div className="flex items-center gap-3 mb-4">
              <input id="accepting" type="checkbox" checked={form.isAcceptingClients} onChange={(e) => updateForm('isAcceptingClients', e.target.checked)} className="rounded border-dash-border text-[#6B4D37]" />
              <label htmlFor="accepting" className="text-sm font-medium text-dash-text-secondary">Currently accepting new clients</label>
            </div>
            <div className="max-w-xs">
              <label className={labelClass}>Max concurrent clients</label>
              <input type="number" min="1" max="20" value={form.maxClients} onChange={(e) => updateForm('maxClients', e.target.value)} className={inputClass} />
            </div>
          </section>

          {/* Contact info */}
          <section>
            <h3 className={sectionHeadingClass}>Contact Information <span className="text-sm font-normal text-dash-text-secondary/40">(optional, shown to assigned clients)</span></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>Business phone</label>
                <input type="tel" value={form.businessPhone} onChange={(e) => updateForm('businessPhone', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Business email</label>
                <input type="email" value={form.businessEmail} onChange={(e) => updateForm('businessEmail', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input type="url" value={form.website} onChange={(e) => updateForm('website', e.target.value)} placeholder="https://yoursite.com" className={inputClass} />
              </div>
            </div>
            <p className="text-sm font-medium text-dash-text-secondary mb-2">Social media</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-dash-text-secondary/60 mb-1">Instagram handle</label>
                <input type="text" value={form.instagram} onChange={(e) => updateForm('instagram', e.target.value)} placeholder="@username" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-dash-text-secondary/60 mb-1">Facebook page</label>
                <input type="text" value={form.facebook} onChange={(e) => updateForm('facebook', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-dash-text-secondary/60 mb-1">LinkedIn</label>
                <input type="text" value={form.linkedin} onChange={(e) => updateForm('linkedin', e.target.value)} className={inputClass} />
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4 border-t border-dash-section-border">
            <button
              type="submit"
              disabled={profileSaving}
              className="bg-[#6B4D37] hover:bg-[#5a402e] disabled:opacity-60 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* ── Account Settings Tab ── */}
      {activeTab === 'settings' && (
        <div className="space-y-8">

          {/* Change Password */}
          <section>
            <h3 className={sectionHeadingClass}>Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className={labelClass}>Current password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>New password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" className={inputClass} />
                <p className="text-xs text-dash-text-secondary/40 mt-1">8+ characters, uppercase, lowercase, and a number</p>
              </div>
              <div>
                <label className={labelClass}>Confirm new password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className={inputClass} />
              </div>
              <button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-[#6B4D37] text-white rounded-md text-sm font-medium hover:bg-[#5a402e] disabled:opacity-50 transition-colors"
              >
                {passwordLoading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </section>

          {/* Notifications */}
          <section>
            <h3 className={sectionHeadingClass}>Notification Preferences</h3>
            {prefsFetching ? (
              <p className="text-sm text-dash-text-secondary/40">Loading preferences…</p>
            ) : (
              <div className="space-y-3 max-w-md">
                {([
                  { key: 'emailNotifications', label: 'Email notifications' },
                  { key: 'appointmentReminders', label: 'Appointment reminders' },
                  { key: 'messageAlerts', label: 'New message alerts' },
                  { key: 'checkInReminders', label: 'Check-in reminders' },
                  { key: 'loginAlerts', label: 'Login alerts' },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between py-2 border-b border-dash-section-border">
                    <span className="text-sm text-dash-text-secondary">{label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences[key]}
                      onClick={() => setPreferences((p) => ({ ...p, [key]: !p[key] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences[key] ? 'bg-[#6B4D37]' : 'bg-[#EDE8E0]/60'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={prefsLoading}
                  className="mt-2 px-4 py-2 bg-[#6B4D37] text-white rounded-md text-sm font-medium hover:bg-[#5a402e] disabled:opacity-50 transition-colors"
                >
                  {prefsLoading ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            )}
          </section>

          {/* Security / MFA */}
          <section>
            <h3 className={sectionHeadingClass}>Security</h3>
            <div className="flex items-center justify-between p-4 bg-[#EDE8E0]/30 rounded-lg border border-dash-section-border max-w-md">
              <div>
                <p className="text-sm font-medium text-dash-text-primary">Two-Factor Authentication</p>
                <p className="text-xs text-dash-text-secondary/60 mt-0.5">Protect your account with an authenticator app</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(user as unknown as { mfaEnabled?: boolean })?.mfaEnabled ? 'bg-[#3F4E4F]/10 text-[#3F4E4F]' : 'bg-[#EDE8E0]/60 text-dash-text-secondary/60'}`}>
                  {(user as unknown as { mfaEnabled?: boolean })?.mfaEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/settings/security')}
                  className="text-sm text-[#6B4D37] hover:text-[#4E1B00] font-medium"
                >
                  Manage
                </button>
              </div>
            </div>
          </section>

          {/* Danger zone */}
          <section>
            <h3 className="text-base font-semibold text-red-600 mb-4 border-b border-red-100 pb-2">Danger Zone</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <p className="text-sm font-medium text-red-800 mb-1">Delete Account</p>
              <p className="text-xs text-red-600 mb-4">This permanently deletes your account and all associated data. This cannot be undone.</p>
              <form onSubmit={handleDeleteAccount} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-dash-text-secondary mb-1">Current password</label>
                  <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dash-text-secondary mb-1">Type DELETE to confirm</label>
                  <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className={inputClass} />
                </div>
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirmText !== 'DELETE' || !deletePassword}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleteLoading ? 'Deleting…' : 'Delete My Account'}
                </button>
              </form>
            </div>
          </section>

        </div>
      )}
    </div>
  );
};
