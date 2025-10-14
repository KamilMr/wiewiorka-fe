import {useState, useEffect} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';

import {Searchbar} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import _ from 'lodash';

import DynamicRecordList from '@/components/DynamicList';
import {NoData} from '@/components';
import {isCloseToBottom} from '@/common';
import {selectRecords} from '@/redux/main/selectors';
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
  const [filter, setFilter] = useState<string[]>([]); // category names
  const [dateRange, setDateRange] = useState<[string, string] | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize filters from route params
  useEffect(() => {
    if (params.category) setFilter([params.category]);
    if (params.dateStart && params.dateEnd)
      setDateRange([params.dateStart, params.dateEnd]);
  }, [params.category, params.dateStart, params.dateEnd]);

  const records = useAppSelector(
    selectRecords(number, {
      txt: searchQuery,
      categories: filter,
      dates: dateRange,
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

  return (
    <SafeAreaView
      style={{padding: sizes.xl, backgroundColor: t.colors.background}}
    >
      <Searchbar
        placeholder="Szukaj"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={{marginBottom: sizes.lg}}
      />
      <ScrollView onScroll={handleScroll} style={{height: '100%'}}>
        {!_.keys(records).length ? (
          <NoData />
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
