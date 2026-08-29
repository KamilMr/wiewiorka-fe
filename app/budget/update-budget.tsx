import {useLocalSearchParams} from 'expo-router';

import BudgetForm from '@/components/budget/BudgetForm';
import {formatToDashDate} from '@/common';
import {useAppSelector} from '@/hooks';
import {selectBudgets} from '@/redux/main/selectors';
import {BudgetCardItem} from '@/utils/types';

const UpdateBudget = () => {
  const {date: budgetDate}: {date: string} = useLocalSearchParams();
  const budgets: BudgetCardItem[] = useAppSelector(
    selectBudgets(formatToDashDate(new Date(budgetDate))),
  );

  return <BudgetForm mode="update" budgetDate={budgetDate} budgets={budgets} />;
};

export default UpdateBudget;
