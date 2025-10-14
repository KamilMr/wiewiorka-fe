import {ScrollView, View, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import FinancialQuote from '@/components/FinancialQuote';
import SummaryCard_v2 from '@/components/SummaryCardv2';
import {BudgetCard} from '@/components';
import {selectBudgets} from '@/redux/main/selectors';
import {useAppSelector} from '@/hooks';
import {useAppTheme, sizes} from '@/constants/theme';
import formatDateTz, {timeFormats} from '@/utils/formatTimeTz';
import _ from 'lodash';

const Home = () => {
  const t = useAppTheme();
  const items = useAppSelector(selectBudgets());
  return (
    <SafeAreaView style={{backgroundColor: t.colors.white, flex: 1}}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SummaryCard_v2 />
          <FinancialQuote />
          <BudgetCard
            items={_.sortBy(items, ['budgetedName'])}
            date={formatDateTz({pattern: timeFormats.dateOnly2})}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  scrollView: {
    width: '100%',
    paddingHorizontal: '5%',
  },
  scrollContent: {
    gap: sizes.md,
    paddingBottom: sizes.xl,
  },
});

export default Home;
