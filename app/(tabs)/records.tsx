import {useState, useEffect} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';

import {Searchbar, IconButton, Badge} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import _ from 'lodash';
import {format} from 'date-fns';

import DynamicRecordList from '@/components/DynamicList';
import {NoData} from '@/components';
import FilterDrawer, {FilterState} from '@/components/FilterDrawer';
import {isCloseToBottom} from '@/common';
import {selectRecords, selectCategories} from '@/redux/main/selectors';
import {sizes, useAppTheme} from '@/constants/theme';
import {useAppSelector} from '@/hooks';

const Records = () => {
  const t = useAppTheme();
  const params = useLocalSearchParams<{
    category?: string;
    dateStart?: string;
    dateEnd?: string;
  }>();

  const [number, setNumber] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    dateFrom: null,
    dateTo: null,
    holidayTag: false,
  });

  const categories = useAppSelector(selectCategories);
  const categoryItems = categories.map(cat => ({
    label: cat.name,
    value: cat.name,
  }));

  // Initialize filters from route params
  useEffect(() => {
    if (params.category) setFilters(prev => ({...prev, categories: [params.category]}));
    if (params.dateStart && params.dateEnd)
      setFilters(prev => ({
        ...prev,
        dateFrom: new Date(params.dateStart!),
        dateTo: new Date(params.dateEnd!),
      }));
  }, [params.category, params.dateStart, params.dateEnd]);

  // Build date range for selector
  // Support partial date filtering: only from, only to, or both
  const dateRange: [string, string] | undefined =
    filters.dateFrom || filters.dateTo
      ? [
          filters.dateFrom
            ? format(filters.dateFrom, 'yyyy-MM-dd')
            : '1900-01-01', // Far past if no start date
          filters.dateTo
            ? format(filters.dateTo, 'yyyy-MM-dd')
            : '2100-12-31', // Far future if no end date
        ]
      : undefined;

  const records = useAppSelector(
    selectRecords(number, {
      txt: searchQuery,
      categories: filters.categories,
      dates: dateRange,
      holidayTag: filters.holidayTag,
    }),
  );

  // Load more items when the scroll reaches the bottom
  const handleScroll = ({
    nativeEvent,
  }: {
    nativeEvent: NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'];
  }) => {
    if (isCloseToBottom(nativeEvent)) {
      setNumber(number + 20);
    }
  };

  const handleNavigate = (id: number, isExpense: boolean) => () => {
    router.push({
      pathname: '/addnew',
      params: {id, type: isExpense ? 'expense' : 'income'},
    });
  };

  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({...prev, ...newFilters}));
  };

  const handleClearAll = () => {
    setFilters({
      categories: [],
      dateFrom: null,
      dateTo: null,
      holidayTag: false,
    });
  };

  // Calculate active filter count for badge
  const activeFilterCount =
    filters.categories.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.holidayTag ? 1 : 0);

  return (
    <SafeAreaView
      style={{padding: sizes.xl, backgroundColor: 'white', flex: 1}}
    >
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: sizes.sm}}>
        <View style={{flex: 1}}>
          <Searchbar
            placeholder="Szukaj"
            onChangeText={setSearchQuery}
            value={searchQuery}
          />
        </View>
        <View style={{position: 'relative'}}>
          <IconButton
            icon="filter-menu"
            size={24}
            onPress={() => setDrawerVisible(!drawerVisible)}
            style={{margin: 0}}
          />
          {activeFilterCount > 0 && (
            <Badge
              size={18}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: t.colors.error,
              }}
            >
              {activeFilterCount}
            </Badge>
          )}
        </View>
      </View>

      <FilterDrawer
        visible={drawerVisible}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearAll={handleClearAll}
        onClose={() => setDrawerVisible(false)}
        categoryItems={categoryItems}
      />

      <ScrollView
        onScroll={handleScroll}
        style={{height: '100%', backgroundColor: 'white'}}
        contentContainerStyle={{backgroundColor: 'white'}}
      >
        {!_.keys(records).length ? (
          <NoData text='Nie ma tranzakcji' />
        ) : (
          <DynamicRecordList
            records={records}
            handleNavigate={handleNavigate}
            handleScroll={handleScroll}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Records;
