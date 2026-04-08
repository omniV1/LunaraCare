/**
 * @module components/intake/steps/SupportStep
 * Wizard-step variant of SupportStep using the shared StepProps interface
 * for support-needs collection within ClientIntakeWizard.
 */
import React from 'react';
import { SUPPORT_OPTIONS } from '../intakeTypes';
import type { StepProps } from '../intakeUtils';
import { splitCsv, toggleArrayValue } from '../intakeUtils';

/** Renders the support needs wizard step with checkboxes and free-text fields. */
export const SupportStep: React.FC<StepProps> = ({ data, update, setData }) => (
  <div className="space-y-5">
    <div>
      <label className="block text-sm font-medium text-[#4E1B00]/80 mb-2">Support needs (optional)</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SUPPORT_OPTIONS.map(opt => (
          <label key={opt.value} className="inline-flex items-center">
            <input
              type="checkbox"
              checked={data.supportNeeds?.includes(opt.value) ?? false}
              onChange={() => setData(prev => toggleArrayValue(prev, 'supportNeeds', opt.value))}
              className="rounded border-[#CAC3BC] text-[#6B4D37] focus:ring-[#6B4D37]"
            />
            <span className="ml-2 text-sm text-[#4E1B00]/80">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Other support needs (optional)</label>
      <textarea
        rows={3}
        value={data.additionalSupportNeeds ?? ''}
        onChange={e => update('additionalSupportNeeds', e.target.value)}
        className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
      />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Postpartum goals (optional)</label>
        <input
          type="text"
          value={(data.postpartumGoals ?? []).join(', ')}
          onChange={e => update('postpartumGoals', splitCsv(e.target.value))}
          placeholder="comma-separated"
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Concerns or fears (optional)</label>
        <input
          type="text"
          value={(data.concernsOrFears ?? []).join(', ')}
          onChange={e => update('concernsOrFears', splitCsv(e.target.value))}
          placeholder="comma-separated"
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
        What do you hope to get from support? (optional)
      </label>
      <textarea
        rows={3}
        value={data.expectations ?? ''}
        onChange={e => update('expectations', e.target.value)}
        className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
      />
    </div>
    <label className="inline-flex items-center">
      <input
        type="checkbox"
        checked={data.previousDoulaExperience ?? false}
        onChange={e => update('previousDoulaExperience', e.target.checked)}
        className="rounded border-[#CAC3BC] text-[#6B4D37] focus:ring-[#6B4D37]"
      />
      <span className="ml-2 text-sm text-[#4E1B00]/80">I have had postpartum support before</span>
    </label>
  </div>
);
