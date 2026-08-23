import {MonthlyIncomePlan} from '@/types';

export const canonicalMonth = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  return `${year}-${month}-01`;
};

export const nextCanonicalMonth = (month: string): string => {
  const [year, monthNumber] = month.split('-').map(Number);
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const nextYear = monthNumber === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
};

export const previousCanonicalMonth = (month: string): string => {
  const [year, monthNumber] = month.split('-').map(Number);
  const previousMonth = monthNumber === 1 ? 12 : monthNumber - 1;
  const previousYear = monthNumber === 1 ? year - 1 : year;
  return `${previousYear}-${String(previousMonth).padStart(2, '0')}-01`;
};

export const eligibleIncomePlanMonths = (
  plans: MonthlyIncomePlan[] = [],
  now = new Date(),
): string[] => {
  const current = canonicalMonth(now);
  return Array.from(new Set([
    current,
    nextCanonicalMonth(current),
    ...plans.map(plan => plan.yearMonth),
  ])).sort();
};

export const incomePlanPayload = (yearMonth: string, amount: string | number) => {
  const parsedAmount = typeof amount === 'number' ? amount : Number(amount.replace(',', '.'));
  if (!/^\d{4}-(0[1-9]|1[0-2])-01$/.test(yearMonth) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return null;
  }
  return {yearMonth, amount: parsedAmount};
};

export const previousMonthPlan = (plans: MonthlyIncomePlan[], month: string) =>
  plans.find(plan => plan.yearMonth === previousCanonicalMonth(month));
