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
          accessibilityRole="button"
          accessibilityLabel={`Wpłynęło ${formatPrice(
            income - sumCosts < 0 ? 0 : income - sumCosts,
          )}`}
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
            <Text
              style={[styles.amount, styles.incomeAmount]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {formatPrice(income - sumCosts < 0 ? 0 : income - sumCosts)}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Wydano ${formatPrice(outcome - sumCosts)}`}
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
            <Text
              style={[styles.amount, styles.expenseAmount]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
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
    minHeight: 56,
    position: 'relative',
    justifyContent: 'center',
    borderRadius: warmRadius.lg,
    padding: 12,
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
    position: 'absolute',
    top: -10,
    right: -4,
    zIndex: 1,
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
    minWidth: 0,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  incomeAmount: {
    color: warmColors.success,
  },
  expenseAmount: {
    color: warmColors.danger,
  },
});

export default SummaryCard;
