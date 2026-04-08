/**
 * @module components/intake/intakeUtils
 * Pure utility helpers for the intake wizard: CSV splitting, deep get/set
 * on nested objects, and array-toggle for checkbox groups.
 */
import type { Dispatch, SetStateAction } from 'react';
import type { IntakeData } from './intakeTypes';

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

/** Toggles a string value in/out of an array located at the given path within IntakeData. */
export function toggleArrayValue(prev: IntakeData, path: string, value: string): IntakeData {
  const cur = get<unknown>(prev, path);
  const arr = Array.isArray(cur) ? (cur as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  const next = arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value];
  return setPath(prev, path, next.length === 0 ? undefined : next);
}

/** Shared props passed to each wizard step component. */
export interface StepProps {
  data: IntakeData;
  errors: Record<string, string>;
  update: (path: string, value: unknown) => void;
  setData: Dispatch<SetStateAction<IntakeData>>;
}
