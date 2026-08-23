import {ScrollView, View, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import FinancialQuote from '@/components/FinancialQuote';
import SummaryCard_v2 from '@/components/SummaryCardv2';
import {BudgetCard} from '@/components';
import {selectBudgets, selectIncomePlanComparison} from '@/redux/main/selectors';
import {useAppSelector} from '@/hooks';
import {warmColors} from '@/constants/warmTheme';
import formatDateTz, {timeFormats} from '@/utils/formatTimeTz';
import _ from 'lodash';
import {canonicalMonth} from '@/utils/monthlyIncomePlanUtils';

const Home = () => {
  const currentMonth = canonicalMonth(new Date());
  const items = useAppSelector(selectBudgets(currentMonth));
  const incomePlanComparison = useAppSelector(state =>
    selectIncomePlanComparison(state, currentMonth),
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SummaryCard_v2 incomePlanComparison={incomePlanComparison} />
          <FinancialQuote />
          <BudgetCard
            items={_.sortBy(items, ['budgetedName'])}
            date={formatDateTz({pattern: timeFormats.dateOnly2})}
            incomePlanComparison={incomePlanComparison}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: warmColors.background,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
});

export default Home;
