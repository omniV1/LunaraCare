/**
 * @module components/intake/intakeValidation
 * Zod schemas for each intake wizard step, plus shared utility functions
 * (CSV splitting, deep get/set, array toggle) used across step components.
 */
import { z } from 'zod';
import type { IntakeData } from './intakeTypes';

export type StepId = 'personal' | 'birth' | 'feeding' | 'support' | 'health';

export const STEPS: StepId[] = ['personal', 'birth', 'feeding', 'support', 'health'];

export const stepLabels: Record<StepId, string> = {
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

export const schemas: Record<StepId, z.ZodTypeAny> = {
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

/** Splits a comma-separated string into a trimmed, non-empty array. */
export function splitCsv(s: string): string[] {
  return s
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Safely retrieves a deeply nested value from an object using a dot-separated path. */
export function get<T = unknown>(obj: unknown, path: string): T | undefined {
  const value = path.split('.').reduce<unknown>((acc, k) => {
    if (!isRecord(acc)) return undefined;
    return acc[k];
  }, obj);
  return value as T | undefined;
}

/** Immutably sets a value at a dot-separated path, creating intermediate objects as needed. */
export function setPath<T extends object>(obj: T | undefined, path: string, value: unknown): T {
  const parts = path.split('.');
  const next = { ...(obj ?? ({} as T)) } as Record<string, unknown>;
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const existing = cur[key];
    cur[key] = isRecord(existing) ? { ...existing } : {};
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return next as unknown as T;
}

/** Toggles a string value in/out of an array at the given path in IntakeData. */
export function toggleArrayValue(prev: IntakeData, path: string, value: string): IntakeData {
  const cur = get<unknown>(prev, path);
  const arr = Array.isArray(cur) ? (cur as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  const next = arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value];
  return setPath(prev, path, next.length === 0 ? undefined : next);
}
