import {RefreshControl, ScrollView, View, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import SummaryCard_v2 from '@/components/SummaryCardv2';
import {BudgetCard} from '@/components';
import {selectBudgets} from '@/redux/main/selectors';
import {useAppSelector, usePullToRefresh} from '@/hooks';
import {warmColors} from '@/constants/warmTheme';
import formatDateTz, {timeFormats} from '@/utils/formatTimeTz';
import _ from 'lodash';

const Home = () => {
  const items = useAppSelector(selectBudgets());
  const {refreshing, onRefresh} = usePullToRefresh();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={warmColors.primary}
              colors={[warmColors.primary]}
            />
          }
        >
          <SummaryCard_v2 />
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
