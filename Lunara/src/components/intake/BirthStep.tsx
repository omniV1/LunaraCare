import React from 'react';
import type { IntakeData } from './intakeTypes';
import { splitCsv } from './intakeValidation';

export interface BirthStepProps {
  data: IntakeData;
  onUpdate: (path: string, value: unknown) => void;
}

export const BirthStep: React.FC<BirthStepProps> = ({ data, onUpdate }) => (
  <div className="space-y-5">
    <p className="text-sm text-[#6B4D37]">
      Share what fits your story right now—this can include current pregnancy, postpartum recovery,
      or postpartum after loss.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Is this your first birth?</label>
        <select
          value={typeof data.isFirstBaby === 'boolean' ? (data.isFirstBaby ? 'yes' : 'no') : ''}
          onChange={e => onUpdate('isFirstBaby', e.target.value === '' ? undefined : e.target.value === 'yes')}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        >
          <option value="">Prefer not to say</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Number of children (if applicable)</label>
        <input
          type="number"
          min={0}
          value={data.numberOfChildren ?? ''}
          onChange={e => onUpdate('numberOfChildren', e.target.value === '' ? undefined : Number(e.target.value))}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
          Current pregnancy complications (optional)
        </label>
        <input
          type="text"
          value={(data.currentPregnancyComplications ?? []).join(', ')}
          onChange={e => onUpdate('currentPregnancyComplications', splitCsv(e.target.value))}
          placeholder="comma-separated"
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
    </div>

    <div className="bg-[#FAF7F2] border border-[#DED7CD] rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-[#4E1B00]">Most recent birth (optional)</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#4E1B00]/80 mb-1">Birth type</label>
          <select
            value={data.birthExperience?.birthType ?? ''}
            onChange={e => onUpdate('birthExperience.birthType', e.target.value === '' ? undefined : e.target.value)}
            className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md text-sm"
          >
            <option value="">—</option>
            <option value="vaginal">Vaginal</option>
            <option value="cesarean">C-section</option>
            <option value="vbac">VBAC</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4E1B00]/80 mb-1">Location</label>
          <select
            value={data.birthExperience?.birthLocation ?? ''}
            onChange={e => onUpdate('birthExperience.birthLocation', e.target.value === '' ? undefined : e.target.value)}
            className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md text-sm"
          >
            <option value="">—</option>
            <option value="hospital">Hospital</option>
            <option value="birth_center">Birth center</option>
            <option value="home">Home</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4E1B00]/80 mb-1">Labor duration (hours)</label>
          <input
            type="number"
            min={0}
            value={data.birthExperience?.laborDuration ?? ''}
            onChange={e =>
              onUpdate('birthExperience.laborDuration', e.target.value === '' ? undefined : Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md text-sm"
          />
        </div>
      </div>
    </div>
  </div>
);
