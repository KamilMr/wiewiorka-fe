import {useState} from 'react';
import {View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import {Card, FAB, Portal, Dialog, Button, Caption, Divider, Surface} from 'react-native-paper';
import {format} from 'date-fns';

import {Text, TextInput, DatePicker, SwipeToDelete} from '@/components';
import {sizes, useAppTheme} from '@/constants/theme';
import {useAppDispatch, useAppSelector} from '@/hooks';
import {selectDebtById} from '@/redux/main/selectors';
import {addDebtPaymentThunk, deleteDebtPaymentThunk, updateDebtPaymentThunk} from '@/redux/main/thunks';
import {DebtPayment} from '@/types';
import {setSnackbar} from '@/redux/main/mainSlice';
import {formatGrosze, parseZlotyToGrosze} from '@/utils/currencyUtils';

export default function DebtDetailsScreen() {
  const dispatch = useAppDispatch();
  const t = useAppTheme();
  const {id} = useLocalSearchParams<{id: string}>();

  const debt = useAppSelector(selectDebtById(id));

  const [addPaymentVisible, setAddPaymentVisible] = useState(false);
  const [editPaymentVisible, setEditPaymentVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<DebtPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: new Date(),
    note: '',
  });
  const [editPayment, setEditPayment] = useState({
    amount: '',
    date: new Date(),
    note: '',
  });

  if (!debt) {
    return (
      <View style={styles.container}>
        <Surface style={styles.emptyContainer} elevation={0}>
          <Text>Dług nie znaleziony</Text>
        </Surface>
      </View>
    );
  }

  const paidAmount = debt.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = debt.totalAmount - paidAmount;
  const isPaid = remainingAmount <= 0;

  const handleAddPayment = async () => {
    const amountInGrosze = parseZlotyToGrosze(newPayment.amount);
    if (amountInGrosze <= 0) {
      dispatch(setSnackbar({msg: 'Podaj poprawną kwotę', type: 'error'}));
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        addDebtPaymentThunk({
          debtId: id,
          amount: amountInGrosze,
          date: format(newPayment.date, 'yyyy-MM-dd'),
          note: newPayment.note.trim() || undefined,
        }),
      ).unwrap();

      setNewPayment({amount: '', date: new Date(), note: ''});
      setAddPaymentVisible(false);
    } catch (error) {
      dispatch(setSnackbar({msg: String(error), type: 'error'}));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPayment = () => {
    setNewPayment({amount: '', date: new Date(), note: ''});
    setAddPaymentVisible(false);
  };

  const handleOpenEditPayment = (payment: DebtPayment) => {
    setEditingPayment(payment);
    setEditPayment({
      amount: (payment.amount / 100).toString(),
      date: new Date(payment.date),
      note: payment.note || '',
    });
    setEditPaymentVisible(true);
  };

  const handleCancelEditPayment = () => {
    setEditingPayment(null);
    setEditPayment({amount: '', date: new Date(), note: ''});
    setEditPaymentVisible(false);
  };

  const handleSaveEditPayment = async () => {
    if (!editingPayment) return;

    const amountInGrosze = parseZlotyToGrosze(editPayment.amount);
    if (amountInGrosze <= 0) {
      dispatch(setSnackbar({msg: 'Podaj poprawną kwotę', type: 'error'}));
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        updateDebtPaymentThunk({
          debtId: id,
          paymentId: editingPayment.id,
          amount: amountInGrosze,
          date: format(editPayment.date, 'yyyy-MM-dd'),
          note: editPayment.note.trim() || undefined,
        }),
      ).unwrap();

      handleCancelEditPayment();
    } catch (error) {
      dispatch(setSnackbar({msg: String(error), type: 'error'}));
    } finally {
      setLoading(false);
    }
  };

  const sortedPayments = [...debt.payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: 'white'}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.headerCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.personName}>{debt.personName}</Text>
                {isPaid && (
                  <View style={[styles.paidBadge, {backgroundColor: t.colors.primary}]}>
                    <Text style={styles.paidBadgeText}>Spłacony</Text>
                  </View>
                )}
              </View>
              {debt.description && <Caption style={styles.description}>{debt.description}</Caption>}
              <Divider style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text>Całkowita kwota:</Text>
                <Text style={styles.amount}>{formatGrosze(debt.totalAmount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Spłacono:</Text>
                <Text style={[styles.amount, {color: t.colors.primary}]}>{formatGrosze(paidAmount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Pozostało:</Text>
                <Text style={[styles.amount, {color: isPaid ? t.colors.primary : t.colors.error}]}>
                  {formatGrosze(remainingAmount)}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Text style={styles.sectionTitle}>Historia wpłat</Text>

          {!sortedPayments.length ? (
            <Caption style={styles.noPayments}>Brak wpłat</Caption>
          ) : (
            sortedPayments.map(payment => (
              <SwipeToDelete
                key={payment.id}
                onDelete={() => dispatch(deleteDebtPaymentThunk({debtId: id, paymentId: payment.id}))}
              >
                <Card style={styles.paymentCard} onPress={() => handleOpenEditPayment(payment)}>
                  <Card.Content>
                    <View style={styles.paymentRow}>
                      <Text>{format(new Date(payment.date), 'dd/MM/yyyy')}</Text>
                      <Text style={styles.paymentAmount}>{formatGrosze(payment.amount)}</Text>
                    </View>
                    {payment.note && <Caption>{payment.note}</Caption>}
                  </Card.Content>
                </Card>
              </SwipeToDelete>
            ))
          )}
        </ScrollView>

        <FAB
          icon="plus"
          label="Dodaj wpłatę"
          color="white"
          style={[styles.fab, {backgroundColor: t.colors.primary}]}
          onPress={() => setAddPaymentVisible(true)}
        />

        <Portal>
          <Dialog visible={addPaymentVisible} onDismiss={handleCancelPayment} style={styles.dialog}>
            <Dialog.Title>Nowa wpłata</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Kwota (zł) *"
                mode="outlined"
                value={newPayment.amount}
                onChangeText={text => setNewPayment(prev => ({...prev, amount: text}))}
                keyboardType="numeric"
                autoFocus
              />
              <View style={{marginTop: sizes.lg, minHeight: 80}}>
                <DatePicker
                  value={newPayment.date}
                  onChange={date => setNewPayment(prev => ({...prev, date: date || new Date()}))}
                  label="Data"
                />
              </View>
              <TextInput
                label="Notatka (opcjonalnie)"
                mode="outlined"
                value={newPayment.note}
                onChangeText={text => setNewPayment(prev => ({...prev, note: text}))}
                style={{marginTop: sizes.md}}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleCancelPayment}>Anuluj</Button>
              <Button onPress={handleAddPayment} loading={loading} disabled={loading}>
                Dodaj
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={editPaymentVisible} onDismiss={handleCancelEditPayment} style={styles.dialog}>
            <Dialog.Title>Edytuj wpłatę</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Kwota (zł) *"
                mode="outlined"
                value={editPayment.amount}
                onChangeText={text => setEditPayment(prev => ({...prev, amount: text}))}
                keyboardType="numeric"
              />
              <View style={{marginTop: sizes.lg, minHeight: 80, backgroundColor: 'white'}}>
                <DatePicker
                  value={editPayment.date}
                  onChange={date => setEditPayment(prev => ({...prev, date: date || new Date()}))}
                  label="Data"
                />
              </View>
              <TextInput
                label="Notatka (opcjonalnie)"
                mode="outlined"
                value={editPayment.note}
                onChangeText={text => setEditPayment(prev => ({...prev, note: text}))}
                style={{marginTop: sizes.md}}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleCancelEditPayment}>Anuluj</Button>
              <Button onPress={handleSaveEditPayment} loading={loading} disabled={loading}>
                Zapisz
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </KeyboardAvoidingView>
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
  headerCard: {
    marginBottom: sizes.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizes.xs,
  },
  personName: {
    fontSize: 22,
    fontWeight: 'bold',
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
  description: {
    marginBottom: sizes.lg,
  },
  divider: {
    marginVertical: sizes.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: sizes.sm,
  },
  amount: {
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: sizes.lg,
    marginBottom: sizes.md,
  },
  noPayments: {
    textAlign: 'center',
    marginTop: sizes.lg,
  },
  paymentCard: {
    marginVertical: sizes.md,
    minHeight: 60,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentAmount: {
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
