// Testing-only chart views for chart-details.
//TODO to verify these insights with real data before making them permanent.

import {type ReactNode, useMemo, useRef, useState} from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {IconButton, Portal} from 'react-native-paper';
import {addDays, differenceInCalendarDays, format, isWeekend} from 'date-fns';
import {LineChart} from 'react-native-gifted-charts';

import {BarChart, Text} from '@/components';
import {formatPrice} from '@/common';
import {useAppSelector} from '@/hooks';
import {selectByTimeRange} from '@/redux/main/selectors';
import {type Subcategory} from '@/types';
import {type AggregatedData} from '@/utils/types';

type ChartFilter = {
  name: string;
  id: number;
  type: 'category' | 'group';
  color: string;
};

type Props = {
  selected: AggregatedData;
  filterDates: [Date, Date];
  filters: ChartFilter[];
  categories: Subcategory[];
  holidayTagFilter: boolean;
};

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

const fallbackColors = ['#5D87FF', '#FFB020', '#43A047', '#E53935', '#8E24AA'];

const sumValues = (values?: number[]) =>
  values?.reduce((sum, value) => sum + (Number(value) || 0), 0) || 0;

const normalizeDateRange = ([start, end]: [Date, Date]): [Date, Date] =>
  start.getTime() <= end.getTime() ? [start, end] : [end, start];

const getPreviousDateRange = (dates: [Date, Date]): [Date, Date] => {
  const [start, end] = normalizeDateRange(dates);
  const rangeLength = differenceInCalendarDays(end, start) + 1;
  const previousEnd = addDays(start, -1);
  return [addDays(previousEnd, -rangeLength + 1), previousEnd];
};

const shouldIncludeBucket = (bucketId: string, filters: ChartFilter[]) => {
  if (!filters.length) return false;

  const [groupId, categoryId] = bucketId.split('-').map(Number);
  return filters.some(filter =>
    filter.type === 'group' ? filter.id === groupId : filter.id === categoryId,
  );
};

const getCategoryMeta = (
  categoryId: string,
  categories: Subcategory[],
  index = 0,
) => {
  const category = categories.find(cat => cat.id === Number(categoryId));
  return {
    name: category?.name || `Kategoria ${categoryId}`,
    color: category?.color || fallbackColors[index % fallbackColors.length],
  };
};

const buildDayTotals = (
  data: AggregatedData,
  dates: [Date, Date],
  filters: ChartFilter[],
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
  filters: ChartFilter[],
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
    .map(([id, value], index) => ({
      id,
      value,
      ...getCategoryMeta(id, categories, index),
    }))
    .sort((a, b) => b.value - a.value);
};

const shouldShowLabel = (index: number, length: number) =>
  length <= 10 || index === 0 || index === length - 1 || index % 5 === 0;

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

type InfoAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const InfoPopup = ({text}: {text: string}) => {
  const iconRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<InfoAnchor | null>(null);
  const {width, height} = useWindowDimensions();
  const popupWidth = Math.min(320, width - 32);
  const popupLeft = anchor
    ? Math.min(
        Math.max(16, anchor.x + anchor.width - popupWidth),
        width - popupWidth - 16,
      )
    : 16;
  const popupTop = anchor
    ? anchor.y > height - 180
      ? Math.max(16, anchor.y - 128)
      : anchor.y + anchor.height + 6
    : 16;

  const handlePress = () => {
    if (anchor) {
      setAnchor(null);
      return;
    }

    iconRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      setAnchor({x, y, width: measuredWidth, height: measuredHeight});
    });
  };

  return (
    <>
      <View ref={iconRef} collapsable={false}>
        <IconButton
          icon="information-outline"
          size={18}
          style={styles.infoIcon}
          iconColor="#3157A4"
          onPress={handlePress}
        />
      </View>
      {anchor ? (
        <Portal>
          <Pressable
            style={styles.portalOverlay}
            onPress={() => setAnchor(null)}
          >
            <View
              style={[
                styles.infoPopup,
                {left: popupLeft, top: popupTop, width: popupWidth},
              ]}
            >
              <Text style={styles.infoPopupText}>{text}</Text>
            </View>
          </Pressable>
        </Portal>
      ) : null}
    </>
  );
};

const InsightCard = ({
  title,
  tooltip,
  children,
}: {
  title: string;
  tooltip?: string;
  children: ReactNode;
}) => (
  <View style={styles.card}>
    <View style={styles.titleRow}>
      <Text style={styles.title}>{title}</Text>
      {tooltip ? <InfoPopup text={tooltip} /> : null}
    </View>
    {children}
  </View>
);

const EmptyInsight = () => (
  <Text style={styles.empty}>Brak danych dla wybranych filtrów.</Text>
);

const ChartDetailsTestingViews = ({
  selected,
  filterDates,
  filters,
  categories,
  holidayTagFilter,
}: Props) => {
  const {width} = useWindowDimensions();
  const [chartBoxWidth, setChartBoxWidth] = useState(0);
  const yAxisLabelWidth = 54;
  const chartContainerWidth = chartBoxWidth || Math.max(width - 72, 280);
  const chartWidth = Math.max(chartContainerWidth - yAxisLabelWidth - 8, 220);
  const labelWidth = 44;
  const handleChartBoxLayout = (event: LayoutChangeEvent) => {
    setChartBoxWidth(event.nativeEvent.layout.width);
  };
  const compactChartProps = {
    width: chartWidth,
    parentWidth: chartContainerWidth,
    yAxisLabelWidth,
    rulesLength: chartWidth,
    xAxisLength: chartWidth,
    endSpacing: 16,
    disableScroll: false,
    nestedScrollEnabled: true,
    showScrollIndicator: false,
    xAxisLabelTextStyle: styles.axisLabel,
  };
  const previousDates = useMemo(
    () => getPreviousDateRange(filterDates),
    [filterDates],
  );
  const previousSelected = useAppSelector(
    selectByTimeRange(previousDates, {holidayTag: holidayTagFilter}),
  );

  const dayTotals = useMemo(
    () => buildDayTotals(selected, filterDates, filters),
    [selected, filterDates, filters],
  );
  const previousCategoryTotals = useMemo(
    () => buildCategoryTotals(previousSelected, filters, categories),
    [previousSelected, filters, categories],
  );
  const currentCategoryTotals = useMemo(
    () => buildCategoryTotals(selected, filters, categories),
    [selected, filters, categories],
  );

  const hasData = dayTotals.some(day => day.value > 0);
  const maxDayValue = Math.max(...dayTotals.map(day => day.value), 0);

  const dailyTrendData = dayTotals.map((day, index) => ({
    value: day.value,
    label: shouldShowLabel(index, dayTotals.length)
      ? format(new Date(day.date), 'dd.MM')
      : '',
    labelWidth,
    labelTextStyle: styles.axisLabel,
    frontColor: isWeekend(new Date(day.date)) ? '#FFB020' : '#5D87FF',
  }));

  const cumulativeData = dayTotals.reduce<{value: number; label: string}[]>(
    (acc, day, index) => {
      const previousValue = acc[index - 1]?.value || 0;
      acc.push({
        value: previousValue + day.value,
        label: shouldShowLabel(index, dayTotals.length)
          ? format(new Date(day.date), 'dd.MM')
          : '',
      });
      return acc;
    },
    [],
  );

  const previousTotalsById = Object.fromEntries(
    previousCategoryTotals.map(category => [category.id, category.value]),
  );
  const currentTotalsById = Object.fromEntries(
    currentCategoryTotals.map(category => [category.id, category.value]),
  );
  const comparisonRows = Array.from(
    new Set([
      ...Object.keys(currentTotalsById),
      ...Object.keys(previousTotalsById),
    ]),
  )
    .map((id, index) => {
      const current = currentTotalsById[id] || 0;
      const previous = previousTotalsById[id] || 0;
      return {
        id,
        current,
        previous,
        diff: current - previous,
        ...getCategoryMeta(id, categories, index),
      };
    })
    .filter(row => row.current > 0 || row.previous > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 5);

  const topCategories = currentCategoryTotals.slice(0, 4);
  const categoryShareMode = shouldUseMonthlyCategoryShare(dayTotals)
    ? 'month'
    : 'day';
  const categoryShareBuckets = buildCategoryShareBuckets(
    dayTotals,
    categoryShareMode,
  );
  const categoryShareLabelWidth =
    categoryShareMode === 'month' ? 64 : labelWidth;
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
          ...(otherValue > 0 ? [{value: otherValue, color: '#BDBDBD'}] : []),
        ],
      };
    });

  return (
    <View style={styles.container}>
      <InsightCard
        title="1. Dzienny trend wydatków"
        tooltip="Każdy słupek pokazuje sumę wydatków z jednego dnia. Im wyższy słupek, tym droższy dzień. Pomarańczowy kolor oznacza weekend, a niebieski dzień roboczy."
      >
        {hasData ? (
          <View style={styles.chartBox} onLayout={handleChartBoxLayout}>
            <BarChart
              barData={dailyTrendData}
              {...compactChartProps}
              height={180}
              maxValue={maxDayValue || 1}
              barWidth={14}
              spacing={10}
              initialSpacing={8}
              xAxisTextNumberOfLines={1}
            />
          </View>
        ) : (
          <EmptyInsight />
        )}
      </InsightCard>

      <InsightCard
        title="2. Wydatki narastająco"
        tooltip="Linia pokazuje, ile łącznie wydano od początku wybranego zakresu. Gdy linia rośnie stromo, oznacza to szybsze tempo wydawania pieniędzy."
      >
        {hasData ? (
          <View style={styles.chartBox} onLayout={handleChartBoxLayout}>
            <LineChart
              data={cumulativeData}
              {...compactChartProps}
              height={180}
              color="#43A047"
              thickness={3}
              curved
              hideDataPoints={dayTotals.length > 20}
              xAxisLabelTextStyle={styles.axisLabel}
              yAxisTextStyle={styles.axisLabel}
            />
          </View>
        ) : (
          <EmptyInsight />
        )}
      </InsightCard>

      <InsightCard
        title="3. Kategorie vs poprzedni okres"
        tooltip="Lista porównuje wybrany zakres z poprzednim okresem o tej samej długości. Czerwony plus oznacza wzrost wydatków, a zielona wartość oznacza spadek."
      >
        {comparisonRows.length ? (
          comparisonRows.map(row => (
            <View key={row.id} style={styles.comparisonRow}>
              <View style={styles.comparisonHeader}>
                <Text style={[styles.categoryName, {color: row.color}]}>
                  {row.name}
                </Text>
                <Text style={row.diff >= 0 ? styles.positive : styles.negative}>
                  {row.diff >= 0 ? '+' : ''}
                  {formatPrice(row.diff)}
                </Text>
              </View>
              <Text style={styles.comparisonDetails}>
                Teraz: {formatPrice(row.current)} • Poprzednio:{' '}
                {formatPrice(row.previous)}
              </Text>
            </View>
          ))
        ) : (
          <EmptyInsight />
        )}
      </InsightCard>

      <InsightCard
        title={`7. Udział kategorii w czasie (${categoryShareMode === 'month' ? 'miesiące' : 'dni'})`}
        tooltip="Kolory w słupku pokazują udział najważniejszych kategorii w sumie wydatków. Dla krótszego zakresu jeden słupek oznacza dzień. Dla zakresu około dwóch miesięcy lub dłuższego jeden słupek oznacza miesiąc. Szary kolor oznacza pozostałe kategorie."
      >
        {stackData.length ? (
          <>
            <View style={styles.chartBox} onLayout={handleChartBoxLayout}>
              <BarChart
                barData={[]}
                stackData={stackData}
                {...compactChartProps}
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
                  style={[styles.legendDot, {backgroundColor: '#BDBDBD'}]}
                />
                <Text style={styles.legendText}>Inne</Text>
              </View>
            </View>
          </>
        ) : (
          <EmptyInsight />
        )}
      </InsightCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 12,
  },
  card: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },
  chartBox: {
    maxWidth: '100%',
    overflow: 'hidden',
  },
  titleRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  infoIcon: {
    width: 28,
    height: 28,
    margin: 0,
  },
  portalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  infoPopup: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#20252B',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  infoPopupText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    color: '#777777',
  },
  axisLabel: {
    color: '#777777',
    fontSize: 10,
  },
  comparisonRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryName: {
    flex: 1,
    fontWeight: '700',
  },
  positive: {
    color: '#E53935',
    fontWeight: '700',
  },
  negative: {
    color: '#43A047',
    fontWeight: '700',
  },
  comparisonDetails: {
    marginTop: 2,
    color: '#777777',
    fontSize: 12,
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
    color: '#555555',
  },
});

export default ChartDetailsTestingViews;
