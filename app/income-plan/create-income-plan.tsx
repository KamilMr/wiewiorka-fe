import {Redirect, Stack, useLocalSearchParams} from 'expo-router';

import IncomePlanForm from '@/components/income-plan/IncomePlanForm';
import {useAppSelector} from '@/hooks';
import {eligibleIncomePlanMonths} from '@/utils/monthlyIncomePlanUtils';

export default function CreateIncomePlanScreen() {
  const {month} = useLocalSearchParams<{month?: string}>();
  const plans = useAppSelector(state => state.main.incomePlans);
  if (!month || !eligibleIncomePlanMonths(plans).includes(month)) {
    return <Redirect href="/income-plan" />;
  }
  return (
    <>
      <Stack.Screen options={{title: 'Nowy plan dochodu'}} />
      <IncomePlanForm yearMonth={month} previousPlan={plans} />
    </>
  );
}
