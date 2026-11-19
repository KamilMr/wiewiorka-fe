import {useState, useEffect, useMemo} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import _ from 'lodash';
import {format, isValid, parseISO} from 'date-fns';

import DynamicRecordList from '@/components/DynamicList';
import {NoData, Text} from '@/components';
import FilterDrawer, {FilterState} from '@/components/FilterDrawer';
import WarmPill from '@/components/warm/WarmPill';
import WarmCard from '@/components/warm/WarmCard';
import {formatPrice, isCloseToBottom} from '@/common';
import {selectRecords, selectCategoriesByUsage} from '@/redux/main/selectors';
import {selectMe} from '@/redux/auth/authSlice';
import {useAppSelector, usePullToRefresh} from '@/hooks';
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [typeFilter, setTypeFilter] = useState<RecordType>('all');
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    dateFrom: null,
    dateTo: null,
    holidayTag: false,
  });
  const {refreshing, onRefresh} = usePullToRefresh();

  const categoriesByUsage = useAppSelector(selectCategoriesByUsage);
  const currentUser = useAppSelector(selectMe);
  const categoryItems = useMemo(
    () =>
      [
        ...categoriesByUsage.slice(0, 3),
        ...categoriesByUsage
          .slice(3)
          .sort((a, b) => a.name.localeCompare(b.name, 'pl')),
      ].map(cat => ({
        label: cat.name,
        value: cat.name,
        color: cat.color || undefined,
      })),
    [categoriesByUsage],
  );

  const {category, dateStart, dateEnd} = params;
  useEffect(() => {
    if (typeof category === 'string' && category)
      setFilters(prev => ({...prev, categories: [category]}));
    if (typeof dateStart === 'string' && typeof dateEnd === 'string') {
      const dateFrom = parseISO(dateStart);
      const dateTo = parseISO(dateEnd);
      if (isValid(dateFrom) && isValid(dateTo)) {
        setFilters(prev => ({...prev, dateFrom, dateTo}));
      }
    }
  }, [category, dateStart, dateEnd]);

  const dateRange: [string, string] | undefined = useMemo(
    () =>
      filters.dateFrom || filters.dateTo
        ? [
            filters.dateFrom
              ? format(filters.dateFrom, 'yyyy-MM-dd')
              : '1900-01-01',
            filters.dateTo
              ? format(filters.dateTo, 'yyyy-MM-dd')
              : '2100-12-31',
          ]
        : undefined,
    [filters.dateFrom, filters.dateTo],
  );

  const recordsSearch = useMemo(
    () => ({
      txt: searchQuery,
      categories: filters.categories,
      dates: dateRange,
      holidayTag: filters.holidayTag,
    }),
    [searchQuery, filters.categories, dateRange, filters.holidayTag],
  );

  const recordsRaw = useAppSelector(state =>
    selectRecords(state, number, recordsSearch),
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
    if (filters.dateFrom)
      return `Od ${format(filters.dateFrom, 'dd MMM yyyy')}`;
    if (filters.dateTo) return `Do ${format(filters.dateTo, 'dd MMM yyyy')}`;
    return 'Wszystkie daty';
  })();

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.stickyFilters}>
        <View style={styles.filterRow}>
          <View style={styles.searchRow}>
            <FontAwesome6
              name="magnifying-glass"
              size={14}
              color={warmColors.mutedForeground}
              iconStyle="solid"
              style={styles.searchIcon}
            />
            <TextInput
              accessibilityLabel="Szukaj zapisów"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Szukaj"
              placeholderTextColor={warmColors.mutedForeground}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Wyczyść wyszukiwanie"
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtruj zapisy według daty i kategorii"
            accessibilityState={{expanded: drawerVisible}}
            onPress={() => setDrawerVisible(true)}
            style={({pressed}) => [
              styles.filterButton,
              pressed && styles.pressed,
            ]}
          >
            <FontAwesome6
              name="sliders"
              size={16}
              color={warmColors.foreground}
              iconStyle="solid"
            />
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {(filters.dateFrom || filters.dateTo) && (
          <View style={styles.dateChip}>
            <FontAwesome6
              name="calendar"
              size={14}
              color={warmColors.accentForeground}
              iconStyle="regular"
            />
            <Text style={styles.dateChipText}>{dateLabel}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Wyczyść zakres dat"
              onPress={() =>
                setFilters(prev => ({...prev, dateFrom: null, dateTo: null}))
              }
              hitSlop={8}
              style={styles.dateClear}
            >
              <FontAwesome6
                name="xmark"
                size={12}
                color={warmColors.accentForeground}
                iconStyle="solid"
              />
            </Pressable>
          </View>
        )}

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

      <ScrollView
        onScroll={handleScroll}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={warmColors.primary}
            colors={[warmColors.primary]}
          />
        }
      >
        {filters.dateFrom && filters.dateTo && (
          <WarmCard style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryLabel}>Saldo netto</Text>
                <Text style={styles.summaryNet}>{formatPrice(totals.net)}</Text>
              </View>
            </View>
            <View style={styles.summaryBottomRow}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>Przychód</Text>
                <Text
                  style={[styles.summaryCellValue, {color: warmColors.success}]}
                >
                  {formatPrice(totals.income)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>Wydatek</Text>
                <Text
                  style={[styles.summaryCellValue, {color: warmColors.danger}]}
                >
                  {formatPrice(totals.expense)}
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
            ownerAvatar={currentUser}
          />
        )}
      </ScrollView>

      <FilterDrawer
        visible={drawerVisible}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearAll={handleClearAll}
        onClose={() => setDrawerVisible(false)}
        categoryItems={categoryItems}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: warmColors.background,
  },
  pressed: {
    opacity: 0.85,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 10,
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: 14,
    backgroundColor: warmColors.cardSolid,
    borderWidth: 1,
    borderColor: warmColors.cardBorder,
    borderRadius: warmRadius.lg,
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
  filterButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: warmColors.cardSolid,
    borderWidth: 1,
    borderColor: warmColors.cardBorder,
    borderRadius: warmRadius.lg,
    ...warmShadow.sm,
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
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
  dateChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 10,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: warmColors.accent,
    borderWidth: 1,
    borderColor: warmColors.accent,
    borderRadius: warmRadius.md,
  },
  dateChipText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
    color: warmColors.accentForeground,
  },
  dateClear: {
    padding: 4,
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
