import {useEffect, useState} from 'react';
import {router, useLocalSearchParams} from 'expo-router';

import _ from 'lodash';
import {Button, IconButton, Menu as PaperMenu} from 'react-native-paper';
import {ScrollView, View} from 'react-native';
import {
  endOfMonth,
  endOfYear,
  format,
  lastDayOfMonth,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns';

import {Axis, PickFilter, decId, groupBy} from '@/utils/aggregateData';
import {BarChart, Chip, DatePicker, PieChartBar, Text} from '@/components';
import {type Subcategory} from '@/types';
import {buildBarChart, buildPieChart} from '@/utils/chartBuilder';
import {selectByTimeRange, selectCategories} from '@/redux/main/selectors';
import {useAppSelector} from '@/hooks';
import {useAppTheme} from '@/constants/theme';
import {EXCLUDED_CAT, formatPrice, shortenText} from '@/common';
import ChartDetailsTestingViews from '@/components/summary/ChartDetailsTestingViews';

const excludedCategories = EXCLUDED_CAT as number[];

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
          color: !isCat ? 'blue' : undefined,
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
          color: isCat ? 'blue' : undefined,
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
  const [dateMenuVisible, setDateMenuVisible] = useState(false);

  const t = useAppTheme();

  // selectors
  const stateCategories: Subcategory[] = useAppSelector(selectCategories);
  const selected = useAppSelector(
    selectByTimeRange(filterDates, {holidayTag: holidayTagFilter}),
  );

  // grouping
  const grouped: GroupedType = groupBy(selected, 'month', ...axis);

  const getCategoryById = (id: number, isSubcategory: boolean = false) => {
    const idField = isSubcategory ? 'id' : 'groupId';
    return stateCategories.find(cat => +cat[idField] === id);
  };

  useEffect(() => {
    setFilters(
      currentGroupOrCategory.filter(
        (c: {id: number}) => !excludedCategories.includes(c.id),
      ),
    );
  }, [axis]);

  // get used categories
  const idsOfCategories: string[] = [
    ...new Set(
      _.values(grouped)
        .map(o => _.entries(o))
        .flat()
        .sort(([, va], [, vb]) => vb[0] - va[0])
        .map(([id, val]) => id),
    ),
  ];
  const idsGroupOrCategory: string[] = idsOfCategories.map(
    (str: string) => str.split('-')[+axis[0].split('-')[1]],
  );

  const getCategoryName = (
    n: number,
    idOrIdGroup: 'id' | 'groupId' = axis[0] === '1-1' ? 'id' : 'groupId',
  ) => {
    return getCategoryById(n, idOrIdGroup === 'id');
  };

  const currentGroupOrCategory: {
    name: string;
    id: number;
    type: 'category' | 'group';
    color: string;
  }[] = idsGroupOrCategory.map((n: string) => {
    const idOrIdGroup = axis[0] === '1-1' ? 'id' : 'groupId';
    const cat = getCategoryName(+n, idOrIdGroup);

    return {
      name: cat?.[idOrIdGroup === 'id' ? 'name' : 'groupName'] || 'not found',
      id: +n,
      type: idOrIdGroup === 'id' ? 'category' : 'group',
      color: cat ? cat?.color || '' : '',
    };
  });

  const handlePieChange = (str: string) => () => setChartDisplay(str);

  const [filters, setFilters] = useState(
    currentGroupOrCategory.filter(
      (c: {id: number}) => !excludedCategories.includes(c.id),
    ),
  );

  const setCat = new Set(filters.map((o: {name: string}) => o.name));

  const handleRemoveFilters = () => setFilters([]);
  const handleResetFilters = () => setFilters(currentGroupOrCategory);

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

  const setDatePreset = (dates: [Date, Date]) => () => {
    setFilterDates(dates);
    setDateMenuVisible(false);
  };

  const today = new Date();
  const previousMonth = subMonths(today, 1);

  return (
    <ScrollView style={{backgroundColor: t.colors.white}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingHorizontal: 8,
          marginBottom: 16,
        }}
      >
        <PaperMenu
          visible={dateMenuVisible}
          onDismiss={() => setDateMenuVisible(false)}
          anchor={
            <IconButton
              mode="outlined"
              icon="calendar-range"
              size={22}
              style={{marginTop: 8, marginRight: 4}}
              onPress={() => setDateMenuVisible(true)}
            />
          }
        >
          <PaperMenu.Item
            title="Ten miesiąc"
            onPress={setDatePreset([startOfMonth(today), endOfMonth(today)])}
          />
          <PaperMenu.Item
            title="Poprzedni miesiąc"
            onPress={setDatePreset([
              startOfMonth(previousMonth),
              endOfMonth(previousMonth),
            ])}
          />
          <PaperMenu.Item
            title="Ostatnie 6 miesięcy"
            onPress={setDatePreset([
              startOfMonth(subMonths(today, 5)),
              endOfMonth(today),
            ])}
          />
          <PaperMenu.Item
            title="Ten rok"
            onPress={setDatePreset([startOfYear(today), endOfYear(today)])}
          />
        </PaperMenu>
        <View style={{flex: 1}}>
          <DatePicker
            value={filterDates[0]}
            label="Start"
            style={{marginBottom: 8}}
            onChange={(date = filterDates[0]) =>
              setFilterDates([date, filterDates[1]])
            }
          />
          <DatePicker
            value={filterDates[1]}
            label="Koniec"
            style={{marginBottom: 8}}
            onChange={(date = filterDates[1]) =>
              setFilterDates([filterDates[0], date])
            }
          />
        </View>
      </View>
      <View style={{alignItems: 'center', marginBottom: 44}}>
        <Text style={{fontSize: 16, fontWeight: 'bold'}}>
          Wydano: {formatPrice(_.sumBy(data, 'value'))}
        </Text>
      </View>
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
            iconColor={chartDisplay === 'pie' ? 'blue' : undefined}
          />
          <IconButton
            icon="chart-bar"
            onPress={handlePieChange('bar')}
            iconColor={chartDisplay === 'bar' ? 'blue' : undefined}
          />
        </View>
      </View>
      {chartDisplay === 'pie' ? (
        <PieChartBar
          data={pieData}
          labelsPosition="onBorder"
          innerRadius={70}
          strokeWidth={2}
          strokeColor="white"
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
                  style={{fontSize: 12, color: 'black', fontWeight: 'bold'}}
                >
                  {formatPrice(_.sumBy(pieData, 'value'))}
                </Text>
                {pieData.slice(0, 4).map(({label, value}) => (
                  <Text
                    key={label}
                    style={{
                      fontSize: 10,
                      color: 'black',
                    }}
                  >{`${shortenText(label)}(${formatPrice(value)})`}</Text>
                ))}
                <Text style={{fontSize: 10, color: 'black'}}>...więcej</Text>
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
                filters.find(f => f.name === c.name)?.color || '#a6a6a6'
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
                    filters.find(f => f.name === c.name)?.color || '#a6a6a6',
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
      <View style={{height: 80}} />
    </ScrollView>
  );
};

export default Summary;
