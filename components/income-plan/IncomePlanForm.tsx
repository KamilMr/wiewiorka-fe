import {useState} from 'react';
import {Alert, SafeAreaView, View} from 'react-native';
import {router} from 'expo-router';
import {TextInput as PaperTextInput} from 'react-native-paper';

import {ButtonWithStatus as Button, Text, TextInput} from '@/components';
import {sizes} from '@/constants/theme';
import {MonthlyIncomePlan} from '@/types';
import {useAppDispatch} from '@/hooks';
import {setSnackbar} from '@/redux/main/mainSlice';
import {createIncomePlan, deleteIncomePlan, updateIncomePlan} from '@/redux/main/thunks';
import {incomePlanPayload, previousMonthPlan} from '@/utils/monthlyIncomePlanUtils';

type Props = {
  yearMonth: string;
  plan?: MonthlyIncomePlan;
  previousPlan?: MonthlyIncomePlan[];
};

export default function IncomePlanForm({yearMonth, plan, previousPlan: plans = []}: Props) {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState(plan ? String(plan.amount) : '');
  const previous = previousMonthPlan(plans, yearMonth);

  const save = async () => {
    const payload = incomePlanPayload(yearMonth, amount);
    if (!payload) {
      dispatch(setSnackbar({type: 'error', msg: 'Podaj kwotę większą od zera'}));
      return;
    }
    try {
      if (plan) await dispatch(updateIncomePlan({id: plan.id, amount: payload.amount})).unwrap();
      else await dispatch(createIncomePlan(payload)).unwrap();
      dispatch(setSnackbar({type: 'success', msg: 'Plan został zapisany'}));
      router.back();
    } catch (error: any) {
      const duplicate = error?.message === 'income_plan_exists_for_month';
      dispatch(setSnackbar({
        type: 'error',
        msg: duplicate ? 'Plan dla tego miesiąca już istnieje' : 'Nie udało się zapisać planu',
      }));
    }
  };

  const remove = () => Alert.alert(
    'Usuń plan',
    'Czy na pewno chcesz usunąć ten plan dochodu?',
    [
      {text: 'Anuluj', style: 'cancel'},
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          if (!plan) return;
          await dispatch(deleteIncomePlan({id: plan.id})).unwrap();
          dispatch(setSnackbar({type: 'success', msg: 'Plan został usunięty'}));
          router.back();
        },
      },
    ],
  );

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={{padding: sizes.xl, gap: sizes.lg}}>
        <Text variant="titleLarge">Plan na {yearMonth.slice(0, 7)}</Text>
        <TextInput
          label="Planowana kwota netto"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          right={<PaperTextInput.Affix text="zł" />}
        />
        {!plan && previous && (
          <Button mode="outlined" onPress={() => setAmount(String(previous.amount))}>
            Użyj kwoty z poprzedniego miesiąca ({Number(previous.amount).toFixed(2)} zł)
          </Button>
        )}
        <Button mode="contained" onPress={save}>Zapisz plan</Button>
        {plan && <Button mode="outlined" onPress={remove}>Usuń plan</Button>}
      </View>
    </SafeAreaView>
  );
}
