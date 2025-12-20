import {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Card, Caption, FAB, Portal, Dialog, Button} from 'react-native-paper';
import {router} from 'expo-router';

import {Text, TextInput} from '@/components';
import {sizes, useAppTheme} from '@/constants/theme';
import {useAppDispatch, useAppSelector} from '@/hooks';
import {selectDebtsWithSummary} from '@/redux/main/selectors';
import {fetchDebts, addDebtThunk} from '@/redux/main/thunks';
import {setSnackbar} from '@/redux/main/mainSlice';
import {formatGrosze, parseZlotyToGrosze} from '@/utils/currencyUtils';

export default function DebtListScreen() {
  const dispatch = useAppDispatch();
  const t = useAppTheme();
  const debts = useAppSelector(selectDebtsWithSummary);

  const [addDebtVisible, setAddDebtVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDebt, setNewDebt] = useState({
    personName: '',
    totalAmount: '',
    description: '',
  });

  useEffect(() => {
    dispatch(fetchDebts());
  }, [dispatch]);

  const handleAddDebt = async () => {
    if (!newDebt.personName.trim()) {
      dispatch(setSnackbar({msg: 'Podaj imię osoby', type: 'error'}));
      return;
    }

    const amountInGrosze = parseZlotyToGrosze(newDebt.totalAmount);
    if (amountInGrosze <= 0) {
      dispatch(setSnackbar({msg: 'Podaj poprawną kwotę', type: 'error'}));
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        addDebtThunk({
          personName: newDebt.personName.trim(),
          totalAmount: amountInGrosze,
          description: newDebt.description.trim() || undefined,
        }),
      ).unwrap();

      setNewDebt({personName: '', totalAmount: '', description: ''});
      setAddDebtVisible(false);
    } catch (error) {
      dispatch(setSnackbar({msg: String(error), type: 'error'}));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewDebt({personName: '', totalAmount: '', description: ''});
    setAddDebtVisible(false);
  };

  return (
    <View style={[styles.container, {backgroundColor: t.colors.background}]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {debts.length === 0 ? (
          <Text style={styles.emptyText}>Brak długów</Text>
        ) : (
          debts.map(debt => (
            <Card
              key={debt.id}
              style={styles.debtCard}
              onPress={() => router.push(`/debt/${debt.id}`)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text style={styles.personName}>{debt.personName}</Text>
                  {debt.isPaid && (
                    <View style={[styles.paidBadge, {backgroundColor: t.colors.primary}]}>
                      <Text style={styles.paidBadgeText}>Spłacony</Text>
                    </View>
                  )}
                </View>
                {debt.description && <Caption>{debt.description}</Caption>}
                <View style={styles.amountsRow}>
                  <Caption>Kwota: {formatGrosze(debt.totalAmount)}</Caption>
                  <Caption>Spłacono: {formatGrosze(debt.paidAmount)}</Caption>
                </View>
                <Caption style={{color: debt.isPaid ? t.colors.primary : t.colors.error}}>
                  Pozostało: {formatGrosze(debt.remainingAmount)}
                </Caption>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Dodaj dług"
        style={[styles.fab, {backgroundColor: t.colors.primary}]}
        color="white"
        onPress={() => setAddDebtVisible(true)}
      />

      <Portal>
        <Dialog visible={addDebtVisible} onDismiss={handleCancel} style={styles.dialog}>
          <Dialog.Title>Nowy dług</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Imię osoby *"
              mode="outlined"
              value={newDebt.personName}
              onChangeText={text => setNewDebt(prev => ({...prev, personName: text}))}
              autoFocus
            />
            <TextInput
              label="Kwota (zł) *"
              mode="outlined"
              value={newDebt.totalAmount}
              onChangeText={text => setNewDebt(prev => ({...prev, totalAmount: text}))}
              keyboardType="numeric"
              style={{marginTop: sizes.md}}
            />
            <TextInput
              label="Opis (opcjonalnie)"
              mode="outlined"
              value={newDebt.description}
              onChangeText={text => setNewDebt(prev => ({...prev, description: text}))}
              style={{marginTop: sizes.md}}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancel}>Anuluj</Button>
            <Button onPress={handleAddDebt} loading={loading} disabled={loading}>
              Dodaj
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: sizes.md,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: sizes.xl,
    color: '#666',
  },
  debtCard: {
    marginVertical: sizes.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizes.xs,
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
  },
  paidBadge: {
    paddingHorizontal: sizes.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: sizes.xs,
  },
  fab: {
    position: 'absolute',
    margin: sizes.xl,
    right: 0,
    bottom: 0,
  },
  dialog: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '90%',
  },
});
