/**
 * @module components/intake/ClientIntakeWizard
 * Multi-step intake wizard with Zod validation, debounced autosave,
 * step navigation, and final submission for postpartum client onboarding.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { ApiClient } from '../../api/apiClient';
import { useAuth } from '../../contexts/useAuth';
import type { IntakeData } from './intakeTypes';
import { setPath } from './intakeUtils';

import { PersonalStep } from './steps/PersonalStep';
import { BirthStep } from './steps/BirthStep';
import { FeedingStep } from './steps/FeedingStep';
import { SupportStep } from './steps/SupportStep';
import { HealthStep } from './steps/HealthStep';

type StepId = 'personal' | 'birth' | 'feeding' | 'support' | 'health';

const stepLabels: Record<StepId, string> = {
  personal: 'Personal',
  birth: 'Pregnancy & birth',
  feeding: 'Feeding',
  support: 'Support',
  health: 'Health',
};

const optionalShort = (max: number) =>
  z
    .string()
    .max(max, `Must be ${max} characters or less`)
    .optional()
    .or(z.literal(''))
    .transform(v => {
      if (typeof v !== 'string') return undefined;
      const trimmed = v.trim();
      return trimmed === '' ? undefined : trimmed;
    });

const optionalCsvArray = z
  .array(z.string().min(1).max(120))
  .max(50)
  .optional();

const schemas: Record<StepId, z.ZodTypeAny> = {
  personal: z.object({
    partnerName: optionalShort(120),
    partnerPhone: optionalShort(40),
    address: z
      .object({
        street: optionalShort(120),
        city: optionalShort(60),
        state: optionalShort(40),
        zipCode: optionalShort(20),
      })
      .optional(),
    emergencyContact: z
      .object({
        name: optionalShort(120),
        phone: optionalShort(40),
        relationship: optionalShort(60),
      })
      .optional(),
    communicationPreferences: z
      .object({
        preferredContactMethod: z.enum(['phone', 'text', 'email', 'app']).optional(),
        bestTimeToContact: optionalShort(80),
        languagePreference: optionalShort(80),
      })
      .optional(),
  }),
  birth: z.object({
    isFirstBaby: z.boolean().optional(),
    numberOfChildren: z.number().int().min(0).max(25).optional(),
    currentPregnancyComplications: optionalCsvArray,
    birthExperience: z
      .object({
        birthType: z.enum(['vaginal', 'cesarean', 'vbac']).optional(),
        birthLocation: z.enum(['hospital', 'birth_center', 'home']).optional(),
        laborDuration: z.number().min(0).max(240).optional(),
      })
      .optional(),
  }),
  feeding: z.object({
    feedingPreferences: z.array(z.string().max(40)).optional(),
    feedingChallenges: optionalCsvArray,
    feedingGoals: optionalShort(1000),
  }),
  support: z.object({
    supportNeeds: z.array(z.string().max(60)).optional(),
    additionalSupportNeeds: optionalShort(1000),
    postpartumGoals: optionalCsvArray,
    concernsOrFears: optionalCsvArray,
    expectations: optionalShort(1500),
    previousDoulaExperience: z.boolean().optional(),
  }),
  health: z.object({
    medicalHistory: optionalCsvArray,
    currentMedications: optionalCsvArray,
    allergies: optionalCsvArray,
    mentalHealthHistory: optionalShort(1500),
    postpartumMoodConcerns: z.boolean().optional(),
  }),
};

const StepComponent: Record<StepId, React.FC<import('./intakeUtils').StepProps>> = {
  personal: PersonalStep,
  birth: BirthStep,
  feeding: FeedingStep,
  support: SupportStep,
  health: HealthStep,
};

/** Props for the multi-step intake wizard. */
interface ClientIntakeWizardProps {
  onComplete?: () => void;
}

/** Renders the 5-step intake wizard with autosave, validation, and submit. */
export const ClientIntakeWizard: React.FC<ClientIntakeWizardProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intakeCompleted, setIntakeCompleted] = useState(false);
  const [data, setData] = useState<IntakeData>({});
  const [step, setStep] = useState<StepId>('personal');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<number | null>(null);

  const steps = useMemo(() => ['personal', 'birth', 'feeding', 'support', 'health'] as StepId[], []);
  const stepIndex = steps.indexOf(step);
  const progressPct = Math.round(((stepIndex + 1) / steps.length) * 100);

  const loadIntake = async () => {
    setLoading(true);
    try {
      const api = ApiClient.getInstance();
      const res = await api.get<{ intake?: IntakeData | null; intakeCompleted?: boolean }>('/intake/me');
      setData(res?.intake ?? {});
      setIntakeCompleted(res?.intakeCompleted ?? false);
    } catch {
      toast.error('Failed to load intake form');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (path: string, value: unknown) => {
    setData(prev => setPath(prev, path, value));
  };

  const validateStep = (stepId: StepId): boolean => {
    setErrors({});
    const result = schemas[stepId].safeParse(data ?? {});
    if (result.success) return true;
    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const p = issue.path.join('.') || 'form';
      next[p] = issue.message;
    }
    setErrors(next);
    return false;
  };

  const patchStep = async (stepId: StepId) => {
    if (!userId) return;
    setSaveStatus('saving');
    try {
      const api = ApiClient.getInstance();
      await api.patch(`/intake/${userId}/section/${stepId}`, data);
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch {
      setSaveStatus('error');
    }
  };

  // Debounced autosave when data changes
  useEffect(() => {
    if (!userId) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      patchStep(step);
    }, 900);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, step, JSON.stringify(data)]);

  const save = async (isComplete: boolean) => {
    if (!userId) return;
    if (isComplete) {
      const ok = steps.every(s => validateStep(s));
      if (!ok) {
        toast.error('Please review the highlighted fields before submitting.');
        return;
      }
    }
    setSaving(true);
    try {
      const api = ApiClient.getInstance();
      await api.post('/intake', { ...data, isComplete });
      setIntakeCompleted(isComplete);
      toast.success(isComplete ? 'Intake submitted. Thank you!' : 'Draft saved.');
      if (isComplete) onComplete?.();
    } catch (e: unknown) {
      const message =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message ?? 'Failed to save intake.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-[#6B4D37] border-t-transparent" />
      </div>
    );
  }

  const ActiveStep = StepComponent[step];

  return (
    <div className="max-w-3xl mx-auto space-y-4 min-w-0">
      <div>
        <h2 className="text-xl font-semibold text-[#4E1B00]">Intake & onboarding</h2>
        <p className="text-sm text-[#6B4D37] mt-1">
          Help us personalize your care in this season—whether you&apos;re home with a baby, still pregnant,
          or moving through postpartum after loss. Your draft saves automatically.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-[#DED7CD] p-4 sm:p-6 space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#4E1B00]">
              Step {stepIndex + 1} of {steps.length}: {stepLabels[step]}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-full bg-[#FAF7F2] rounded-full overflow-hidden">
                <div className="h-full bg-[#6B4D37]" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-xs text-[#6B4D37]/70 shrink-0">{progressPct}%</span>
            </div>
          </div>
          <div className="text-xs text-[#6B4D37]/70">
            {saveStatus === 'saving' && <span>Saving…</span>}
            {saveStatus === 'saved' && lastSavedAt && (
              <span>Saved {lastSavedAt.toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>
            )}
            {saveStatus === 'error' && <span className="text-amber-700">Save failed (check connection)</span>}
          </div>
        </div>

        <div className="sm:hidden">
          <label htmlFor="intake-step" className="sr-only">
            Select step
          </label>
          <select
            id="intake-step"
            value={step}
            onChange={e => setStep(e.target.value as StepId)}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-lg border border-[#CAC3BC] bg-white text-[#4E1B00] font-medium text-base focus:ring-2 focus:ring-[#6B4D37] focus:border-[#6B4D37]"
          >
            {steps.map((s, idx) => (
              <option key={s} value={s}>
                {idx + 1}. {stepLabels[s]}
              </option>
            ))}
          </select>
        </div>

        <ActiveStep data={data} errors={errors} update={update} setData={setData} />

        <div className="pt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(steps[Math.max(0, stepIndex - 1)])}
              disabled={stepIndex === 0}
              className="min-h-[44px] px-4 py-2 border border-[#CAC3BC] rounded-md text-[#4E1B00]/80 hover:bg-[#FAF7F2] disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!validateStep(step)) {
                  toast.error('Please review the highlighted fields.');
                  return;
                }
                setStep(steps[Math.min(steps.length - 1, stepIndex + 1)]);
              }}
              disabled={stepIndex === steps.length - 1}
              className="min-h-[44px] px-4 py-2 bg-[#4E1B00] text-white rounded-md hover:bg-[#5a402e] disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            <button
              type="button"
              onClick={() => save(false)}
              disabled={saving}
              className="min-h-[44px] px-4 py-2 border border-[#CAC3BC] rounded-md text-[#4E1B00]/80 hover:bg-[#FAF7F2] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving}
              className="min-h-[44px] px-4 py-2 bg-[#6B4D37] text-white rounded-md hover:bg-[#5a402e] disabled:opacity-50"
            >
              {saving ? 'Submitting…' : 'Submit intake'}
            </button>
          </div>
        </div>

        {intakeCompleted && (
          <p className="text-sm text-[#3F4E4F] bg-[#8C9A8C]/20 p-3 rounded-md">
            You&apos;ve submitted your intake. You can still update anything here—your provider will see the latest version.
          </p>
        )}
      </div>
    </div>
  );
};
