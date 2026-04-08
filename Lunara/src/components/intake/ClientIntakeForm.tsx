/**
 * @module components/intake/ClientIntakeForm
 * Single-page intake form for new postpartum clients — collects personal,
 * family, feeding, support, health, communication, and goals data with
 * save-draft and submit capabilities.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../api/apiClient';
import { FEEDING_OPTIONS, SUPPORT_OPTIONS, type IntakeData } from './intakeTypes';

/** Props for the client intake form. */
interface ClientIntakeFormProps {
  onComplete?: () => void;
}

/** Renders the full single-page postpartum intake form with draft saving. */
export const ClientIntakeForm: React.FC<ClientIntakeFormProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intakeCompleted, setIntakeCompleted] = useState(false);
  const [data, setData] = useState<IntakeData>({});

  const loadIntake = useCallback(async () => {
    setLoading(true);
    try {
      const api = ApiClient.getInstance();
      const res = await api.get<{ intake?: IntakeData; intakeCompleted?: boolean }>('/intake/me');
      setData(res?.intake ?? {});
      setIntakeCompleted(res?.intakeCompleted ?? false);
    } catch {
      toast.error('Failed to load intake form');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntake();
  }, [loadIntake]);

  const update = (path: string, value: unknown) => {
    setData((prev) => {
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

  const save = async (isComplete: boolean) => {
    setSaving(true);
    try {
      const api = ApiClient.getInstance();
      await api.post('/intake', { ...data, isComplete });
      setIntakeCompleted(isComplete);
      toast.success(isComplete ? 'Intake submitted. Thank you!' : 'Draft saved.');
      if (isComplete) onComplete?.();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Postpartum intake</h2>
        <p className="text-sm text-gray-500 mt-1">
          Help us personalize your care. You can save a draft and finish later.
        </p>
      </div>

      {/* Personal & contact */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal & contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Partner / support person name</label>
            <input
              type="text"
              value={data.partnerName ?? ''}
              onChange={(e) => update('partnerName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Partner phone</label>
            <input
              type="text"
              value={data.partnerPhone ?? ''}
              onChange={(e) => update('partnerPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
          <input
            type="text"
            placeholder="Street"
            value={data.address?.street ?? ''}
            onChange={(e) => update('address.street', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="City"
              value={data.address?.city ?? ''}
              onChange={(e) => update('address.city', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="State"
              value={data.address?.state ?? ''}
              onChange={(e) => update('address.state', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="ZIP"
              value={data.address?.zipCode ?? ''}
              onChange={(e) => update('address.zipCode', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency contact name</label>
            <input
              type="text"
              value={data.emergencyContact?.name ?? ''}
              onChange={(e) => update('emergencyContact.name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency contact phone</label>
            <input
              type="text"
              value={data.emergencyContact?.phone ?? ''}
              onChange={(e) => update('emergencyContact.phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
            <input
              type="text"
              value={data.emergencyContact?.relationship ?? ''}
              onChange={(e) => update('emergencyContact.relationship', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </section>

      {/* Family */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Family</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of children (including newborn)</label>
          <input
            type="number"
            min={0}
            value={data.numberOfChildren ?? ''}
            onChange={(e) => update('numberOfChildren', e.target.value === '' ? undefined : Number(e.target.value))}
            className="w-24 px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </section>

      {/* Feeding */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Feeding</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Feeding method(s)</label>
          <div className="flex flex-wrap gap-3">
            {FEEDING_OPTIONS.map((opt) => (
              <label key={opt.value} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={(data.feedingPreferences ?? []).includes(opt.value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...(data.feedingPreferences ?? []), opt.value]
                      : (data.feedingPreferences ?? []).filter((x) => x !== opt.value);
                    update('feedingPreferences', next);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Feeding challenges (if any)</label>
          <input
            type="text"
            value={(data.feedingChallenges ?? []).join(', ')}
            onChange={(e) => update('feedingChallenges', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="e.g. latch issues, supply"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Feeding goals</label>
          <textarea
            rows={2}
            value={data.feedingGoals ?? ''}
            onChange={(e) => update('feedingGoals', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </section>

      {/* Support needs */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Support needs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {SUPPORT_OPTIONS.map((opt) => (
            <label key={opt.value} className="inline-flex items-center">
              <input
                type="checkbox"
                checked={(data.supportNeeds ?? []).includes(opt.value)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...(data.supportNeeds ?? []), opt.value]
                    : (data.supportNeeds ?? []).filter((x) => x !== opt.value);
                  update('supportNeeds', next);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Other support needs</label>
          <textarea
            rows={2}
            value={data.additionalSupportNeeds ?? ''}
            onChange={(e) => update('additionalSupportNeeds', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </section>

      {/* Health */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Health</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current medications</label>
            <input
              type="text"
              value={(data.currentMedications ?? []).join(', ')}
              onChange={(e) => update('currentMedications', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            <input
              type="text"
              value={(data.allergies ?? []).join(', ')}
              onChange={(e) => update('allergies', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mental health history (optional)</label>
            <textarea
              rows={2}
              value={data.mentalHealthHistory ?? ''}
              onChange={(e) => update('mentalHealthHistory', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={data.postpartumMoodConcerns ?? false}
              onChange={(e) => update('postpartumMoodConcerns', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">I have concerns about my mood or emotional well-being</span>
          </label>
        </div>
      </section>

      {/* Communication */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Communication</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred contact method</label>
            <select
              value={data.communicationPreferences?.preferredContactMethod ?? 'app'}
              onChange={(e) => update('communicationPreferences.preferredContactMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="app">In-app message</option>
              <option value="text">Text</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Best time to contact</label>
            <input
              type="text"
              placeholder="e.g. Afternoon"
              value={data.communicationPreferences?.bestTimeToContact ?? ''}
              onChange={(e) => update('communicationPreferences.bestTimeToContact', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </section>

      {/* Goals & expectations */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Goals & expectations</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postpartum goals</label>
            <input
              type="text"
              value={(data.postpartumGoals ?? []).join(', ')}
              onChange={(e) => update('postpartumGoals', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              placeholder="e.g. Establish feeding, get more sleep"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concerns or fears</label>
            <textarea
              rows={2}
              value={Array.isArray(data.concernsOrFears) ? data.concernsOrFears.join('\n') : ''}
              onChange={(e) =>
                update(
                  'concernsOrFears',
                  e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What do you hope to get from support?</label>
            <textarea
              rows={3}
              value={data.expectations ?? ''}
              onChange={(e) => update('expectations', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={data.previousDoulaExperience ?? false}
              onChange={(e) => update('previousDoulaExperience', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">I have had doula or postpartum support before</span>
          </label>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Submitting…' : 'Submit intake'}
        </button>
      </div>

      {intakeCompleted && (
        <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
          You’ve submitted your intake. You can still edit and save draft changes above, then submit again if needed.
        </p>
      )}
    </div>
  );
};
