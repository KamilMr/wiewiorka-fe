import * as React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {router} from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import _ from 'lodash';

import {formatPrice} from '@/common';
import Text from '@/components/CustomText';
import WarmCard from '@/components/warm/WarmCard';
import {warmColors, warmRadius} from '@/constants/warmTheme';

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
}

const SummaryCard = (props: Omit<SummaryCardProps, 'id'>) => {
  const {income, outcome, date, costs} = props;
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
  expenseAmount: {
    color: warmColors.danger,
  },
});

export default SummaryCard;
