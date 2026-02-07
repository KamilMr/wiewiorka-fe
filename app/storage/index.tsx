import {useRef, useState, useMemo, useCallback} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {Searchbar, Divider, Text, FAB, Badge} from 'react-native-paper';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {useAppTheme, sizes} from '@/constants/theme';
import {useFocusEffect} from 'expo-router';
import {useAppSelector, useAppDispatch} from '@/hooks';
import {selectStorageItems, selectShopList, addStorageItem, addShopListItem, setStorageItems, setShopList} from '@/redux/storage/storageSlice';
import SwipeToAdd from '@/components/storage/SwipeToAdd';
import StorageForm, {type StorageFormData} from '@/components/storage/StorageForm';
import {getSocket} from '@/utils/socket';
import {setSnackbar} from '@/redux/main/mainSlice';
import {StorageItem} from '@/types';
import { printJsonIndent } from '@/common';

const normalize = (s: string) => s.toLowerCase().trim();

export default function StorageScreen() {
  const t = useAppTheme();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectStorageItems);
  const shopList = useAppSelector(selectShopList);
  const [search, setSearch] = useState('');
  const bottomSheetRef = useRef<BottomSheet>(null);

  useFocusEffect(
    useCallback(() => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('storage:getAll', (res: any) => {
        if (!res.err) dispatch(setStorageItems(res.d));
      });
      socket.emit('shopList:getAll', (res: any) => {
        if (!res.err) dispatch(setShopList(res.d));
      });
    }, [dispatch]),
  );

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = normalize(search);
    return items.filter(i => normalize(i.name).includes(q));
  }, [items, search]);

  const handleFormSubmit = (data: StorageFormData) => {
    const socket = getSocket();
    if (!socket) return;
    const {name, unit, itemNumber} = data;
    socket.emit('storage:create', {name, unit, itemNumber}, (res: any) => {
      if (!res.err) {
        dispatch(addStorageItem(res.d));
        bottomSheetRef.current?.close();
      } else console.error('storage:create error', res.err);
    });
  };

  const handleAddToShopList = (item: StorageItem) => {
    if (inShopSet.has(item.id)) {
      dispatch(setSnackbar({msg: `${item.name} jest już na liście zakupów`, type: 'info'}));
      return;
    }
    const socket = getSocket();
    if (!socket) return;
    socket.emit(
      'shopList:create',
      {storageId: item.id, itemNumber: item.itemNumber},
      (res: any) => {
        if (!res.err) dispatch(addShopListItem(res.d));
        else console.error('shopList:create error', res.err);
      },
    );
  };

  const inShopSet = useMemo(
    () => new Set(shopList.map(s => s.storageId)),
    [shopList],
  );

  const renderItem = ({item}: {item: StorageItem}) => (
    <SwipeToAdd onAdd={() => handleAddToShopList(item)}>
      <View style={[styles.row, {backgroundColor: t.colors.surface}]}>
        <Text variant="bodyLarge" style={inShopSet.has(item.id) ? {color: t.colors.success} : undefined}>
          {item.name}
        </Text>
        <Text variant="bodyLarge" style={{color: t.colors.textSecondary}}>
          {item.itemNumber}
        </Text>
      </View>
      <Divider />
    </SwipeToAdd>
  );

  const shopListCount = shopList.length;

  return (
    <View style={[styles.root, {backgroundColor: t.colors.background}]}>
      <Searchbar
        placeholder="Szukaj"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <View style={styles.fabColumn}>
        {shopListCount > 0 && (
          <View>
            <FAB
              icon="cart"
              onPress={() => console.log('Navigate to shop list')}
              style={[styles.fab, {backgroundColor: t.colors.primary}]}
              color={t.colors.onPrimary}
              size="medium"
            />
            <Badge style={styles.badge}>{shopListCount}</Badge>
          </View>
        )}
        <FAB
          icon="plus"
          onPress={() => bottomSheetRef.current?.snapToIndex(0)}
          style={[styles.fab, {backgroundColor: t.colors.primary}]}
          color={t.colors.onPrimary}
          size="medium"
        />
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['60%']}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{backgroundColor: t.colors.surface}}
        handleIndicatorStyle={{backgroundColor: t.colors.textSecondary}}
      >
        <BottomSheetView style={styles.drawerContent}>
          <StorageForm
            onSubmit={handleFormSubmit}
            onCancel={() => bottomSheetRef.current?.close()}
          />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: sizes.xl,
  },
  search: {
    margin: sizes.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: sizes.md,
  },
  list: {
    paddingBottom: 100,
  },
  fabColumn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    gap: 12,
    alignItems: 'center',
  },
  fab: {
    borderRadius: 16,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  drawerContent: {
    padding: 20,
  },
});
