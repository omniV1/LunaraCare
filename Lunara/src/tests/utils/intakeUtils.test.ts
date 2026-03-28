import { splitCsv, get, setPath, toggleArrayValue } from '../../components/intake/intakeUtils';
import type { IntakeData } from '../../components/intake/intakeTypes';

describe('intakeUtils', () => {
  describe('splitCsv', () => {
    it('splits comma-separated values', () => {
      expect(splitCsv('a, b, c')).toEqual(['a', 'b', 'c']);
    });

    it('trims whitespace', () => {
      expect(splitCsv('  foo , bar  ')).toEqual(['foo', 'bar']);
    });

    it('filters out empty strings', () => {
      expect(splitCsv('a,,b,')).toEqual(['a', 'b']);
    });

    it('returns empty array for empty string', () => {
      expect(splitCsv('')).toEqual([]);
    });
  });

  describe('get', () => {
    it('gets a top-level value', () => {
      expect(get({ name: 'Jane' }, 'name')).toBe('Jane');
    });

    it('gets a nested value', () => {
      expect(get({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42);
    });

    it('returns undefined for missing path', () => {
      expect(get({ a: 1 }, 'b')).toBeUndefined();
    });

    it('returns undefined for deeply missing path', () => {
      expect(get({ a: { b: 1 } }, 'a.x.y')).toBeUndefined();
    });

    it('returns undefined when traversing non-object', () => {
      expect(get({ a: 'string' }, 'a.b')).toBeUndefined();
    });

    it('returns undefined for null/undefined root', () => {
      expect(get(null, 'a')).toBeUndefined();
      expect(get(undefined, 'a')).toBeUndefined();
    });
  });

  describe('setPath', () => {
    it('sets a top-level value', () => {
      expect(setPath({ name: 'old' }, 'name', 'new')).toEqual({ name: 'new' });
    });

    it('sets a nested value', () => {
      const result = setPath({ a: { b: 1 } }, 'a.b', 2);
      expect(result).toEqual({ a: { b: 2 } });
    });

    it('creates intermediate objects', () => {
      const result = setPath({} as Record<string, unknown>, 'a.b.c', 'val');
      expect(result).toEqual({ a: { b: { c: 'val' } } });
    });

    it('does not mutate original object', () => {
      const original = { a: { b: 1 } };
      const result = setPath(original, 'a.b', 2);
      expect(original.a.b).toBe(1);
      expect(result.a.b).toBe(2);
    });

    it('handles undefined root', () => {
      const result = setPath(undefined, 'x', 1);
      expect(result).toEqual({ x: 1 });
    });
  });

  describe('toggleArrayValue', () => {
    it('adds a value to an empty array', () => {
      const data: IntakeData = {};
      const result = toggleArrayValue(data, 'items', 'a');
      expect(get(result, 'items')).toEqual(['a']);
    });

    it('removes a value that exists', () => {
      const data = { items: ['a', 'b'] } as unknown as IntakeData;
      const result = toggleArrayValue(data, 'items', 'a');
      expect(get(result, 'items')).toEqual(['b']);
    });

    it('sets undefined when array becomes empty', () => {
      const data = { items: ['a'] } as unknown as IntakeData;
      const result = toggleArrayValue(data, 'items', 'a');
      expect(get(result, 'items')).toBeUndefined();
    });

    it('adds a value to an existing array', () => {
      const data = { items: ['a'] } as unknown as IntakeData;
      const result = toggleArrayValue(data, 'items', 'b');
      expect(get(result, 'items')).toEqual(['a', 'b']);
    });

    it('works with nested paths', () => {
      const data = { health: { allergies: ['peanuts'] } } as unknown as IntakeData;
      const result = toggleArrayValue(data, 'health.allergies', 'dairy');
      expect(get(result, 'health.allergies')).toEqual(['peanuts', 'dairy']);
    });
  });
});
