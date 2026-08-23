import {
  canonicalMonth, eligibleIncomePlanMonths, incomePlanPayload,
  nextCanonicalMonth, previousCanonicalMonth,
} from '../monthlyIncomePlanUtils';

describe('monthlyIncomePlanUtils', () => {
  it('creates canonical local months', () => {
    expect(canonicalMonth(new Date(2026, 7, 23))).toBe('2026-08-01');
  });
  it('returns unique current and next months', () => {
    expect(eligibleIncomePlanMonths(new Date(2026, 7, 23))).toEqual(['2026-08-01', '2026-09-01']);
  });
  it('builds only positive payloads', () => {
    expect(incomePlanPayload('2026-08-01', '123,45')).toEqual({yearMonth: '2026-08-01', amount: 123.45});
    expect(incomePlanPayload('2026-08-01', 0)).toBeNull();
    expect(incomePlanPayload('2026-08-02', 10)).toBeNull();
  });
  it('handles year boundaries without parsing dates', () => {
    expect(nextCanonicalMonth('2026-12-01')).toBe('2027-01-01');
    expect(previousCanonicalMonth('2027-01-01')).toBe('2026-12-01');
  });
});
