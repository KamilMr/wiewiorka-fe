import * as React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {router} from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import _ from 'lodash';

import {formatPrice} from '@/common';
import Text from '@/components/CustomText';
import WarmCard from '@/components/warm/WarmCard';
import {warmColors, warmRadius} from '@/constants/warmTheme';
import {MonthlyIncomePlanComparison} from '@/types';

type Costs = {
  [key: string]: number;
};

export interface SummaryCardProps {
  id: string;
  income: number;
  outcome: number;
  date: string;
  costs: Costs;
  icon?: string;
  incomePlanComparison?: MonthlyIncomePlanComparison;
}

const SummaryCard = (props: Omit<SummaryCardProps, 'id'>) => {
  const {income, outcome, date, costs, incomePlanComparison} = props;
  // the amount of costs total
  const sumCosts = _.sumBy(_.values(costs));

  const handleNavigate = (date: string) => () =>
    router.navigate({pathname: '/summary/chart-details', params: {date}});

  return (
    <WarmCard>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.balanceLabel}>Saldo</Text>
        </View>
        <Text style={styles.balance}>{formatPrice(income - outcome)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.amountRow}>
        <Pressable
          onPress={() =>
            router.navigate({
              pathname: '/income-summary',
              params: {date: date.split('/').reverse().join('-') + '-01'},
            })
          }
          style={({pressed}) => [
            styles.amountButton,
            styles.incomeButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.icon, styles.incomeIcon]}>
            <FontAwesome6
              name="arrow-down"
              size={14}
              color={warmColors.success}
              iconStyle="solid"
            />
          </View>
          <View style={styles.amountContent}>
            <Text style={styles.amountLabel}>Wpłynęło</Text>
            <Text style={[styles.amount, styles.incomeAmount]}>
              {formatPrice(income - sumCosts < 0 ? 0 : income - sumCosts)}
            </Text>
            {incomePlanComparison?.plan && (
              <View style={styles.planDetails}>
                <Text style={styles.planAmount}>
                  {formatPrice(incomePlanComparison.actualNet)} z{' '}
                  {formatPrice(incomePlanComparison.plan.amount)}
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {width: `${Math.min(Math.max(incomePlanComparison.progress ?? 0, 0), 100)}%`},
                    ]}
                  />
                </View>
                <Text style={styles.planStatus}>
                  {(incomePlanComparison.surplus ?? 0) > 0
                    ? `Nadwyżka ${formatPrice(incomePlanComparison.surplus ?? 0)}`
                    : (incomePlanComparison.remaining ?? 0) > 0
                      ? `Pozostało ${formatPrice(incomePlanComparison.remaining ?? 0)}`
                      : 'Plan osiągnięty'}
                  {' · '}{Math.round(incomePlanComparison.progress ?? 0)}%
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        <Pressable
          onPress={handleNavigate(date.split('/').reverse().join('-') + '-01')}
          style={({pressed}) => [
            styles.amountButton,
            styles.expenseButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.icon, styles.expenseIcon]}>
            <FontAwesome6
              name="arrow-up"
              size={14}
              color={warmColors.danger}
              iconStyle="solid"
            />
          </View>
          <View style={styles.amountContent}>
            <Text style={styles.amountLabel}>Wydano</Text>
            <Text style={[styles.amount, styles.expenseAmount]}>
              {formatPrice(outcome - sumCosts)}
            </Text>
          </View>
        </Pressable>
      </View>
    </WarmCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  date: {
    color: warmColors.foreground,
    fontSize: 17,
    fontWeight: '700',
  },
  balanceLabel: {
    color: warmColors.mutedForeground,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  balance: {
    color: warmColors.foreground,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: warmColors.cardBorder,
    marginVertical: 16,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 10,
  },
  amountButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: warmRadius.lg,
    padding: 12,
    gap: 8,
  },
  incomeButton: {
    backgroundColor: warmColors.successBackground,
  },
  expenseButton: {
    backgroundColor: warmColors.dangerBackground,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeIcon: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
  },
  expenseIcon: {
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
  },
  amountContent: {
    flex: 1,
    minWidth: 0,
  },
  amountLabel: {
    color: warmColors.mutedForeground,
    fontSize: 11,
    marginBottom: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  incomeAmount: {
    color: warmColors.success,
  },
  planDetails: {
    gap: 4,
    marginTop: 6,
  },
  planAmount: {
    color: warmColors.foreground,
    fontSize: 10,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    overflow: 'hidden',
    borderRadius: warmRadius.pill,
    backgroundColor: 'rgba(5, 150, 105, 0.16)',
  },
  progressFill: {
    height: '100%',
    borderRadius: warmRadius.pill,
    backgroundColor: warmColors.success,
  },
  planStatus: {
    color: warmColors.mutedForeground,
    fontSize: 9,
    lineHeight: 12,
  },
  expenseAmount: {
    color: warmColors.danger,
  },
});

export default SummaryCard;
