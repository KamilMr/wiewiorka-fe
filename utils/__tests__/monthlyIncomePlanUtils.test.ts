import {
  canonicalMonth, eligibleIncomePlanMonths, incomePlanPayload,
  nextCanonicalMonth, previousCanonicalMonth, previousMonthPlan,
} from '../monthlyIncomePlanUtils';

describe('monthlyIncomePlanUtils', () => {
  it('creates canonical local months', () => {
    expect(canonicalMonth(new Date(2026, 7, 23))).toBe('2026-08-01');
  });
  it('returns unique current and next months', () => {
    expect(eligibleIncomePlanMonths([], new Date(2026, 7, 23))).toEqual(['2026-08-01', '2026-09-01']);
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
  it('includes represented historical months in canonical order', () => {
    const plans = [
      {id: '2', owner: 'user' as const, ownerId: '1', yearMonth: '2026-06-01', amount: 20},
      {id: '1', owner: 'user' as const, ownerId: '1', yearMonth: '2026-07-01', amount: 10},
    ];
    expect(eligibleIncomePlanMonths(plans, new Date(2026, 7, 23))).toEqual([
      '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01',
    ]);
  });
  it('finds only the explicit preceding month for prefill', () => {
    const plans = [
      {id: '1', owner: 'user' as const, ownerId: '1', yearMonth: '2026-07-01', amount: 10},
    ];
    expect(previousMonthPlan(plans, '2026-08-01')).toEqual(plans[0]);
    expect(previousMonthPlan(plans, '2026-09-01')).toBeUndefined();
  });
});
