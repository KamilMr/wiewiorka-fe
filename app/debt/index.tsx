import {useEffect} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Card, Caption} from 'react-native-paper';
import {router} from 'expo-router';

import {Text} from '@/components';
import {sizes, useAppTheme} from '@/constants/theme';
import {useAppDispatch, useAppSelector} from '@/hooks';
import {selectDebtsWithSummary} from '@/redux/main/selectors';
import {fetchDebts} from '@/redux/main/thunks';
import {formatGrosze} from '@/utils/currencyUtils';

export default function DebtListScreen() {
  const dispatch = useAppDispatch();
  const t = useAppTheme();
  const debts = useAppSelector(selectDebtsWithSummary);

  useEffect(() => {
    dispatch(fetchDebts());
  }, [dispatch]);

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: sizes.md,
  },
  scrollContent: {
    paddingBottom: 20,
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
});
