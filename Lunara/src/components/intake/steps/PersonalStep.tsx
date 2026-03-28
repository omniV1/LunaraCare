import React from 'react';
import type { StepProps } from '../intakeUtils';

export const PersonalStep: React.FC<StepProps> = ({ data, errors, update }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="partnerName" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
          Partner / support person name
        </label>
        <input
          id="partnerName"
          type="text"
          value={data.partnerName ?? ''}
          onChange={e => update('partnerName', e.target.value)}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
        {errors.partnerName && <p className="text-xs text-red-700 mt-1">{errors.partnerName}</p>}
      </div>
      <div>
        <label htmlFor="partnerPhone" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
          Partner phone
        </label>
        <input
          id="partnerPhone"
          type="text"
          value={data.partnerPhone ?? ''}
          onChange={e => update('partnerPhone', e.target.value)}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
        {errors.partnerPhone && <p className="text-xs text-red-700 mt-1">{errors.partnerPhone}</p>}
      </div>
    </div>

    <div>
      <label htmlFor="addressStreet" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
        Address (optional)
      </label>
      <input
        id="addressStreet"
        type="text"
        placeholder="Street"
        value={data.address?.street ?? ''}
        onChange={e => update('address.street', e.target.value)}
        className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md mb-2"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          aria-label="City"
          type="text"
          placeholder="City"
          value={data.address?.city ?? ''}
          onChange={e => update('address.city', e.target.value)}
          className="px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
        <input
          aria-label="State"
          type="text"
          placeholder="State"
          value={data.address?.state ?? ''}
          onChange={e => update('address.state', e.target.value)}
          className="px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
        <input
          aria-label="ZIP"
          type="text"
          placeholder="ZIP"
          value={data.address?.zipCode ?? ''}
          onChange={e => update('address.zipCode', e.target.value)}
          className="px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label htmlFor="emergencyName" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
          Emergency contact name
        </label>
        <input
          id="emergencyName"
          type="text"
          value={data.emergencyContact?.name ?? ''}
          onChange={e => update('emergencyContact.name', e.target.value)}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="emergencyPhone" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
          Emergency contact phone
        </label>
        <input
          id="emergencyPhone"
          type="text"
          value={data.emergencyContact?.phone ?? ''}
          onChange={e => update('emergencyContact.phone', e.target.value)}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="emergencyRelationship" className="block text-sm font-medium text-[#4E1B00]/80 mb-1">
          Relationship
        </label>
        <input
          id="emergencyRelationship"
          type="text"
          value={data.emergencyContact?.relationship ?? ''}
          onChange={e => update('emergencyContact.relationship', e.target.value)}
          className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md"
        />
      </div>
    </div>
  </div>
);
