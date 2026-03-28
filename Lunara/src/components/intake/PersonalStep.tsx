import React from 'react';
import type { IntakeData } from './intakeTypes';

export interface PersonalStepProps {
  data: IntakeData;
  errors: Record<string, string>;
  onUpdate: (path: string, value: unknown) => void;
}

export const PersonalStep: React.FC<PersonalStepProps> = ({ data, errors, onUpdate }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Partner / support person name</label>
        <input
          type="text"
          value={data.partnerName ?? ''}
          onChange={e => onUpdate('partnerName', e.target.value)}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
        {errors.partnerName && <p className="text-xs text-red-700 mt-1">{errors.partnerName}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Partner phone</label>
        <input
          type="text"
          value={data.partnerPhone ?? ''}
          onChange={e => onUpdate('partnerPhone', e.target.value)}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
        {errors.partnerPhone && <p className="text-xs text-red-700 mt-1">{errors.partnerPhone}</p>}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Address (optional)</label>
      <input
        type="text"
        placeholder="Street"
        value={data.address?.street ?? ''}
        onChange={e => onUpdate('address.street', e.target.value)}
        className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md mb-2"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="City"
          value={data.address?.city ?? ''}
          onChange={e => onUpdate('address.city', e.target.value)}
          className="px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
        <input
          type="text"
          placeholder="State"
          value={data.address?.state ?? ''}
          onChange={e => onUpdate('address.state', e.target.value)}
          className="px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
        <input
          type="text"
          placeholder="ZIP"
          value={data.address?.zipCode ?? ''}
          onChange={e => onUpdate('address.zipCode', e.target.value)}
          className="px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Emergency contact name</label>
        <input
          type="text"
          value={data.emergencyContact?.name ?? ''}
          onChange={e => onUpdate('emergencyContact.name', e.target.value)}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Emergency contact phone</label>
        <input
          type="text"
          value={data.emergencyContact?.phone ?? ''}
          onChange={e => onUpdate('emergencyContact.phone', e.target.value)}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#4E1B00]/80 mb-1">Relationship</label>
        <input
          type="text"
          value={data.emergencyContact?.relationship ?? ''}
          onChange={e => onUpdate('emergencyContact.relationship', e.target.value)}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
    </div>
  </div>
);
