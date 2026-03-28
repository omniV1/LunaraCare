import React from 'react';
import { FEEDING_OPTIONS } from '../intakeTypes';
import type { StepProps } from '../intakeUtils';
import { splitCsv, toggleArrayValue } from '../intakeUtils';

export const FeedingStep: React.FC<StepProps> = ({ data, update, setData }) => (
  <div className="space-y-5">
    <p className="text-sm text-[#6B4D37]">
      If feeding isn&apos;t relevant right now (for example, during pregnancy or after loss), you can skip this step.
    </p>
    <div>
      <label className="block text-sm font-medium text-[#4E1B00]/80 mb-2">Feeding method(s) (optional)</label>
      <div className="flex flex-wrap gap-3">
        {FEEDING_OPTIONS.map(opt => (
          <label key={opt.value} className="inline-flex items-center">
            <input
              type="checkbox"
              checked={data.feedingPreferences?.includes(opt.value) ?? false}
              onChange={() => setData(prev => toggleArrayValue(prev, 'feedingPreferences', opt.value))}
              className="rounded border-[#CAC3BC] text-[#6B4D37] focus:ring-[#6B4D37]"
            />
            <span className="ml-2 text-sm text-[#4E1B00]/80">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
    <div>
      <label htmlFor="feedingChallenges" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
        Feeding challenges (optional)
      </label>
      <input
        id="feedingChallenges"
        type="text"
        value={(data.feedingChallenges ?? []).join(', ')}
        onChange={e => update('feedingChallenges', splitCsv(e.target.value))}
        placeholder="e.g. latch, supply — comma-separated"
        className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
      />
    </div>
    <div>
      <label htmlFor="feedingGoals" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
        Feeding goals (optional)
      </label>
      <textarea
        id="feedingGoals"
        rows={3}
        value={data.feedingGoals ?? ''}
        onChange={e => update('feedingGoals', e.target.value)}
        className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
      />
    </div>
  </div>
);
