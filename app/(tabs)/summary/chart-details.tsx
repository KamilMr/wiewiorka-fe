import {useEffect, useMemo, useState} from 'react';
import {router, useLocalSearchParams} from 'expo-router';

import _ from 'lodash';
import {Button, IconButton} from 'react-native-paper';
import {ScrollView, View} from 'react-native';
import {format, lastDayOfMonth} from 'date-fns';

import {Axis, PickFilter, decId, groupBy} from '@/utils/aggregateData';
import {BarChart, Chip, PieChartBar, Text} from '@/components';
import {type Subcategory} from '@/types';
import {buildBarChart, buildPieChart} from '@/utils/chartBuilder';
import {selectByTimeRange, selectCategories} from '@/redux/main/selectors';
import {useAppSelector} from '@/hooks';
import {useAppTheme} from '@/constants/theme';
import {warmColors} from '@/constants/warmTheme';
import {EXCLUDED_CAT, formatPrice, shortenText} from '@/common';
import ChartDetailsTestingViews from '@/components/summary/ChartDetailsTestingViews';
import SummaryDateRangeSelector from '@/components/summary/SummaryDateRangeSelector';
import TotalSpentSummary from '@/components/summary/TotalSpentSummary';

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
const GroupCategory = ({
  axis,
  onPress,
}: {
  axis: [Axis, string];
  onPress: (axis: Axis) => void;
}) => {
  const isCat = axis[0] === '1-1';
  const handleOnPress = (axis: Axis) => () => {
    onPress?.(axis);
  };
  return (
    <View>
      <Button
        style={{height: 40, width: 140}}
        mode={'text'}
        labelStyle={{
          color: !isCat ? warmColors.primary : undefined,
          fontSize: 12,
        }}
        onPress={handleOnPress('1-0')}
      >
        Kategorie
      </Button>
      <Button
        style={{height: 40, width: 140}}
        mode={'text'}
        labelStyle={{
          color: isCat ? warmColors.primary : undefined,
          fontSize: 12,
        }}
        onPress={handleOnPress('1-1')}
      >
        Podkategorie
      </Button>
    </View>
  );
};

const Summary = () => {
  const {date}: {date: string} = useLocalSearchParams();
  const [filterDates, setFilterDates] = useState<[Date, Date]>([
    new Date(date),
    lastDayOfMonth(date.split('-').length > 2 ? new Date(date) : new Date()),
  ]);
  const [axis, setAxis] = useState<[Axis, PickFilter]>(['1-0', '0-0']);
  const [chartDisplay, setChartDisplay] = useState<string>('pie');
  const [holidayTagFilter, setHolidayTagFilter] = useState(false);

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

  const handlePieChange = (str: string) => () => setChartDisplay(str);

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

  const handleFilters = (catId: number) => () => {
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
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <GroupCategory axis={axis} onPress={handleAxisChange} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Chip
            selected={holidayTagFilter}
            mode={holidayTagFilter ? 'flat' : 'outlined'}
            showSelectedCheck={false}
            style={{marginRight: 4}}
            onPress={() => setHolidayTagFilter(value => !value)}
          >
            🏖️ Urlop
          </Chip>
          <IconButton
            icon="chart-donut"
            onPress={handlePieChange('pie')}
            iconColor={chartDisplay === 'pie' ? t.colors.primary : undefined}
          />
          <IconButton
            icon="chart-bar"
            onPress={handlePieChange('bar')}
            iconColor={chartDisplay === 'bar' ? t.colors.primary : undefined}
          />
        </View>
      </View>

      <View
        style={{
          marginTop: 48,
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {currentGroupOrCategory.map(c => {
          const isSelected = !!filters.find(f => f.name === c.name);
          return (
            <Chip
              key={c.id}
              selectedColor={
                filters.find(f => f.name === c.name)?.color ||
                t.colors.mutedForeground
              }
              // rippleColor={c.color}
              mode="outlined"
              showSelectedCheck={false}
              icon={undefined}
              style={{margin: 2, maxWidth: '50%'}}
              selected={isSelected}
              onPress={handleFilters(c.id)}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isSelected ? 600 : 400,
                  color:
                    filters.find(f => f.name === c.name)?.color ||
                    t.colors.mutedForeground,
                  textDecorationLine: isSelected ? undefined : 'line-through',
                }}
              >
                {c.name}
              </Text>
            </Chip>
          );
        })}
      </View>
      <Button
        onPress={filters.length > 0 ? handleRemoveFilters : handleResetFilters}
      >
        {filters.length > 0 ? 'Usuń filtry' : 'Zaznacz wszystkie'}
      </Button>

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
      <View style={{alignItems: 'center'}}>
        {axis[0] === '1-1' ? (
          <IconButton
            mode="contained"
            onPress={() => handleAxisChange('1-0')}
            icon={'arrow-left-top'}
          />
        ) : null}
      </View>

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
