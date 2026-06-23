import {useRef, useState, useMemo, useCallback, useEffect} from 'react';
import _ from 'lodash';
import {View, StyleSheet, SectionList, TouchableOpacity, Pressable} from 'react-native';
import {Searchbar, Divider, Text, FAB, Checkbox} from 'react-native-paper';
import BottomSheet, {
  BottomSheetView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {useFocusEffect, router} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
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
  updateStorageItem,
} from '@/redux/storage/storageSlice';
import SwipeableRow from '@/components/storage/SwipeToAdd';
import CustomModal from '@/components/CustomModal';
import Stepper from '@/components/storage/Stepper';
import {getSocket} from '@/utils/socket';
import {setSnackbar} from '@/redux/main/mainSlice';
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
  const insets = useSafeAreaInsets();
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
  const [deleting, setDeleting] = useState(false);
  const [renameChoice, setRenameChoice] = useState<{item: EnrichedShopItem; name: string; quantity: number} | null>(null);
  const [fabBottom, setFabBottom] = useState<number | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (fabBottom !== null) return;
    if (insets.bottom > 0) {
      setFabBottom(16 + insets.bottom);
      return;
    }
    const timeout = setTimeout(() => setFabBottom(16 + insets.bottom), 250);
    return () => clearTimeout(timeout);
  }, [fabBottom, insets.bottom]);

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
    }).sort((a, b) => a.name.localeCompare(b.name));
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

  const debouncedQuantityEmit = useRef(
    _.debounce((id: number, value: number) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('shopList:update', {id, itemNumber: value}, (res: any) => {
        if (res.err) dispatch(setSnackbar({msg: 'Nie udało się zmienić ilości', type: 'error'}));
      });
    }, 500),
  ).current;

  useEffect(() => () => debouncedQuantityEmit.cancel(), [debouncedQuantityEmit]);

  const handleQuantityChange = (item: EnrichedShopItem, value: number) => {
    dispatch(updateShopListItem({id: item.id, itemNumber: value}));
    debouncedQuantityEmit(item.id, value);
  };

  const handleCheckItem = (item: EnrichedShopItem) => {
    const socket = getSocket();
    if (!socket) return;
    const boughtAt = new Date().toISOString();
    dispatch(updateShopListItem({id: item.id, boughtAt}));
    socket.emit('shopList:update', {id: item.id, boughtAt}, (res: any) => {
      if (!res.err) dispatch(updateShopListItem(res.d));
      else dispatch(setSnackbar({msg: 'Nie udało się oznaczyć jako kupione', type: 'error'}));
    });
  };

  const handleUncheckBought = (item: EnrichedShopItem) => {
    const socket = getSocket();
    if (!socket) return;
    dispatch(updateShopListItem({id: item.id, boughtAt: null}));
    socket.emit('shopList:update', {id: item.id, boughtAt: null}, (res: any) => {
      if (!res.err) dispatch(updateShopListItem(res.d));
      else dispatch(setSnackbar({msg: 'Nie udało się cofnąć zakupu', type: 'error'}));
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteItem) return;
    const socket = getSocket();
    if (!socket) return;
    setDeleting(true);
    socket.emit('shopList:delete', {id: deleteItem.id}, (res: any) => {
      setDeleting(false);
      if (!res.err) {
        dispatch(removeShopListItem(deleteItem.id));
        setDeleteItem(null);
      } else dispatch(setSnackbar({msg: 'Nie udało się usunąć', type: 'error'}));
    });
  };

  const handleDrawerSubmit = () => {
    const items = drawerText
      .split(/[,\n]/)
      .map(i => i.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    const socket = getSocket();
    if (!socket) return;
    items.forEach(name => {
      socket.emit('shopList:create', {name, itemNumber: 1}, (res: any) => {
        if (!res.err) dispatch(addShopListItem(res.d));
        else dispatch(setSnackbar({msg: `Nie udało się dodać "${name}"`, type: 'error'}));
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
    const nameChanged = trimmed !== editingItem.name;
    if (nameChanged && editingItem.storageId) {
      setRenameChoice({item: editingItem, name: trimmed, quantity: editQuantity});
      bottomSheetRef.current?.close();
      return;
    }
    submitShopListEdit(editingItem, trimmed, editQuantity);
  };

  const submitShopListEdit = (item: EnrichedShopItem, name: string, quantity: number) => {
    dispatch(updateShopListItem({id: item.id, itemNumber: quantity, name}));
    const socket = getSocket();
    if (!socket) return;
    socket.emit('shopList:update', {id: item.id, itemNumber: quantity, name}, (res: any) => {
      if (res.err) dispatch(setSnackbar({msg: 'Nie udało się zaktualizować', type: 'error'}));
    });
    bottomSheetRef.current?.close();
    setEditingItem(null);
  };

  const handleRenameStorage = () => {
    if (!renameChoice) return;
    const {item, name, quantity} = renameChoice;
    submitShopListEdit(item, name, quantity);
    dispatch(updateStorageItem({id: item.storageId!, name}));
    const socket = getSocket();
    if (!socket) return;
    socket.emit('storage:update', {id: item.storageId, name}, (res: any) => {
      if (res.err) dispatch(setSnackbar({msg: 'Nie udało się zmienić nazwy w magazynie', type: 'error'}));
    });
    setRenameChoice(null);
  };

  const handleRenameUnlink = () => {
    if (!renameChoice) return;
    const {item, name, quantity} = renameChoice;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('shopList:delete', {id: item.id}, (res: any) => {
      if (!res.err) {
        dispatch(removeShopListItem(item.id));
        socket.emit('shopList:create', {name, itemNumber: quantity}, (createRes: any) => {
          if (!createRes.err) dispatch(addShopListItem(createRes.d));
          else dispatch(setSnackbar({msg: 'Usunięto, ale nie udało się utworzyć nowego', type: 'error'}));
        });
      } else dispatch(setSnackbar({msg: 'Nie udało się odłączyć', type: 'error'}));
    });
    bottomSheetRef.current?.close();
    setEditingItem(null);
    setRenameChoice(null);
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

      {fabBottom !== null && <View style={[styles.fabColumn, {bottom: fabBottom}]}>
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
      </View>}

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
        loading={deleting}
      />

      <CustomModal
        visible={!!renameChoice}
        title="Zmiana nazwy"
        content={
          <View style={styles.renameActions}>
            <Text variant="bodyMedium">
              Ten produkt jest powiązany z magazynem. Co chcesz zrobić?
            </Text>
            <Button mode="contained" onPress={handleRenameStorage}>
              Zmień też w magazynie
            </Button>
            <Button mode="outlined" onPress={handleRenameUnlink}>
              Utwórz nowy (odłącz)
            </Button>
            <Button onPress={() => setRenameChoice(null)}>
              Anuluj
            </Button>
          </View>
        }
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
  renameActions: {
    gap: 12,
  },
});
