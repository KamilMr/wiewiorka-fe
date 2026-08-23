import {useState} from 'react';
import {SafeAreaView, View} from 'react-native';
import {router} from 'expo-router';
import {TextInput as PaperTextInput} from 'react-native-paper';

import {ButtonWithStatus as Button, Text, TextInput} from '@/components';
import {sizes} from '@/constants/theme';
import {useAppDispatch} from '@/hooks';
import {setSnackbar} from '@/redux/main/mainSlice';
import {createIncomePlan} from '@/redux/main/thunks';
import {incomePlanPayload} from '@/utils/monthlyIncomePlanUtils';

export default function IncomePlanForm({yearMonth}: {yearMonth: string}) {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState('');

  const save = async () => {
    const payload = incomePlanPayload(yearMonth, amount);
    if (!payload) {
      dispatch(setSnackbar({type: 'error', msg: 'Podaj kwotę większą od zera'}));
      return;
    }
    try {
      await dispatch(createIncomePlan(payload)).unwrap();
      router.back();
    } catch (error: any) {
      const duplicate = error?.message === 'income_plan_exists_for_month';
      dispatch(setSnackbar({
        type: 'error',
        msg: duplicate ? 'Plan dla tego miesiąca już istnieje' : 'Nie udało się zapisać planu',
      }));
    }
  };

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
        <Button mode="contained" onPress={save}>Zapisz plan</Button>
      </View>
    </SafeAreaView>
  );
}
