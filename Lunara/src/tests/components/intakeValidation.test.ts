import { schemas, STEPS, stepLabels, splitCsv, get, setPath, toggleArrayValue } from '../../components/intake/intakeValidation';
import type { IntakeData } from '../../components/intake/intakeTypes';

describe('intakeValidation', () => {
  describe('STEPS and stepLabels', () => {
    it('has 5 steps in order', () => {
      expect(STEPS).toEqual(['personal', 'birth', 'feeding', 'support', 'health']);
    });

    it('has labels for each step', () => {
      expect(stepLabels.personal).toBe('Personal');
      expect(stepLabels.birth).toBe('Pregnancy & birth');
      expect(stepLabels.feeding).toBe('Feeding');
      expect(stepLabels.support).toBe('Support');
      expect(stepLabels.health).toBe('Health');
    });
  });

  describe('splitCsv', () => {
    it('splits and trims', () => {
      expect(splitCsv('a, b, c')).toEqual(['a', 'b', 'c']);
    });
    it('filters empty', () => {
      expect(splitCsv('a,,b,')).toEqual(['a', 'b']);
    });
    it('returns empty for empty string', () => {
      expect(splitCsv('')).toEqual([]);
    });
  });

  describe('get', () => {
    it('gets top level', () => {
      expect(get({ x: 1 }, 'x')).toBe(1);
    });
    it('gets nested', () => {
      expect(get({ a: { b: 2 } }, 'a.b')).toBe(2);
    });
    it('returns undefined for missing', () => {
      expect(get({}, 'x')).toBeUndefined();
    });
    it('returns undefined through non-object', () => {
      expect(get({ a: 'str' }, 'a.b')).toBeUndefined();
    });
  });

  describe('setPath', () => {
    it('sets top level', () => {
      expect(setPath({ x: 1 }, 'x', 2)).toEqual({ x: 2 });
    });
    it('sets nested', () => {
      expect(setPath({ a: { b: 1 } }, 'a.b', 2)).toEqual({ a: { b: 2 } });
    });
    it('creates intermediates', () => {
      expect(setPath({} as Record<string, unknown>, 'a.b', 1)).toEqual({ a: { b: 1 } });
    });
    it('handles undefined root', () => {
      expect(setPath(undefined, 'x', 1)).toEqual({ x: 1 });
    });
  });

  describe('toggleArrayValue', () => {
    it('adds value', () => {
      expect(get(toggleArrayValue({} as unknown as IntakeData, 'items', 'a'), 'items')).toEqual(['a']);
    });
    it('removes value', () => {
      expect(get(toggleArrayValue({ items: ['a', 'b'] } as unknown as IntakeData, 'items', 'a'), 'items')).toEqual(['b']);
    });
    it('sets undefined when empty', () => {
      expect(get(toggleArrayValue({ items: ['a'] } as unknown as IntakeData, 'items', 'a'), 'items')).toBeUndefined();
    });
  });

  describe('schemas', () => {
    it('personal schema validates valid data', () => {
      const result = schemas.personal.safeParse({
        partnerName: 'Jane',
        partnerPhone: '555-0000',
        address: { street: '123 Main', city: 'Portland', state: 'OR', zipCode: '97201' },
        emergencyContact: { name: 'John', phone: '555-1111', relationship: 'spouse' },
      });
      expect(result.success).toBe(true);
    });

    it('personal schema accepts empty object', () => {
      expect(schemas.personal.safeParse({}).success).toBe(true);
    });

    it('personal schema rejects too-long partnerName', () => {
      const result = schemas.personal.safeParse({ partnerName: 'x'.repeat(121) });
      expect(result.success).toBe(false);
    });

    it('birth schema validates valid data', () => {
      const result = schemas.birth.safeParse({
        isFirstBaby: true,
        numberOfChildren: 0,
        birthExperience: { birthType: 'vaginal', birthLocation: 'hospital', laborDuration: 12 },
      });
      expect(result.success).toBe(true);
    });

    it('birth schema rejects invalid birthType', () => {
      const result = schemas.birth.safeParse({
        birthExperience: { birthType: 'underwater' },
      });
      expect(result.success).toBe(false);
    });

    it('birth schema rejects negative numberOfChildren', () => {
      const result = schemas.birth.safeParse({ numberOfChildren: -1 });
      expect(result.success).toBe(false);
    });

    it('feeding schema validates valid data', () => {
      const result = schemas.feeding.safeParse({
        feedingPreferences: ['breastfeeding'],
        feedingGoals: 'exclusive breastfeeding',
      });
      expect(result.success).toBe(true);
    });

    it('support schema validates valid data', () => {
      const result = schemas.support.safeParse({
        supportNeeds: ['emotional_support'],
        previousDoulaExperience: false,
        expectations: 'Gentle guidance',
      });
      expect(result.success).toBe(true);
    });

    it('health schema validates valid data', () => {
      const result = schemas.health.safeParse({
        currentMedications: ['prenatal vitamins'],
        allergies: ['peanuts'],
        postpartumMoodConcerns: true,
      });
      expect(result.success).toBe(true);
    });

    it('health schema accepts empty object', () => {
      expect(schemas.health.safeParse({}).success).toBe(true);
    });

    it('each step has a schema', () => {
      for (const step of STEPS) {
        expect(schemas[step]).toBeDefined();
      }
    });
  });
});
