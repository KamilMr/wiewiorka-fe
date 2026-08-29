import {StyleSheet, View} from 'react-native';
import {format, isSameMonth, isSameYear} from 'date-fns';
import {pl} from 'date-fns/locale';

import {formatPrice} from '@/common';
import Text from '@/components/CustomText';
import {warmColors} from '@/constants/warmTheme';

export type TotalSpentSummaryProps = {
  amount: number;
  categoryCount: number;
  categoryType: 'category' | 'subcategory';
  dateRange: [Date, Date];
};

const formatCountLabel = (
  count: number,
  categoryType: TotalSpentSummaryProps['categoryType'],
) => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  const usesFewForm =
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14);

  if (categoryType === 'subcategory') {
    if (count === 1) return '1 podkategoria';
    return `${count} ${usesFewForm ? 'podkategorie' : 'podkategorii'}`;
  }

  if (count === 1) return '1 kategoria';
  return `${count} ${usesFewForm ? 'kategorie' : 'kategorii'}`;
};

const formatPeriodLabel = ([start, end]: [Date, Date]) => {
  if (isSameMonth(start, end)) {
    return format(start, 'LLLL yyyy', {locale: pl});
  }

  if (isSameYear(start, end)) {
    return `${format(start, 'LLL', {locale: pl})}–${format(end, 'LLL yyyy', {
      locale: pl,
    })}`;
  }

  return `${format(start, 'LLL yyyy', {locale: pl})}–${format(end, 'LLL yyyy', {
    locale: pl,
  })}`;
};

const TotalSpentSummary = ({
  amount,
  categoryCount,
  categoryType,
  dateRange,
}: TotalSpentSummaryProps) => (
  <View style={styles.container}>
    <View>
      <Text style={styles.label}>Wydano</Text>
      <Text style={styles.amount}>{formatPrice(amount)}</Text>
    </View>
    <Text style={styles.meta}>
      {formatCountLabel(categoryCount, categoryType)} ·{' '}
      {formatPeriodLabel(dateRange)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  label: {
    color: warmColors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  amount: {
    color: warmColors.foreground,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  meta: {
    flexShrink: 1,
    color: warmColors.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 2,
    marginLeft: 16,
    textAlign: 'right',
  },
});

export default TotalSpentSummary;
