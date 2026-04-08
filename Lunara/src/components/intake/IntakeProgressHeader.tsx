/**
 * @module components/intake/IntakeProgressHeader
 * Progress bar and step navigator for the multi-step intake wizard,
 * showing current step, completion percentage, and auto-save status.
 */
import React from 'react';
import type { StepId } from './intakeValidation';
import { stepLabels } from './intakeValidation';

/** Props for the intake wizard progress header. */
export interface IntakeProgressHeaderProps {
  steps: StepId[];
  step: StepId;
  stepIndex: number;
  progressPct: number;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  onStepChange: (step: StepId) => void;
}

/** Renders the step progress bar, mobile step selector, and save-status indicator. */
export const IntakeProgressHeader: React.FC<IntakeProgressHeaderProps> = ({
  steps,
  step,
  stepIndex,
  progressPct,
  saveStatus,
  lastSavedAt,
  onStepChange,
}) => (
  <>
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
        onChange={e => onStepChange(e.target.value as StepId)}
        className="w-full min-h-[44px] px-4 py-2.5 rounded-lg border border-[#CAC3BC] bg-white text-[#4E1B00] font-medium text-base focus:ring-2 focus:ring-[#6B4D37] focus:border-[#6B4D37]"
      >
        {steps.map((s, idx) => (
          <option key={s} value={s}>
            {idx + 1}. {stepLabels[s]}
          </option>
        ))}
      </select>
    </div>
  </>
);
