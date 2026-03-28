import { describe, it, expect } from '@jest/globals';
import {
  USER_SUMMARY_FIELDS,
  PROVIDER_LIST_FIELDS,
  paginationDefaults,
} from '../../src/utils/queryOptimization';

describe('queryOptimization', () => {
  it('USER_SUMMARY_FIELDS contains expected fields', () => {
    expect(USER_SUMMARY_FIELDS).toContain('firstName');
    expect(USER_SUMMARY_FIELDS).toContain('lastName');
    expect(USER_SUMMARY_FIELDS).toContain('email');
    expect(USER_SUMMARY_FIELDS).toContain('role');
  });

  it('PROVIDER_LIST_FIELDS contains expected fields', () => {
    expect(PROVIDER_LIST_FIELDS).toContain('userId');
    expect(PROVIDER_LIST_FIELDS).toContain('status');
    expect(PROVIDER_LIST_FIELDS).toContain('professionalInfo.specialties');
  });

  describe('paginationDefaults', () => {
    it('returns defaults when no query params given', () => {
      const result = paginationDefaults({});
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('parses numeric strings', () => {
      const result = paginationDefaults({ page: '3', limit: '10' });
      expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
    });

    it('accepts raw numbers', () => {
      const result = paginationDefaults({ page: 2, limit: 50 });
      expect(result).toEqual({ page: 2, limit: 50, skip: 50 });
    });

    it('clamps page to minimum 1', () => {
      const result = paginationDefaults({ page: '-5' });
      expect(result.page).toBe(1);
      expect(result.skip).toBe(0);
    });

    it('falls back to default when limit is 0 (falsy)', () => {
      const result = paginationDefaults({ limit: '0' });
      expect(result.limit).toBe(20); // 0 is falsy, so falls back to default 20
    });

    it('clamps limit to minimum 1', () => {
      const result = paginationDefaults({ limit: '-5' });
      expect(result.limit).toBe(1);
    });

    it('clamps limit to maximum 100', () => {
      const result = paginationDefaults({ limit: '999' });
      expect(result.limit).toBe(100);
    });

    it('handles NaN values gracefully', () => {
      const result = paginationDefaults({ page: 'abc', limit: 'xyz' });
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });
  });
});
