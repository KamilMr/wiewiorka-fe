import {useState} from 'react';
import {useLocalSearchParams} from 'expo-router';

import {NativeScrollEvent, NativeSyntheticEvent, View} from 'react-native';
import _ from 'lodash';

import DynamicRecordList from '@/components/DynamicList';
import {isCloseToBottom} from '@/common';
import {selectRecords} from '@/redux/main/selectors';
import {useAppSelector} from '@/hooks';
import {useAppTheme} from '@/constants/theme';

const TransactionList = () => {
  const [number, setNumber] = useState(30);
  const params: {category: string; dates: string} = useLocalSearchParams();
  const dates = params.dates.split(',').slice(0, 2);
  const records = useAppSelector(state =>
    selectRecords(state, number, {
      txt: '',
      categories: [params.category],
      dates: [dates[0], dates[1]],
    }),
  );
  const t = useAppTheme();

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

  return (
    <View style={{padding: 16, backgroundColor: t.colors.white, flex: 1}}>
      <DynamicRecordList records={records} handleScroll={handleScroll} />
    </View>
  );
};

export default TransactionList;
