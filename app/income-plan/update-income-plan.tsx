import {Redirect, Stack, useLocalSearchParams} from 'expo-router';

import IncomePlanForm from '@/components/income-plan/IncomePlanForm';
import {useAppSelector} from '@/hooks';

export default function UpdateIncomePlanScreen() {
  const {id} = useLocalSearchParams<{id?: string}>();
  const plan = useAppSelector(state => state.main.incomePlans.find(item => item.id === id));

  if (!plan) return <Redirect href="/income-plan" />;

  return (
    <>
      <Stack.Screen options={{title: 'Edytuj plan dochodu'}} />
      <IncomePlanForm yearMonth={plan.yearMonth} plan={plan} />
    </>
  );
}
