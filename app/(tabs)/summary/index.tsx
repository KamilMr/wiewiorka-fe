import {useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {SummaryCard, Text} from '@/components';
import {SummaryCardProps} from '@/components/SummaryCard';
import WarmCard from '@/components/warm/WarmCard';
import WarmPill from '@/components/warm/WarmPill';
import {warmColors} from '@/constants/warmTheme';
import {useAppSelector, usePullToRefresh} from '@/hooks';
import {selectComparison} from '@/redux/main/selectors';

const MONTH = 1;
const YEAR = 12;
const MONTH_LABEL = 'Miesiąc';
const YEAR_LABEL = 'Rok';

const Config: React.FC<{
  selection: [number, string][];
  onChange: (value: string) => void;
}> = ({selection, onChange}) => {
  const [active, setActive] = useState<number>(0);

  const handleChange = (f: string) => {
    onChange?.(f);
    setActive(selection.map(el => el[0]).findIndex(n => n === +f));
  };

  return (
    <View style={styles.filterRow}>
      {selection.map(([value, name], index) => (
        <WarmPill
          key={value}
          label={name}
          active={index === active}
          onPress={() => handleChange(value.toString())}
          style={styles.filterButton}
        />
      ))}
    </View>
  );
};

const Summary = () => {
  const [filter, setFilter] = useState(MONTH);
  const {refreshing, onRefresh} = usePullToRefresh();
  const summary: SummaryCardProps[] = useAppSelector(state =>
    selectComparison(state, filter),
  );
  const handleChange = (f: string) => setFilter(+f);

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <View>
          <Text style={styles.title}>Podsumowanie</Text>
          <Text style={styles.subtitle}>
            Porównaj przychody i wydatki w wybranym okresie.
          </Text>
        </View>
        <Config
          selection={[
            [MONTH, MONTH_LABEL],
            [YEAR, YEAR_LABEL],
          ]}
          onChange={handleChange}
        />
        {!summary.length ? (
          <WarmCard style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Brak danych</Text>
            <Text style={styles.emptyText}>
              Dodaj transakcje, aby zobaczyć podsumowanie.
            </Text>
          </WarmCard>
        ) : (
          summary.map((sumObj: SummaryCardProps) => (
            <SummaryCard
              key={sumObj.id}
              income={sumObj.income}
              outcome={sumObj.outcome}
              date={sumObj.date}
              costs={sumObj.costs}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: warmColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 96,
  },
  title: {
    color: warmColors.foreground,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: warmColors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: warmColors.foreground,
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    color: warmColors.mutedForeground,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default Summary;
