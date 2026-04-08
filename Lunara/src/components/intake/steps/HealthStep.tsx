/**
 * @module components/intake/steps/HealthStep
 * Wizard-step variant of HealthStep using the shared StepProps interface
 * for health-information collection within ClientIntakeWizard.
 */
import React from 'react';
import type { StepProps } from '../intakeUtils';
import { splitCsv } from '../intakeUtils';

/** Renders the health information wizard step. */
export const HealthStep: React.FC<StepProps> = ({ data, update }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label htmlFor="currentMedications" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
          Current medications (optional)
        </label>
        <input
          id="currentMedications"
          type="text"
          value={(data.currentMedications ?? []).join(', ')}
          onChange={e => update('currentMedications', splitCsv(e.target.value))}
          placeholder="comma-separated"
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="allergies" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
          Allergies (optional)
        </label>
        <input
          id="allergies"
          type="text"
          value={(data.allergies ?? []).join(', ')}
          onChange={e => update('allergies', splitCsv(e.target.value))}
          placeholder="comma-separated"
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
    </div>
    <div>
      <label htmlFor="medicalHistory" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
        Medical history (optional)
      </label>
      <input
        id="medicalHistory"
        type="text"
        value={(data.medicalHistory ?? []).join(', ')}
        onChange={e => update('medicalHistory', splitCsv(e.target.value))}
        placeholder="comma-separated"
        className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
      />
    </div>
    <div>
      <label htmlFor="mentalHealthHistory" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
        Mental health history (optional)
      </label>
      <textarea
        id="mentalHealthHistory"
        rows={3}
        value={data.mentalHealthHistory ?? ''}
        onChange={e => update('mentalHealthHistory', e.target.value)}
        className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
      />
    </div>
    <label htmlFor="postpartumMoodConcerns" className="inline-flex items-center">
      <input
        id="postpartumMoodConcerns"
        type="checkbox"
        checked={data.postpartumMoodConcerns ?? false}
        onChange={e => update('postpartumMoodConcerns', e.target.checked)}
        className="rounded border-[#CAC3BC] text-[#6B4D37] focus:ring-[#6B4D37]"
      />
      <span className="ml-2 text-sm text-[#4E1B00]/80">
        I have concerns about my mood or emotional well-being
      </span>
    </label>
  </div>
);
