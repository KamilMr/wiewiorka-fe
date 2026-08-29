// Testing-only chart views for chart-details.
//TODO to verify these insights with real data before making them permanent.

import {type ReactNode, useMemo, useRef, useState} from 'react';
import {Pressable, StyleSheet, View, useWindowDimensions} from 'react-native';
import {IconButton, Portal} from 'react-native-paper';
import {addDays, differenceInCalendarDays} from 'date-fns';

import {Text} from '@/components';
import {formatPrice} from '@/common';
import {warmColors} from '@/constants/warmTheme';
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
          iconColor={warmColors.primary}
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
  const previousDates = useMemo(
    () => getPreviousDateRange(filterDates),
    [filterDates],
  );
  const previousSelectedSelector = useMemo(
    () => selectByTimeRange(previousDates, {holidayTag: holidayTagFilter}),
    [previousDates, holidayTagFilter],
  );
  const previousSelected = useAppSelector(previousSelectedSelector);

  const previousCategoryTotals = useMemo(
    () => buildCategoryTotals(previousSelected, filters, categories),
    [previousSelected, filters, categories],
  );
  const currentCategoryTotals = useMemo(
    () => buildCategoryTotals(selected, filters, categories),
    [selected, filters, categories],
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

  return (
    <View style={styles.container}>
      <InsightCard
        title="1. Kategorie vs poprzedni okres"
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
    backgroundColor: warmColors.card,
    borderWidth: 1,
    borderColor: warmColors.border,
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
    backgroundColor: warmColors.popover,
    shadowColor: warmColors.foreground,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  infoPopupText: {
    color: warmColors.popoverForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    color: warmColors.mutedForeground,
  },
  comparisonRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: warmColors.border,
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
    color: warmColors.destructive,
    fontWeight: '700',
  },
  negative: {
    color: warmColors.success,
    fontWeight: '700',
  },
  comparisonDetails: {
    marginTop: 2,
    color: warmColors.mutedForeground,
    fontSize: 12,
  },
});

export default ChartDetailsTestingViews;
