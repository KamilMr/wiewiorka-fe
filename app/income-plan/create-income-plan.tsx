import {Redirect, Stack, useLocalSearchParams} from 'expo-router';

import IncomePlanForm from '@/components/income-plan/IncomePlanForm';
import {eligibleIncomePlanMonths} from '@/utils/monthlyIncomePlanUtils';

export default function CreateIncomePlanScreen() {
  const {month} = useLocalSearchParams<{month?: string}>();
  if (!month || !eligibleIncomePlanMonths().includes(month)) {
    return <Redirect href="/income-plan" />;
  }
  return (
    <>
      <Stack.Screen options={{title: 'Nowy plan dochodu'}} />
      <IncomePlanForm yearMonth={month} />
    </>
  );
}
