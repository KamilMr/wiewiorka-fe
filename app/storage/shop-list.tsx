import {useRef, useState, useMemo, useCallback} from 'react';
import {View, StyleSheet, SectionList, TouchableOpacity, Pressable} from 'react-native';
import {Searchbar, Divider, Text, FAB, Checkbox} from 'react-native-paper';
import BottomSheet, {
  BottomSheetView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {useFocusEffect, router} from 'expo-router';
import {useAppTheme, sizes} from '@/constants/theme';
import {useAppSelector, useAppDispatch} from '@/hooks';
import {
  selectStorageItems,
  selectShopList,
  setStorageItems,
  setShopList,
  updateShopListItem,
  addShopListItem,
  removeShopListItem,
} from '@/redux/storage/storageSlice';
import SwipeableRow from '@/components/storage/SwipeToAdd';
import CustomModal from '@/components/CustomModal';
import Stepper from '@/components/storage/Stepper';
import {getSocket} from '@/utils/socket';
import {ShopListItem} from '@/types';
import {Button} from 'react-native-paper';

const normalize = (s: string) => s.toLowerCase().trim();

interface EnrichedShopItem extends ShopListItem {
  name: string;
  unit: string;
  step: number;
}

export default function ShopListScreen() {
  const t = useAppTheme();
  const dispatch = useAppDispatch();
  const storageItems = useAppSelector(selectStorageItems);
  const shopList = useAppSelector(selectShopList);
  const [search, setSearch] = useState('');
  const [drawerText, setDrawerText] = useState('');
  const [editingItem, setEditingItem] = useState<EnrichedShopItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [boughtOpen, setBoughtOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<EnrichedShopItem | null>(null);
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

  const enriched = useMemo(() => {
    const storageMap = new Map(storageItems.map(s => [s.id, s]));
    return shopList.map(item => {
      const storage = item.storageId ? storageMap.get(item.storageId) : undefined;
      return {
        ...item,
        name: storage?.name ?? item.name ?? '—',
        unit: storage?.unit ?? '',
        step: storage?.step ?? 1,
      };
    });
  }, [shopList, storageItems]);

  const activeItems = useMemo(() => {
    const notBought = enriched.filter(i => !i.boughtAt);
    if (!search) return notBought;
    const q = normalize(search);
    return notBought.filter(i => normalize(i.name).includes(q));
  }, [enriched, search]);

  const boughtList = useMemo(
    () => enriched.filter(i =>i.boughtAt && i.boughtAt !== null),
    [enriched],
  );

  const handleQuantityChange = (item: EnrichedShopItem, value: number) => {
    dispatch(updateShopListItem({id: item.id, itemNumber: value}));
    const socket = getSocket();
    if (!socket) return;
    socket.emit('shopList:update', {id: item.id, itemNumber: value}, (res: any) => {
      if (res.err) console.error('shopList:update error', res.err);
    });
  };

  const handleCheckItem = (item: EnrichedShopItem) => {
    const socket = getSocket();
    if (!socket) return;
    const boughtAt = new Date().toISOString();
    dispatch(updateShopListItem({id: item.id, boughtAt}));
    socket.emit('shopList:update', {id: item.id, boughtAt}, (res: any) => {
      if (!res.err) dispatch(updateShopListItem(res.d));
      else console.error('shopList:update error', res.err);
    });
  };

  const handleUncheckBought = (item: EnrichedShopItem) => {
    const socket = getSocket();
    if (!socket) return;
    dispatch(updateShopListItem({id: item.id, boughtAt: null}));
    socket.emit('shopList:update', {id: item.id, boughtAt: null}, (res: any) => {
      if (!res.err) dispatch(updateShopListItem(res.d));
      else console.error('shopList:update error', res.err);
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteItem) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('shopList:delete', {id: deleteItem.id}, (res: any) => {
      if (!res.err) dispatch(removeShopListItem(deleteItem.id));
      else console.error('shopList:delete error', res.err);
    });
    setDeleteItem(null);
  };

  const handleDrawerSubmit = () => {
    const items = drawerText
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    const socket = getSocket();
    if (!socket) return;
    items.forEach(name => {
      socket.emit('shopList:create', {name, itemNumber: 1}, (res: any) => {
        if (!res.err) dispatch(addShopListItem(res.d));
        else console.error('shopList:create error', res.err);
      });
    });
    setDrawerText('');
    bottomSheetRef.current?.close();
  };

  const openEdit = (item: EnrichedShopItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditQuantity(item.itemNumber);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const openCreate = () => {
    setEditingItem(null);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleEditSubmit = () => {
    if (!editingItem) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    dispatch(updateShopListItem({id: editingItem.id, itemNumber: editQuantity, name: trimmed}));
    const socket = getSocket();
    if (!socket) return;
    socket.emit('shopList:update', {id: editingItem.id, itemNumber: editQuantity, name: trimmed}, (res: any) => {
      if (res.err) console.error('shopList:update error', res.err);
    });
    bottomSheetRef.current?.close();
    setEditingItem(null);
  };

  const sections = useMemo(() => {
    const result: {title: string; data: EnrichedShopItem[]}[] = [{title: 'list', data: activeItems}];
    if (boughtList.length > 0)
      result.push({title: 'bought', data: boughtOpen ? boughtList : []});
    return result;
  }, [activeItems, boughtList, boughtOpen]);

  return (
    <View style={[styles.root, {backgroundColor: t.colors.background}]}>
      <Searchbar
        placeholder="Szukaj"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id?.toString() ?? `bought-${index}`}
        renderSectionHeader={({section}) => {
          if (section.title === 'bought') return (
            <TouchableOpacity
              onPress={() => setBoughtOpen(prev => !prev)}
              style={[styles.boughtHeader, {backgroundColor: t.colors.surfaceVariant}]}
            >
              <Text variant="titleSmall" style={{color: t.colors.textSecondary}}>
                Kupione ({boughtList.length})
              </Text>
              <Text style={{color: t.colors.textSecondary}}>
                {boughtOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          );
          return null;
        }}
        renderItem={({item, section}) => {
          if (section.title === 'bought') return (
            <SwipeableRow onDelete={() => setDeleteItem(item)}>
              <View style={[styles.row, {backgroundColor: t.colors.surface, opacity: 0.6}]}>
                <Checkbox
                  status="checked"
                  onPress={() => handleUncheckBought(item)}
                  color={t.colors.success}
                />
                <Text
                  variant="bodyLarge"
                  style={[styles.boughtText, {color: t.colors.textSecondary}]}
                >
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={{color: t.colors.textTertiary}}>
                  {item.itemNumber} {item.unit}
                </Text>
              </View>
              <Divider />
            </SwipeableRow>
          );
          const shopItem = item;
          return (
            <SwipeableRow onDelete={() => setDeleteItem(shopItem)}>
              <View style={[styles.row, {backgroundColor: t.colors.surface}]}>
                <Checkbox
                  status="unchecked"
                  onPress={() => handleCheckItem(shopItem)}
                  color={t.colors.primary}
                />
                <Pressable onPress={() => openEdit(shopItem)} style={{flex: 1}}>
                  <Text variant="bodyLarge">{shopItem.name}</Text>
                </Pressable>
                <Stepper
                  value={shopItem.itemNumber}
                  unit={shopItem.unit}
                  step={shopItem.step}
                  onChange={v => handleQuantityChange(shopItem, v)}
                  min={0}
                />
              </View>
              <Divider />
            </SwipeableRow>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={{color: t.colors.textSecondary}}>
              Lista zakupów jest pusta
            </Text>
          </View>
        }
      />

      <View style={styles.fabColumn}>
        <FAB
          icon="format-list-numbered"
          onPress={() => router.back()}
          style={[styles.fab, {backgroundColor: t.colors.primary}]}
          color={t.colors.onPrimary}
          size="medium"
        />
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
        snapPoints={['35%']}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{backgroundColor: t.colors.surface}}
        handleIndicatorStyle={{backgroundColor: t.colors.textSecondary}}
      >
        <BottomSheetView style={styles.drawerContent}>
          {editingItem ? (
            <>
              <BottomSheetTextInput
                value={editName}
                onChangeText={setEditName}
                style={[
                  styles.drawerInput,
                  {backgroundColor: t.colors.surfaceVariant, color: t.colors.textPrimary, minHeight: 0},
                ]}
                placeholderTextColor={t.colors.textTertiary}
                placeholder="Nazwa"
              />
              <View style={styles.editStepperRow}>
                <Text variant="bodyLarge" style={{color: t.colors.textPrimary}}>
                  Ilość
                </Text>
                <Stepper
                  value={editQuantity}
                  unit={editingItem.unit}
                  onChange={setEditQuantity}
                  min={0}
                />
              </View>
              <View style={styles.editButtons}>
                <Button mode="outlined" onPress={() => {
                  bottomSheetRef.current?.close();
                  setEditingItem(null);
                }}>
                  Przerwij
                </Button>
                <Button mode="contained" onPress={handleEditSubmit}>
                  Zapisz
                </Button>
              </View>
            </>
          ) : (
            <>
              <BottomSheetTextInput
                placeholder="kminek, mleko, gruszki 2kg, chleb"
                value={drawerText}
                onChangeText={setDrawerText}
                multiline
                numberOfLines={3}
                style={[
                  styles.drawerInput,
                  {backgroundColor: t.colors.surfaceVariant, color: t.colors.textPrimary},
                ]}
                placeholderTextColor={t.colors.textTertiary}
              />
              <Button mode="contained" onPress={handleDrawerSubmit}>
                Dodaj
              </Button>
            </>
          )}
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
  },
  search: {
    margin: sizes.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: sizes.md,
  },
  list: {
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  boughtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: sizes.md,
    marginTop: sizes.lg,
  },
  boughtText: {
    flex: 1,
    textDecorationLine: 'line-through',
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
  drawerContent: {
    padding: 20,
    gap: 12,
  },
  editStepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sizes.sm,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: sizes.sm,
  },
  drawerInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
