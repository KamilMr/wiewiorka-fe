import {useEffect, useMemo, useState} from 'react';
import {router, useLocalSearchParams} from 'expo-router';

import _ from 'lodash';
import {
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  addDays,
  differenceInCalendarDays,
  format,
  lastDayOfMonth,
} from 'date-fns';

import {Axis, PickFilter, decId, groupBy} from '@/utils/aggregateData';
import {BarChart, PieChartBar, Text} from '@/components';
import {type Subcategory} from '@/types';
import {buildBarChart, buildPieChart} from '@/utils/chartBuilder';
import {selectByTimeRange, selectCategories} from '@/redux/main/selectors';
import {useAppSelector} from '@/hooks';
import {useAppTheme} from '@/constants/theme';
import {EXCLUDED_CAT, formatPrice, shortenText} from '@/common';
import {warmColors} from '@/constants/warmTheme';
import ChartDetailsTestingViews from '@/components/summary/ChartDetailsTestingViews';
import SummaryDateRangeSelector from '@/components/summary/SummaryDateRangeSelector';
import TotalSpentSummary from '@/components/summary/TotalSpentSummary';
import SummaryExploreCard from '@/components/summary/SummaryExploreCard';
import SummaryGroupingControls from '@/components/summary/SummaryGroupingControls';
import SummaryChartTypeControls from '@/components/summary/SummaryChartTypeControls';
import SummaryCategoryFilters, {
  type SummaryCategoryFilterItem,
} from '@/components/summary/SummaryCategoryFilters';
import {type AggregatedData} from '@/utils/types';

const excludedCategories = EXCLUDED_CAT as number[];

type FilterCategory = {
  name: string;
  id: number;
  type: 'category' | 'group';
  color: string;
};

const areSameFilters = (a: FilterCategory[], b: FilterCategory[]) =>
  a.length === b.length &&
  a.every(
    (item, index) =>
      item.id === b[index]?.id &&
      item.type === b[index]?.type &&
      item.name === b[index]?.name &&
      item.color === b[index]?.color,
  );

type GroupedValue = number[];
interface GroupedType {
  [key: string]: {[key: string]: GroupedValue};
}

type DayTotal = {
  date: string;
  value: number;
  categories: Record<string, number>;
};

type CategoryShareBucket = {
  key: string;
  label: string;
  value: number;
  categories: Record<string, number>;
};

type CategoryTotal = {
  id: string;
  name: string;
  color: string;
  value: number;
};

const fallbackColors = [
  warmColors.chart1,
  warmColors.chart2,
  warmColors.chart3,
  warmColors.chart4,
  warmColors.chart5,
];
const sumValues = (values?: number[]) =>
  values?.reduce((sum, value) => sum + (Number(value) || 0), 0) || 0;

const normalizeDateRange = ([start, end]: [Date, Date]): [Date, Date] =>
  start.getTime() <= end.getTime() ? [start, end] : [end, start];

const shouldIncludeBucket = (bucketId: string, filters: FilterCategory[]) => {
  if (!filters.length) return false;

  const [groupId, categoryId] = bucketId.split('-').map(Number);
  return filters.some(filter =>
    filter.type === 'group' ? filter.id === groupId : filter.id === categoryId,
  );
};

const buildDayTotals = (
  data: AggregatedData,
  dates: [Date, Date],
  filters: FilterCategory[],
): DayTotal[] => {
  const [start, end] = normalizeDateRange(dates);
  const daysCount = Math.max(0, differenceInCalendarDays(end, start)) + 1;

  return Array.from({length: daysCount}, (_, index) => {
    const date = format(addDays(start, index), 'yyyy-MM-dd');
    const categories: Record<string, number> = {};

    Object.entries(data[date] || {}).forEach(([bucketId, values]) => {
      if (!shouldIncludeBucket(bucketId, filters)) return;

      const [, categoryId] = bucketId.split('-');
      categories[categoryId] ??= 0;
      categories[categoryId] += sumValues(values);
    });

    return {
      date,
      categories,
      value: Object.values(categories).reduce((sum, value) => sum + value, 0),
    };
  });
};

const buildCategoryTotals = (
  data: AggregatedData,
  filters: FilterCategory[],
  categories: Subcategory[],
): CategoryTotal[] => {
  const totals: Record<string, number> = {};

  Object.values(data).forEach(dayBuckets => {
    Object.entries(dayBuckets).forEach(([bucketId, values]) => {
      if (!shouldIncludeBucket(bucketId, filters)) return;

      const [, categoryId] = bucketId.split('-');
      totals[categoryId] ??= 0;
      totals[categoryId] += sumValues(values);
    });
  });

  return Object.entries(totals)
    .map(([id, value], index) => {
      const category = categories.find(cat => cat.id === Number(id));
      return {
        id,
        value,
        name: category?.name || `Kategoria ${id}`,
        color: category?.color || fallbackColors[index % fallbackColors.length],
      };
    })
    .sort((a, b) => b.value - a.value);
};

const shouldUseMonthlyCategoryShare = (dayTotals: DayTotal[]) => {
  const monthsCount = new Set(
    dayTotals.map(day => format(new Date(day.date), 'yyyy-MM')),
  ).size;

  return monthsCount >= 2 && dayTotals.length >= 56;
};

const buildCategoryShareBuckets = (
  dayTotals: DayTotal[],
  mode: 'day' | 'month',
): CategoryShareBucket[] => {
  if (mode === 'day') {
    return dayTotals.map(day => ({
      key: day.date,
      label: format(new Date(day.date), 'dd.MM'),
      value: day.value,
      categories: day.categories,
    }));
  }

  const monthBuckets = dayTotals.reduce<Record<string, CategoryShareBucket>>(
    (acc, day) => {
      const key = format(new Date(day.date), 'yyyy-MM');
      acc[key] ??= {
        key,
        label: format(new Date(`${key}-01`), 'MM.yyyy'),
        value: 0,
        categories: {},
      };

      acc[key].value += day.value;
      Object.entries(day.categories).forEach(([categoryId, value]) => {
        acc[key].categories[categoryId] ??= 0;
        acc[key].categories[categoryId] += value;
      });

      return acc;
    },
    {},
  );

  return Object.values(monthBuckets).sort((a, b) => a.key.localeCompare(b.key));
};

const Summary = () => {
  const {date}: {date: string} = useLocalSearchParams();
  const [filterDates, setFilterDates] = useState<[Date, Date]>([
    new Date(date),
    lastDayOfMonth(date.split('-').length > 2 ? new Date(date) : new Date()),
  ]);
  const [axis, setAxis] = useState<[Axis, PickFilter]>(['1-0', '0-0']);
  const [chartDisplay, setChartDisplay] = useState<'pie' | 'bar' | 'share'>(
    'pie',
  );
  const [holidayTagFilter, setHolidayTagFilter] = useState(false);
  const [isFilterGrid, setIsFilterGrid] = useState(false);

  const t = useAppTheme();
  const {width} = useWindowDimensions();
  const [chartBoxWidth, setChartBoxWidth] = useState(0);
  const yAxisLabelWidth = 54;
  const chartContainerWidth = chartBoxWidth || Math.max(width - 72, 280);
  const chartWidth = Math.max(chartContainerWidth - yAxisLabelWidth - 8, 220);
  const handleChartBoxLayout = (event: LayoutChangeEvent) => {
    setChartBoxWidth(event.nativeEvent.layout.width);
  };

  // selectors
  const stateCategories: Subcategory[] = useAppSelector(selectCategories);
  const selectedSelector = useMemo(
    () => selectByTimeRange(filterDates, {holidayTag: holidayTagFilter}),
    [filterDates, holidayTagFilter],
  );
  const selected = useAppSelector(selectedSelector);

  // grouping
  const grouped: GroupedType = useMemo(
    () => groupBy(selected, 'month', ...axis),
    [selected, axis],
  );

  const getCategoryById = (id: number, isSubcategory: boolean = false) => {
    const idField = isSubcategory ? 'id' : 'groupId';
    return stateCategories.find(cat => +cat[idField] === id);
  };

  // get used categories
  const idsOfCategories: string[] = useMemo(
    () => [
      ...new Set(
        _.values(grouped)
          .map(o => _.entries(o))
          .flat()
          .sort(([, va], [, vb]) => vb[0] - va[0])
          .map(([id]) => id),
      ),
    ],
    [grouped],
  );
  const idsGroupOrCategory: string[] = useMemo(
    () =>
      idsOfCategories.map(
        (str: string) => str.split('-')[+axis[0].split('-')[1]],
      ),
    [idsOfCategories, axis],
  );

  const getCategoryName = (
    n: number,
    idOrIdGroup: 'id' | 'groupId' = axis[0] === '1-1' ? 'id' : 'groupId',
  ) => {
    return getCategoryById(n, idOrIdGroup === 'id');
  };

  const currentGroupOrCategory: FilterCategory[] = useMemo(
    () =>
      idsGroupOrCategory.map((n: string) => {
        const idOrIdGroup = axis[0] === '1-1' ? 'id' : 'groupId';
        const cat = stateCategories.find(c => +c[idOrIdGroup] === +n);

        return {
          name:
            cat?.[idOrIdGroup === 'id' ? 'name' : 'groupName'] || 'not found',
          id: +n,
          type: idOrIdGroup === 'id' ? 'category' : 'group',
          color: cat ? cat?.color || '' : '',
        };
      }),
    [idsGroupOrCategory, axis, stateCategories],
  );

  const availableCategories = useMemo(
    () =>
      currentGroupOrCategory.filter(c => !excludedCategories.includes(c.id)),
    [currentGroupOrCategory],
  );

  const handleChartTypeChange = (chartType: 'pie' | 'bar' | 'share') =>
    setChartDisplay(chartType);

  const [filters, setFilters] = useState<FilterCategory[]>(availableCategories);

  useEffect(() => {
    setFilters(prev =>
      areSameFilters(prev, availableCategories) ? prev : availableCategories,
    );
  }, [availableCategories]);

  const setCat = new Set(filters.map((o: {name: string}) => o.name));

  const handleRemoveFilters = () => setFilters([]);
  const handleResetFilters = () => setFilters(availableCategories);

  const pieData = buildPieChart(grouped, setCat, stateCategories);
  const barData = buildBarChart(grouped, setCat, stateCategories);
  const categoryData = chartDisplay === 'bar' ? barData : pieData;
  const dayTotals = useMemo(
    () => buildDayTotals(selected, filterDates, filters),
    [selected, filterDates, filters],
  );
  const topCategories = useMemo(
    () => buildCategoryTotals(selected, filters, stateCategories).slice(0, 4),
    [selected, filters, stateCategories],
  );
  const categoryShareMode = shouldUseMonthlyCategoryShare(dayTotals)
    ? 'month'
    : 'day';
  const categoryShareBuckets = buildCategoryShareBuckets(
    dayTotals,
    categoryShareMode,
  );
  const categoryShareLabelWidth = categoryShareMode === 'month' ? 64 : 44;
  const stackData = categoryShareBuckets
    .filter(bucket => bucket.value > 0)
    .map(bucket => {
      const topIds = new Set(topCategories.map(category => category.id));
      const otherValue = Object.entries(bucket.categories).reduce(
        (sum, [categoryId, value]) =>
          topIds.has(categoryId) ? sum : sum + value,
        0,
      );

      return {
        label: bucket.label,
        labelWidth: categoryShareLabelWidth,
        labelTextStyle: styles.axisLabel,
        stacks: [
          ...topCategories.map(category => ({
            value: bucket.categories[category.id] || 0,
            color: category.color,
          })),
          ...(otherValue > 0
            ? [{value: otherValue, color: warmColors.chart2}]
            : []),
        ],
      };
    });

  const handleFilters = (catId: number) => {
    const categoryToAdd = currentGroupOrCategory.find(f => f.id === catId);
    if (!categoryToAdd) {
      return;
    }
    const isThere = filters.findIndex(f => f.id === catId);
    const newState =
      isThere > -1
        ? filters.filter(f => f.id !== catId)
        : [...filters, categoryToAdd];
    setFilters(newState);
  };

  const filterItems: SummaryCategoryFilterItem[] = currentGroupOrCategory.map(
    category => ({
      id: category.id,
      label: category.name,
      color: category.color,
      selected: filters.some(filter => filter.name === category.name),
    }),
  );

  const handleAxisChange = (ax: Axis) => {
    setAxis([ax, ax === '1-0' ? '0-0' : axis[1]]);
  };

  return (
    <ScrollView style={{backgroundColor: t.colors.background}}>
      <SummaryDateRangeSelector
        value={filterDates}
        onChange={setFilterDates}
        style={{marginHorizontal: 20, marginTop: 5, marginBottom: 20}}
      />
      <TotalSpentSummary
        amount={_.sumBy(categoryData, 'value')}
        categoryCount={categoryData.length}
        categoryType={axis[0] === '1-1' ? 'subcategory' : 'category'}
        dateRange={filterDates}
      />
      <SummaryExploreCard
        groupingControls={
          <SummaryGroupingControls
            isSubcategory={axis[0] === '1-1'}
            holidaySelected={holidayTagFilter}
            onGroupingChange={grouping =>
              handleAxisChange(grouping === 'category' ? '1-0' : '1-1')
            }
            onHolidayChange={() => setHolidayTagFilter(value => !value)}
          />
        }
        chartTypeControls={
          <SummaryChartTypeControls
            chartType={chartDisplay}
            onChartTypeChange={handleChartTypeChange}
          />
        }
        categoryFilters={
          <SummaryCategoryFilters
            items={filterItems}
            isGrid={isFilterGrid}
            showDisplayToggle={filterItems.length > 4}
            hasFilters={filters.length > 0}
            onDisplayChange={() => setIsFilterGrid(value => !value)}
            onItemPress={handleFilters}
            onClearOrReset={
              filters.length > 0 ? handleRemoveFilters : handleResetFilters
            }
          />
        }
      >
        {chartDisplay === 'pie' ? (
          <PieChartBar
            data={pieData}
            labelsPosition="onBorder"
            innerRadius={70}
            strokeWidth={2}
            strokeColor={t.colors.card}
            onPress={(item: {label: string; id: string}) => {
              if (axis[0] === '1-1') {
                const dates = filterDates.map(d => format(d, 'yyyy-MM-dd'));
                let category: string | undefined;
                const cat: Subcategory | undefined = getCategoryName(
                  +decId(item.id)[1],
                  'id',
                );
                if (cat) category = cat.name;

                router.navigate({
                  pathname: '/summary/list',
                  params: {
                    dates,
                    category: category || '',
                    holidayTag: holidayTagFilter ? 'true' : '',
                  },
                });
                return;
              }
              setAxis(['1-1', `${decId(item.id)[0]}-0`]);
              //else do navigation
            }}
            showText
            centerLabelComponent={() => {
              return (
                <View style={{justifyContent: 'center', alignItems: 'center'}}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: t.colors.onBackground,
                      fontWeight: 'bold',
                    }}
                  >
                    {formatPrice(_.sumBy(pieData, 'value'))}
                  </Text>
                  {pieData.slice(0, 4).map(({label, value}) => (
                    <Text
                      key={label}
                      style={{
                        fontSize: 10,
                        color: t.colors.onBackground,
                      }}
                    >{`${shortenText(label)}(${formatPrice(value)})`}</Text>
                  ))}
                  <Text style={{fontSize: 10, color: t.colors.onBackground}}>
                    ...więcej
                  </Text>
                </View>
              );
            }}
          />
        ) : chartDisplay === 'bar' ? (
          <BarChart
            barData={barData}
            onPress={(item: {label: string; id: string}) => {
              if (axis[0] === '1-1') {
                const dates = filterDates.map(d => format(d, 'yyyy-MM-dd'));
                let category: string | undefined;
                const cat: Subcategory | undefined = getCategoryName(
                  +decId(item.id)[1],
                  'id',
                );
                if (cat) category = cat.name;

                router.navigate({
                  pathname: '/summary/list',
                  params: {
                    dates,
                    category: category || '',
                    holidayTag: holidayTagFilter ? 'true' : '',
                  },
                });
                return;
              }
              setAxis(['1-1', `${decId(item.id)[0]}-0`]);
            }}
          />
        ) : stackData.length ? (
          <>
            <View style={styles.chartBox} onLayout={handleChartBoxLayout}>
              <BarChart
                barData={[]}
                stackData={stackData}
                width={chartWidth}
                parentWidth={chartContainerWidth}
                yAxisLabelWidth={yAxisLabelWidth}
                rulesLength={chartWidth}
                xAxisLength={chartWidth}
                endSpacing={16}
                disableScroll={false}
                nestedScrollEnabled
                showScrollIndicator={false}
                xAxisLabelTextStyle={styles.axisLabel}
                height={180}
                barWidth={18}
                spacing={12}
                initialSpacing={8}
                xAxisTextNumberOfLines={1}
              />
            </View>
            <View style={styles.legend}>
              {topCategories.map(category => (
                <View key={category.id} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      {backgroundColor: category.color},
                    ]}
                  />
                  <Text style={styles.legendText}>{category.name}</Text>
                </View>
              ))}
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {backgroundColor: warmColors.chart2},
                  ]}
                />
                <Text style={styles.legendText}>Inne</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.empty}>Brak danych dla wybranych filtrów.</Text>
        )}
      </SummaryExploreCard>

      <ChartDetailsTestingViews
        selected={selected}
        filterDates={filterDates}
        filters={filters}
        categories={stateCategories}
        holidayTagFilter={holidayTagFilter}
      />

      <View style={{height: 80}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  chartBox: {
    maxWidth: '100%',
    overflow: 'hidden',
  },
  axisLabel: {
    color: warmColors.mutedForeground,
    fontSize: 10,
  },
  legend: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    marginRight: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    marginRight: 4,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: warmColors.foreground,
  },
  empty: {
    color: warmColors.mutedForeground,
  },
});

export default Summary;
