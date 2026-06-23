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
import WarmCard from '@/components/warm/WarmCard';
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

  const totals = useMemo(() => {
    if (!filters.dateFrom || !filters.dateTo) {
      return {income: 0, expense: 0, net: 0};
    }

    let income = 0;
    let expense = 0;
    Object.values(records).forEach(items => {
      items.forEach(it => {
        const price = Number(it.price) || 0;
        if (it.exp) expense += price;
        else income += price;
      });
    });
    return {income, expense, net: income - expense};
  }, [records, filters.dateFrom, filters.dateTo]);

  const formatPLN = (n: number) =>
    `${n < 0 ? '-' : ''}${Math.abs(n).toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} zł`;

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
      params: {
        id,
        type: isExpense ? 'expense' : 'income',
        returnTo: '/(tabs)/records',
        returnCategory: params.category || '',
        returnDateStart: params.dateStart || '',
        returnDateEnd: params.dateEnd || '',
      },
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
      return `${format(filters.dateFrom, 'dd MMM')} - ${format(filters.dateTo, 'dd MMM')}`;
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
        {filters.dateFrom && filters.dateTo && (
          <WarmCard style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryLabel}>Saldo netto</Text>
                <Text style={styles.summaryNet}>{formatPLN(totals.net)}</Text>
              </View>
            </View>
            <View style={styles.summaryBottomRow}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>Przychód</Text>
                <Text style={[styles.summaryCellValue, {color: warmColors.success}]}> 
                  {formatPLN(totals.income)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>Wydatek</Text>
                <Text style={[styles.summaryCellValue, {color: warmColors.danger}]}> 
                  {formatPLN(totals.expense)}
                </Text>
              </View>
            </View>
          </WarmCard>
        )}

        {!_.keys(records).length ? (
          <NoData text="Nie ma tranzakcji" />
        ) : (
          <DynamicRecordList
            records={records}
            handleNavigate={handleNavigate}
            handleScroll={handleScroll}
            scrollEnabled={false}
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
    borderColor: warmColors.cardBorder,
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
    backgroundColor: warmColors.cardSolid,
    borderWidth: 1,
    borderColor: warmColors.cardBorder,
    borderRadius: warmRadius.lg,
    paddingHorizontal: 14,
    height: 44,
    ...warmShadow.sm,
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
    borderBottomColor: warmColors.cardBorder,
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
    borderColor: warmColors.cardBorder,
    borderRadius: warmRadius.lg,
    ...warmShadow.sm,
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
  summaryCard: {
    marginBottom: 20,
  },
  summaryTopRow: {
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: warmColors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryNet: {
    fontSize: 28,
    fontWeight: '700',
    color: warmColors.foreground,
    lineHeight: 32,
  },
  summaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: warmColors.cardBorder,
  },
  summaryCell: {
    flex: 1,
  },
  summaryCellLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: warmColors.mutedForeground,
    marginBottom: 4,
  },
  summaryCellValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: warmColors.cardBorder,
    marginHorizontal: 12,
  },
});

export default Records;
