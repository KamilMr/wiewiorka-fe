import {useState} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import {router} from 'expo-router';

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
  const [number, setNumber] = useState(30);
  // const [openFilter, setOpenFilter] = useState(false);
  const [filter, setFilter] = useState([]); // [txt, categoryid]
  const [searchQuery, setSearchQuery] = useState('');
  const records = useAppSelector(
    selectRecords(number, {txt: searchQuery, categories: filter}),
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
