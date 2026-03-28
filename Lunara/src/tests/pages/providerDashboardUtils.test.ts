import {
  getErrorResponseData,
  getUserId,
  getUserName,
  isRecord,
} from '../../pages/providerDashboardUtils';

describe('providerDashboardUtils', () => {
  it('isRecord detects plain objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord('x')).toBe(false);
  });

  it('getUserId handles strings and objects', () => {
    expect(getUserId('abc')).toBe('abc');
    expect(getUserId({ _id: '1' })).toBe('1');
    expect(getUserId({ id: 2 })).toBe('2');
    expect(getUserId({})).toBe('');
  });

  it('getUserName prefers full name, then email, then Unknown', () => {
    expect(getUserName({ firstName: 'A', lastName: 'B', email: 'a@b.com' })).toEqual({ name: 'A B', email: 'a@b.com' });
    expect(getUserName({ email: 'e@x.com' })).toEqual({ name: 'e@x.com', email: 'e@x.com' });
    expect(getUserName('nope')).toEqual({ name: 'Unknown' });
  });

  it('getErrorResponseData pulls response.data', () => {
    expect(getErrorResponseData({ response: { data: { message: 'x' } } })).toEqual({ message: 'x' });
    expect(getErrorResponseData({})).toBeUndefined();
    expect(getErrorResponseData(null)).toBeUndefined();
  });
});

