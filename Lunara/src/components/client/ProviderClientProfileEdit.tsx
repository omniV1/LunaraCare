/**
 * @module components/client/ProviderClientProfileEdit
 * Provider-facing modal for editing a client's profile, intake data,
 * and accessing their care plans.
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../api/apiClient';
import { FEEDING_OPTIONS, SUPPORT_OPTIONS, type IntakeData } from '../intake/intakeTypes';
import { CarePlanManager } from './CarePlanManager';

function toDateStr(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof (v as { toISOString?: () => string }).toISOString === 'function') {
    return (v as Date).toISOString().slice(0, 10);
  }
  return '';
}

interface ClientRecord {
  _id: string;
  userId: { _id: string; firstName?: string; lastName?: string; email?: string } | string;
  babyBirthDate?: string | Date;
  dueDate?: string | Date;
  birthDate?: string | Date;
  status?: string;
  intakeCompleted?: boolean;
  intakeData?: IntakeData;
  providerNotesIntake?: string;
  assignedProvider?: { _id: string };
}

function getUserIdString(userId: ClientRecord['userId'] | undefined): string {
  if (!userId) return '';
  if (typeof userId === 'string') return userId;
  return userId._id ? String(userId._id) : '';
}

function getDisplayName(userId: ClientRecord['userId'] | undefined): string {
  if (!userId || typeof userId === 'string') return 'Client';
  const userName = [userId.firstName, userId.lastName].filter(Boolean).join(' ').trim();
  return userName || userId.email || 'Client';
}

interface ProviderClientProfileEditProps {
  clientId: string;
  onClose: () => void;
  onSaved?: () => void;
}

/** Provider-side modal for editing a client's profile, intake, and care plans. */
export const ProviderClientProfileEdit: React.FC<ProviderClientProfileEditProps> = ({
  clientId,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingIntake, setSavingIntake] = useState(false);
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [intake, setIntake] = useState<IntakeData>({});
  const [intakeCompleted, setIntakeCompleted] = useState(false);

  // Editable profile fields
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [providerNotesIntake, setProviderNotesIntake] = useState('');
  const [showCarePlans, setShowCarePlans] = useState(false);

  const api = ApiClient.getInstance();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const clientRes = await api.get<ClientRecord>(`/client/${clientId}`);
        if (cancelled || !clientRes) return;
        setClient(clientRes);
        setBabyBirthDate(toDateStr(clientRes.babyBirthDate));
        setDueDate(toDateStr(clientRes.dueDate));
        setBirthDate(toDateStr(clientRes.birthDate));
        setStatus(clientRes.status ?? 'active');
        setProviderNotesIntake(clientRes.providerNotesIntake ?? '');

        const userIdStr = getUserIdString(clientRes.userId);
        if (!userIdStr) return;
        try {
          const intakeRes = await api.get<{ intake?: IntakeData; intakeCompleted?: boolean }>(
            `/intake/${userIdStr}`
          );
          if (cancelled) return;
          setIntake(intakeRes?.intake ?? {});
          setIntakeCompleted(intakeRes?.intakeCompleted ?? false);
        } catch {
          setIntake({});
          setIntakeCompleted(false);
        }
      } catch {
        toast.error('Failed to load client');
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [clientId, api, onClose]);

  const updateIntake = (path: string, value: unknown) => {
    setIntake((prev) => {
      const next = { ...prev };
      const parts = path.split('.');
      let cur: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        const existing = cur[key];
        if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
          cur[key] = {};
        }
        cur = cur[key] as Record<string, unknown>;
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const saveProfile = async () => {
    if (!client) return;
    setSavingProfile(true);
    try {
      await api.put(`/client/${clientId}`, {
        babyBirthDate: babyBirthDate || undefined,
        dueDate: dueDate || undefined,
        birthDate: birthDate || undefined,
        status,
        providerNotesIntake: providerNotesIntake || undefined,
      });
      toast.success('Profile updated');
      onSaved?.();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveIntake = async (isComplete: boolean) => {
    if (!client) return;
    const userIdStr = getUserIdString(client.userId);
    if (!userIdStr) return;
    setSavingIntake(true);
    try {
      await api.put(`/intake/${userIdStr}`, { ...intake, isComplete });
      setIntakeCompleted(isComplete);
      toast.success(isComplete ? 'Intake marked complete' : 'Intake draft saved');
      onSaved?.();
    } catch {
      toast.error('Failed to save intake');
    } finally {
      setSavingIntake(false);
    }
  };

  if (loading || !client) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const displayName = getDisplayName(client.userId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" aria-hidden onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto overflow-x-hidden" style={{ maxHeight: '90dvh', WebkitOverflowScrolling: 'touch' }}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Edit profile & intake — {displayName}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* Profile section */}
            <section className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Baby birth date</label>
                  <input
                    type="date"
                    value={babyBirthDate}
                    onChange={(e) => setBabyBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client birth date</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider notes (intake)</label>
                <textarea
                  rows={3}
                  value={providerNotesIntake}
                  onChange={(e) => setProviderNotesIntake(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Notes about this client..."
                />
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingProfile ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </section>

            {/* Intake sections — same structure as ClientIntakeForm */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Intake (editable by provider)</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Personal & contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Partner name</label>
                      <input
                        type="text"
                        value={intake.partnerName ?? ''}
                        onChange={(e) => updateIntake('partnerName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Partner phone</label>
                      <input
                        type="text"
                        value={intake.partnerPhone ?? ''}
                        onChange={(e) => updateIntake('partnerPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Street"
                      value={intake.address?.street ?? ''}
                      onChange={(e) => updateIntake('address.street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={intake.address?.city ?? ''}
                      onChange={(e) => updateIntake('address.city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={intake.address?.state ?? ''}
                      onChange={(e) => updateIntake('address.state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="ZIP"
                      value={intake.address?.zipCode ?? ''}
                      onChange={(e) => updateIntake('address.zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Emergency name"
                      value={intake.emergencyContact?.name ?? ''}
                      onChange={(e) => updateIntake('emergencyContact.name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Emergency phone"
                      value={intake.emergencyContact?.phone ?? ''}
                      onChange={(e) => updateIntake('emergencyContact.phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={intake.emergencyContact?.relationship ?? ''}
                      onChange={(e) => updateIntake('emergencyContact.relationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Family</h4>
                  <input
                    type="number"
                    min={0}
                    value={intake.numberOfChildren ?? ''}
                    onChange={(e) =>
                      updateIntake('numberOfChildren', e.target.value === '' ? undefined : Number(e.target.value))
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Number of children"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Feeding</h4>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {FEEDING_OPTIONS.map((opt) => (
                      <label key={opt.value} className="inline-flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={(intake.feedingPreferences ?? []).includes(opt.value)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...(intake.feedingPreferences ?? []), opt.value]
                              : (intake.feedingPreferences ?? []).filter((x) => x !== opt.value);
                            updateIntake('feedingPreferences', next);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Feeding challenges"
                    value={(intake.feedingChallenges ?? []).join(', ')}
                    onChange={(e) =>
                      updateIntake(
                        'feedingChallenges',
                        e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
                  />
                  <textarea
                    rows={2}
                    placeholder="Feeding goals"
                    value={intake.feedingGoals ?? ''}
                    onChange={(e) => updateIntake('feedingGoals', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Support needs</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {SUPPORT_OPTIONS.map((opt) => (
                      <label key={opt.value} className="inline-flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={(intake.supportNeeds ?? []).includes(opt.value)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...(intake.supportNeeds ?? []), opt.value]
                              : (intake.supportNeeds ?? []).filter((x) => x !== opt.value);
                            updateIntake('supportNeeds', next);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Other support needs"
                    value={intake.additionalSupportNeeds ?? ''}
                    onChange={(e) => updateIntake('additionalSupportNeeds', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Health</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Current medications (comma-separated)"
                      value={(intake.currentMedications ?? []).join(', ')}
                      onChange={(e) =>
                        updateIntake(
                          'currentMedications',
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Allergies (comma-separated)"
                      value={(intake.allergies ?? []).join(', ')}
                      onChange={(e) =>
                        updateIntake(
                          'allergies',
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <textarea
                      rows={2}
                      placeholder="Mental health history"
                      value={intake.mentalHealthHistory ?? ''}
                      onChange={(e) => updateIntake('mentalHealthHistory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={intake.postpartumMoodConcerns ?? false}
                        onChange={(e) => updateIntake('postpartumMoodConcerns', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2">Mood/emotional concerns</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Communication</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Preferred contact</label>
                      <select
                        value={intake.communicationPreferences?.preferredContactMethod ?? 'app'}
                        onChange={(e) =>
                          updateIntake('communicationPreferences.preferredContactMethod', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="app">In-app</option>
                        <option value="text">Text</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Best time to contact</label>
                      <input
                        type="text"
                        value={intake.communicationPreferences?.bestTimeToContact ?? ''}
                        onChange={(e) =>
                          updateIntake('communicationPreferences.bestTimeToContact', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Goals & expectations</h4>
                  <input
                    type="text"
                    placeholder="Postpartum goals (comma-separated)"
                    value={(intake.postpartumGoals ?? []).join(', ')}
                    onChange={(e) =>
                      updateIntake(
                        'postpartumGoals',
                        e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
                  />
                  <textarea
                    rows={2}
                    placeholder="Concerns or fears"
                    value={Array.isArray(intake.concernsOrFears) ? intake.concernsOrFears.join('\n') : ''}
                    onChange={(e) =>
                      updateIntake(
                        'concernsOrFears',
                        e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
                  />
                  <textarea
                    rows={2}
                    placeholder="What do you hope to get from support?"
                    value={intake.expectations ?? ''}
                    onChange={(e) => updateIntake('expectations', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <label className="inline-flex items-center text-sm mt-2">
                    <input
                      type="checkbox"
                      checked={intake.previousDoulaExperience ?? false}
                      onChange={(e) => updateIntake('previousDoulaExperience', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">Previous doula/postpartum support</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => saveIntake(false)}
                  disabled={savingIntake}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {savingIntake ? 'Saving…' : 'Save intake draft'}
                </button>
                <button
                  type="button"
                  onClick={() => saveIntake(true)}
                  disabled={savingIntake}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingIntake ? 'Saving…' : 'Mark intake complete'}
                </button>
                {intakeCompleted && (
                  <span className="inline-flex items-center text-sm text-green-700">Intake completed</span>
                )}
              </div>
            </section>

            {/* Care Plans */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Care Plans</h3>
              <p className="text-sm text-gray-500 mb-4">Create and manage care plans for this client.</p>
              <button
                type="button"
                onClick={() => setShowCarePlans(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Open Care Plans
              </button>
            </section>

            {showCarePlans && (
              <CarePlanManager
                clientId={clientId}
                clientUserId={getUserIdString(client.userId)}
                clientName={displayName}
                onClose={() => setShowCarePlans(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
