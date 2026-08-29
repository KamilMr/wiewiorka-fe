import {useEffect, useMemo, useState} from 'react';
import {router, useLocalSearchParams} from 'expo-router';

import _ from 'lodash';
import {ScrollView, View} from 'react-native';
import {format, lastDayOfMonth} from 'date-fns';

import {Axis, PickFilter, decId, groupBy} from '@/utils/aggregateData';
import {BarChart, PieChartBar, Text} from '@/components';
import {type Subcategory} from '@/types';
import {buildBarChart, buildPieChart} from '@/utils/chartBuilder';
import {selectByTimeRange, selectCategories} from '@/redux/main/selectors';
import {useAppSelector} from '@/hooks';
import {useAppTheme} from '@/constants/theme';
import {EXCLUDED_CAT, formatPrice, shortenText} from '@/common';
import ChartDetailsTestingViews from '@/components/summary/ChartDetailsTestingViews';
import SummaryDateRangeSelector from '@/components/summary/SummaryDateRangeSelector';
import TotalSpentSummary from '@/components/summary/TotalSpentSummary';
import SummaryExploreCard from '@/components/summary/SummaryExploreCard';
import SummaryGroupingControls from '@/components/summary/SummaryGroupingControls';
import SummaryChartTypeControls from '@/components/summary/SummaryChartTypeControls';
import SummaryCategoryFilters, {
  type SummaryCategoryFilterItem,
} from '@/components/summary/SummaryCategoryFilters';

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
const Summary = () => {
  const {date}: {date: string} = useLocalSearchParams();
  const [filterDates, setFilterDates] = useState<[Date, Date]>([
    new Date(date),
    lastDayOfMonth(date.split('-').length > 2 ? new Date(date) : new Date()),
  ]);
  const [axis, setAxis] = useState<[Axis, PickFilter]>(['1-0', '0-0']);
  const [chartDisplay, setChartDisplay] = useState<'pie' | 'bar'>('pie');
  const [holidayTagFilter, setHolidayTagFilter] = useState(false);
  const [isFilterGrid, setIsFilterGrid] = useState(false);

  const t = useAppTheme();

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

  const handleChartTypeChange = (chartType: 'pie' | 'bar') =>
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
  const data = chartDisplay === 'pie' ? pieData : barData;

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
        amount={_.sumBy(data, 'value')}
        categoryCount={data.length}
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
        ) : (
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

export default Summary;
