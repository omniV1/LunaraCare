/**
 * @module components/intake/HealthStep
 * Intake wizard step for health information — medications, allergies,
 * medical history, mental health, and postpartum mood concerns.
 */
import React from 'react';
import type { IntakeData } from './intakeTypes';
import { splitCsv } from './intakeValidation';

/** Props for the standalone HealthStep component. */
export interface HealthStepProps {
  data: IntakeData;
  onUpdate: (path: string, value: unknown) => void;
}

/** Renders the health information intake step. */
export const HealthStep: React.FC<HealthStepProps> = ({ data, onUpdate }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Current medications (optional)</label>
        <input
          type="text"
          value={(data.currentMedications ?? []).join(', ')}
          onChange={e => onUpdate('currentMedications', splitCsv(e.target.value))}
          placeholder="comma-separated"
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Allergies (optional)</label>
        <input
          type="text"
          value={(data.allergies ?? []).join(', ')}
          onChange={e => onUpdate('allergies', splitCsv(e.target.value))}
          placeholder="comma-separated"
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Medical history (optional)</label>
      <input
        type="text"
        value={(data.medicalHistory ?? []).join(', ')}
        onChange={e => onUpdate('medicalHistory', splitCsv(e.target.value))}
        placeholder="comma-separated"
        className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Mental health history (optional)</label>
      <textarea
        rows={3}
        value={data.mentalHealthHistory ?? ''}
        onChange={e => onUpdate('mentalHealthHistory', e.target.value)}
        className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
      />
    </div>
    <label className="inline-flex items-center">
      <input
        type="checkbox"
        checked={data.postpartumMoodConcerns ?? false}
        onChange={e => onUpdate('postpartumMoodConcerns', e.target.checked)}
        className="rounded border-[#CAC3BC] text-[#6B4D37] focus:ring-[#6B4D37]"
      />
      <span className="ml-2 text-sm text-[#4E1B00]/80">
        I have concerns about my mood or emotional well-being
      </span>
    </label>
  </div>
);
