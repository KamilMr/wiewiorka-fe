import {selectIncomePlanComparison} from '../selectors';

jest.mock('@reduxjs/toolkit', () => ({
  createSelector:
    (inputs: Array<(...args: any[]) => any>, projector: (...args: any[]) => any) =>
    (...args: any[]) =>
      projector(...inputs.map(input => input(...args))),
}));

const plan = {
  id: 'ip-1',
  owner: 'user' as const,
  ownerId: '1',
  yearMonth: '2026-08-01',
  amount: 1000,
};

const income = (date: string, price: number, vat = 0) => ({
  id: Math.random(),
  date,
  price,
  vat,
  source: '',
  ownerId: 1,
  houseId: '',
  description: '',
  owner: 'user',
});

const state = (incomePlans = [plan], incomes: ReturnType<typeof income>[] = []) =>
  ({main: {incomePlans, incomes}} as any);

describe('selectIncomePlanComparison', () => {
  it('returns null plan metrics when no plan exists', () => {
    expect(selectIncomePlanComparison(state([], [income('2026-08-10', 200)]), plan.yearMonth)).toEqual({
      plan: null,
      actualNet: 200,
      remaining: null,
      surplus: null,
      progress: null,
    });
  });

  it.each([
    [[], 0, 1000, 0, 0],
    [[income('2026-08-10', 400)], 400, 600, 0, 40],
    [[income('2026-08-10', 1000)], 1000, 0, 0, 100],
    [[income('2026-08-10', 1250)], 1250, 0, 250, 125],
  ])('compares actual income with the plan', (incomes, actualNet, remaining, surplus, progress) => {
    expect(selectIncomePlanComparison(state([plan], incomes as ReturnType<typeof income>[]), plan.yearMonth)).toEqual({
      plan,
      actualNet,
      remaining,
      surplus,
      progress,
    });
  });

  it('uses net VAT-adjusted income and isolates the requested month', () => {
    const result = selectIncomePlanComparison(state([plan], [
      income('2026-08-31T23:30:00.000Z', 1230, 23),
      income('2026-09-01', 500),
    ]), plan.yearMonth);
    expect(result.actualNet).toBeCloseTo(947.1);
    expect(result.progress).toBeCloseTo(94.71);
  });

  it('isolates months across a year boundary', () => {
    const januaryPlan = {...plan, yearMonth: '2027-01-01'};
    const result = selectIncomePlanComparison(state([januaryPlan], [
      income('2026-12-31', 900),
      income('2027-01-01', 300),
    ]), januaryPlan.yearMonth);
    expect(result.actualNet).toBe(300);
    expect(result.remaining).toBe(700);
  });
});
