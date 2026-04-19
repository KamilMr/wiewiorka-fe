import {useState, useEffect, useMemo} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import _ from 'lodash';
import {format} from 'date-fns';

import DynamicRecordList from '@/components/DynamicList';
import {NoData, Text} from '@/components';
import FilterDrawer, {FilterState} from '@/components/FilterDrawer';
import WarmPill from '@/components/warm/WarmPill';
import {isCloseToBottom} from '@/common';
import {selectRecords, selectCategoriesByUsage} from '@/redux/main/selectors';
import {useAppSelector} from '@/hooks';
import {warmColors, warmRadius, warmShadow} from '@/constants/warmTheme';

type RecordType = 'all' | 'income' | 'expense';

const Records = () => {
  const params = useLocalSearchParams<{
    category?: string;
    dateStart?: string;
    dateEnd?: string;
  }>();

  const [number, setNumber] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [typeFilter, setTypeFilter] = useState<RecordType>('all');
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    dateFrom: null,
    dateTo: null,
    holidayTag: false,
  });

  const categoriesByUsage = useAppSelector(selectCategoriesByUsage);
  const categoryItems = categoriesByUsage.map(cat => ({
    label: cat.name,
    value: cat.name,
  }));

  useEffect(() => {
    if (params.category)
      setFilters(prev => ({
        ...prev,
        categories: [params.category!].filter(Boolean) as string[],
      }));
    if (params.dateStart && params.dateEnd)
      setFilters(prev => ({
        ...prev,
        dateFrom: new Date(params.dateStart!),
        dateTo: new Date(params.dateEnd!),
      }));
  }, [params.category, params.dateStart, params.dateEnd]);

  const dateRange: [string, string] | undefined =
    filters.dateFrom || filters.dateTo
      ? [
          filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : '1900-01-01',
          filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : '2100-12-31',
        ]
      : undefined;

  const recordsRaw = useAppSelector(state =>
    selectRecords(state, number, {
      txt: searchQuery,
      categories: filters.categories,
      dates: dateRange,
      holidayTag: filters.holidayTag,
    }),
  );

  const records = useMemo(() => {
    if (typeFilter === 'all') return recordsRaw;
    const wantExpense = typeFilter === 'expense';
    const out: typeof recordsRaw = {};
    Object.entries(recordsRaw).forEach(([dateKey, items]) => {
      const filtered = items.filter(it => !!it.exp === wantExpense);
      if (filtered.length) out[dateKey] = filtered;
    });
    return out;
  }, [recordsRaw, typeFilter]);

  const topCategories = categoriesByUsage.slice(0, 4);

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

  const toggleCategoryFilter = (name: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(name)
        ? prev.categories.filter(c => c !== name)
        : [...prev.categories, name],
    }));
  };

  const activeFilterCount =
    filters.categories.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.holidayTag ? 1 : 0);

  const dateLabel = (() => {
    if (filters.dateFrom && filters.dateTo) {
      return `${format(filters.dateFrom, 'dd MMM')} – ${format(filters.dateTo, 'dd MMM')}`;
    }
    if (filters.dateFrom) return `Od ${format(filters.dateFrom, 'dd MMM yyyy')}`;
    if (filters.dateTo) return `Do ${format(filters.dateTo, 'dd MMM yyyy')}`;
    return 'Wszystkie daty';
  })();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Zapisy</Text>
        <Pressable
          onPress={() => setSearchVisible(v => !v)}
          style={({pressed}) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <FontAwesome6
            name={searchVisible ? 'xmark' : 'magnifying-glass'}
            size={15}
            color={warmColors.foreground}
            iconStyle="solid"
          />
        </Pressable>
      </View>

      {searchVisible && (
        <View style={styles.searchRow}>
          <FontAwesome6
            name="magnifying-glass"
            size={14}
            color={warmColors.mutedForeground}
            iconStyle="solid"
            style={styles.searchIcon}
          />
          <TextInput
            autoFocus
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Szukaj"
            placeholderTextColor={warmColors.mutedForeground}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              style={styles.searchClear}
            >
              <FontAwesome6
                name="xmark"
                size={14}
                color={warmColors.mutedForeground}
                iconStyle="solid"
              />
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.stickyFilters}>
        <Pressable
          onPress={() => setDrawerVisible(true)}
          style={({pressed}) => [styles.dateBtn, pressed && styles.pressed]}
        >
          <View style={styles.dateBtnLeft}>
            <FontAwesome6
              name="calendar"
              size={15}
              color={warmColors.mutedForeground}
              iconStyle="regular"
            />
            <Text style={styles.dateBtnText}>{dateLabel}</Text>
          </View>
          <View style={styles.dateBtnRight}>
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
            <FontAwesome6
              name="chevron-down"
              size={12}
              color={warmColors.mutedForeground}
              iconStyle="solid"
            />
          </View>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          <WarmPill
            label="Wszystkie"
            active={typeFilter === 'all'}
            onPress={() => setTypeFilter('all')}
          />
          <WarmPill
            label="Przychód"
            active={typeFilter === 'income'}
            onPress={() => setTypeFilter('income')}
          />
          <WarmPill
            label="Wydatek"
            active={typeFilter === 'expense'}
            onPress={() => setTypeFilter('expense')}
          />
          {topCategories.map(cat => (
            <WarmPill
              key={cat.id}
              label={cat.name}
              dotColor={cat.color || warmColors.secondary}
              active={filters.categories.includes(cat.name)}
              onPress={() => toggleCategoryFilter(cat.name)}
            />
          ))}
        </ScrollView>
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
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {!_.keys(records).length ? (
          <NoData text="Nie ma tranzakcji" />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: warmColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: warmColors.foreground,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: warmColors.cardSolid,
    borderWidth: 1,
    borderColor: warmColors.border,
    ...warmShadow.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: warmColors.inputBackground,
    borderWidth: 1,
    borderColor: warmColors.border,
    borderRadius: warmRadius.lg,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: warmColors.foreground,
    paddingVertical: 0,
  },
  searchClear: {
    padding: 4,
  },
  stickyFilters: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: warmColors.border,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: warmColors.cardSolid,
    borderWidth: 1,
    borderColor: warmColors.border,
    borderRadius: warmRadius.lg,
  },
  dateBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBtnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: warmColors.foreground,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: warmColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: warmColors.primaryForeground,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
});

export default Records;
