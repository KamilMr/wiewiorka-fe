import type {MonthlyIncomePlanComparison} from '@/types';

interface AggregatedData {
  [key: string]: {
    [key: string]: number[];
  };
}

type BudgetCardItem = {
  id: string;
  budgetedName: string;
  amount: number;
  allocated: number;
  yearMonth: string;
};

type BudgetCardProps = {
  items: BudgetCardItem[];
  date: string;
  incomePlanComparison: MonthlyIncomePlanComparison;
};

interface BudgetMainSlice {
  id: string;
  categoryId: number | null;
  groupId: number | null;
  amount: number;
  yearMonth: string;
}

export {BudgetCardProps, BudgetCardItem, AggregatedData, BudgetMainSlice};
