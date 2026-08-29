import {subMonths} from 'date-fns';
import {useLocalSearchParams} from 'expo-router';

import BudgetForm from '@/components/budget/BudgetForm';
import {formatToDashDate} from '@/common';
import {useAppSelector} from '@/hooks';
import {selectBudgets} from '@/redux/main/selectors';
import {BudgetCardItem} from '@/utils/types';

const CreateBudget = () => {
  const {date: budgetDate}: {date: string} = useLocalSearchParams();
  const budgets: BudgetCardItem[] = useAppSelector(
    selectBudgets(formatToDashDate(subMonths(new Date(budgetDate), 1))),
  );

  return <BudgetForm mode="create" budgetDate={budgetDate} budgets={budgets} />;
};

export default CreateBudget;
