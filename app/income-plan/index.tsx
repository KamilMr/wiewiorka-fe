import {router, Stack} from 'expo-router';
import {ScrollView, View} from 'react-native';

import {Button, Text} from '@/components';
import {sizes} from '@/constants/theme';
import {useAppSelector} from '@/hooks';
import {eligibleIncomePlanMonths} from '@/utils/monthlyIncomePlanUtils';

const monthLabel = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('pl-PL', {month: 'long', year: 'numeric'})
    .format(new Date(year, monthNumber - 1, 1));
};

export default function IncomePlanScreen() {
  const plans = useAppSelector(state => state.main.incomePlans);

  return (
    <ScrollView contentContainerStyle={{padding: sizes.xl, gap: sizes.lg}}>
      <Stack.Screen options={{title: 'Planowane przychody'}} />
      <Text variant="headlineSmall">Plan dochodu netto</Text>
      <Text>Ustal kwotę, którą planujesz otrzymać w wybranym miesiącu.</Text>
      {eligibleIncomePlanMonths(plans).map(month => {
        const plan = plans.find(item => item.yearMonth === month);
        return (
          <View key={month} style={{gap: sizes.sm}}>
            <Text variant="titleMedium">{monthLabel(month)}</Text>
            {plan ? (
              <>
                <Text>{Number(plan.amount).toFixed(2)} zł</Text>
                <Button
                  mode="outlined"
                  onPress={() => router.push({
                    pathname: '/income-plan/update-income-plan',
                    params: {id: plan.id},
                  })}
                >
                  Edytuj plan
                </Button>
              </>
            ) : (
              <Button
                mode="contained"
                onPress={() => router.push({pathname: '/income-plan/create-income-plan', params: {month}})}
              >
                Dodaj plan
              </Button>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
