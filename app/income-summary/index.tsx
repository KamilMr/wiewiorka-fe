import {useSelector} from 'react-redux';
import {useLocalSearchParams} from 'expo-router';

import {Tooltip, IconButton} from 'react-native-paper';
import {View, StyleSheet, FlatList} from 'react-native';

import {PieChartBar, Text} from '@/components';
import {generateColor, formatPrice} from '@/common';
import {selectIncomes} from '@/redux/main/selectors';
import {selectMe} from '@/redux/auth/authSlice';
import {useAppTheme} from '@/constants/theme';
import {warmColors} from '@/constants/warmTheme';

interface Income {
  date: string;
  owner: string;
  source: string;
  price: number;
}

interface IncomeData {
  value: number;
  label: string;
  color: string;
  owner: string;
}

const getYearMonth = (date: string, pattern: 'yyyy' | 'yyyy-MM') => {
  const [year, month] = date.split('-');
  return pattern === 'yyyy' ? year : `${year}-${month}`;
};

const IncomeSummary = () => {
  const t = useAppTheme();
  const {date}: {date: string} = useLocalSearchParams();
  const isYear = date.split('-').length === 2;
  const income = useSelector(selectIncomes);
  const currentUser = useSelector(selectMe);
  const filteredIncome = income.filter((income: Income) =>
    isYear
      ? getYearMonth(income.date, 'yyyy') === getYearMonth(date, 'yyyy')
      : getYearMonth(income.date, 'yyyy-MM') === getYearMonth(date, 'yyyy-MM'),
  );

  const incomeOwners: string[] = filteredIncome.map(
    (income: Income) => income.owner,
  );
  const uniqueIncomeOwners: string[] = [...new Set(incomeOwners)];

  const tR: Record<string, Record<string, number>> = {};

  uniqueIncomeOwners.forEach((owner: string) => {
    tR[owner] = {};
    filteredIncome.forEach((income: Income) => {
      if (income.owner === owner) {
        tR[owner][income.source] ??= 0;
        tR[owner][income.source] += income.price;
      }
    });
  });

  const incomeData: IncomeData[] = Object.entries(tR)
    .map(([owner, income]) => {
      return Object.entries(income).map(([source, price]) => ({
        value: price,
        label: source,
        owner: owner,
        color: generateColor(source + owner),
      }));
    })
    .flat();

  const isCurrentUser = (owner: string) => owner === currentUser.name;

  return (
    <View style={[styles.container, {backgroundColor: t.colors.background}]}>
      <View style={styles.chartSection}>
        <View style={styles.chartContainer}>
          <View style={styles.pieChartContainer}>
            <PieChartBar
              data={incomeData}
              showText
              textColor={t.colors.onBackground}
              textSize={12}
              radius={70}
            />
          </View>
          <View style={styles.legendContainer}>
            {incomeData
              .sort((a, b) => b.value - a.value)
              .map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, {backgroundColor: item.color}]}
                  />
                  <View style={styles.legendTextContainer}>
                    <Text
                      style={styles.legendText}
                    >{`${item.label} - ${item.owner}`}</Text>
                    <Tooltip
                      title={`${formatPrice(item.value)}`}
                      enterTouchDelay={0}
                      leaveTouchDelay={500}
                      theme={{colors: {background: t.colors.background}}}
                    >
                      <IconButton
                        icon="information-outline"
                        size={16}
                        iconColor={t.colors.onSurfaceVariant}
                      />
                    </Tooltip>
                  </View>
                </View>
              ))}
          </View>
        </View>
      </View>
      {filteredIncome.length > 0 ? (
        <View style={styles.listSection}>
          <Text variant="titleMedium" style={{marginBottom: 16}}>
            Lista wpływów
          </Text>
          <FlatList
            data={filteredIncome.sort(
              (a: Income, b: Income) =>
                new Date(b.date).getTime() - new Date(a.date).getTime(),
            )}
            renderItem={({item}) => (
              <View
                style={[
                  styles.listItem,
                  isCurrentUser(item.owner) && styles.currentUserItem,
                ]}
              >
                <Text>{`${item.date}: ${item.source} - ${
                  item.owner
                }: ${formatPrice(item.price, {roundUp: false})}`}</Text>
              </View>
            )}
          />
        </View>
      ) : (
        <View style={styles.listSection}>
          <Text
            variant="titleMedium"
            style={{
              textAlign: 'center',
            }}
          >
            Brak wpływów
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  chartSection: {
    marginBottom: 24,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieChartContainer: {
    flex: 1,
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    marginRight: 8,
    borderRadius: 4,
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendText: {
    fontSize: 12,
    flex: 1,
  },
  listSection: {
    flex: 1,
  },
  listItem: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: warmColors.card,
  },
  currentUserItem: {
    borderWidth: 1,
    borderColor: warmColors.decorPrimary,
    backgroundColor: warmColors.decorPrimary,
  },
});

export default IncomeSummary;
