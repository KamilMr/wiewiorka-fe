import {useRef, useState, useMemo, useCallback} from 'react';
import {View, StyleSheet, FlatList, Pressable} from 'react-native';
import {Searchbar, Divider, Text, FAB, Badge} from 'react-native-paper';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {useAppTheme, sizes} from '@/constants/theme';
import {useFocusEffect, router} from 'expo-router';
import {useAppSelector, useAppDispatch} from '@/hooks';
import {selectStorageItems, selectShopList, addStorageItem, updateStorageItem, addShopListItem, removeStorageItem, setStorageItems, setShopList} from '@/redux/storage/storageSlice';
import SwipeableRow from '@/components/storage/SwipeToAdd';
import CustomModal from '@/components/CustomModal';
import StorageForm, {type StorageFormData} from '@/components/storage/StorageForm';
import {getSocket} from '@/utils/socket';
import {setSnackbar} from '@/redux/main/mainSlice';
import {StorageItem} from '@/types';

const normalize = (s: string) => s.toLowerCase().trim();

export default function StorageScreen() {
  const t = useAppTheme();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectStorageItems);
  const shopList = useAppSelector(selectShopList);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<StorageItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<StorageItem | null>(null);
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

  const openEdit = (item: StorageItem) => {
    setEditingItem(item);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const openCreate = () => {
    setEditingItem(null);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleFormSubmit = (data: StorageFormData) => {
    const socket = getSocket();
    if (!socket) return;

    if (editingItem) {
      socket.emit('storage:update', {id: editingItem.id, ...data}, (res: any) => {
        if (!res.err) {
          dispatch(updateStorageItem(res.d));
          bottomSheetRef.current?.close();
          setEditingItem(null);
        } else console.error('storage:update error', res.err);
      });
    } else {
      socket.emit('storage:create', data, (res: any) => {
        if (!res.err) {
          dispatch(addStorageItem(res.d));
          bottomSheetRef.current?.close();
        } else console.error('storage:create error', res.err);
      });
    }
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
      {storageId: item.id, itemNumber: item.step},
      (res: any) => {
        if (!res.err) dispatch(addShopListItem(res.d));
        else console.error('shopList:create error', res.err);
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteItem) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('storage:delete', {id: deleteItem.id}, (res: any) => {
      if (!res.err) dispatch(removeStorageItem(deleteItem.id));
      else console.error('storage:delete error', res.err);
    });
    setDeleteItem(null);
  };

  const inShopSet = useMemo(
    () => new Set(shopList.filter(s => !s.boughtAt).map(s => s.storageId)),
    [shopList],
  );

  const renderItem = ({item}: {item: StorageItem}) => (
    <SwipeableRow onAdd={() => handleAddToShopList(item)} onDelete={() => setDeleteItem(item)}>
      <Pressable onPress={() => openEdit(item)}>
        <View style={[styles.row, {backgroundColor: t.colors.surface}]}>
          <Text variant="bodyLarge" style={inShopSet.has(item.id) ? {color: t.colors.success} : undefined}>
            {item.name}
          </Text>
          <Text variant="bodyLarge" style={{color: t.colors.textSecondary}}>
            {item.itemNumber} {item.unit}
          </Text>
        </View>
      </Pressable>
      <Divider />
    </SwipeableRow>
  );

  const shopListCount = shopList.filter(s => !s.boughtAt).length;

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
        <View>
          <FAB
            icon="cart"
            onPress={() => router.push('/storage/shop-list')}
            style={[styles.fab, {backgroundColor: t.colors.primary}]}
            color={t.colors.onPrimary}
            size="medium"
          />
          {shopListCount > 0 && <Badge style={styles.badge}>{shopListCount}</Badge>}
        </View>
        <FAB
          icon="plus"
          onPress={openCreate}
          style={[styles.fab, {backgroundColor: t.colors.primary}]}
          color={t.colors.onPrimary}
          size="medium"
        />
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['80%']}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{backgroundColor: t.colors.surface}}
        handleIndicatorStyle={{backgroundColor: t.colors.textSecondary}}
      >
        <BottomSheetView style={styles.drawerContent}>
          <StorageForm
            key={editingItem?.id ?? 'new'}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              bottomSheetRef.current?.close();
              setEditingItem(null);
            }}
            initial={editingItem ?? undefined}
          />
        </BottomSheetView>
      </BottomSheet>

      <CustomModal
        visible={!!deleteItem}
        title="Potwierdź usunięcie"
        content={`Czy na pewno chcesz usunąć "${deleteItem?.name}"?`}
        onApprove={handleDeleteConfirm}
        onDismiss={() => setDeleteItem(null)}
      />
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
