import {useRef, useState, useMemo, useCallback} from 'react';
import {View, StyleSheet, SectionList, TouchableOpacity} from 'react-native';
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
  selectBoughtItems,
  setStorageItems,
  setShopList,
  updateShopListItem,
  addShopListItem,
  removeShopListItem,
  addBoughtItem,
  removeBoughtItem,
} from '@/redux/storage/storageSlice';
import type {BoughtItem} from '@/redux/storage/storageSlice';
import Stepper from '@/components/storage/Stepper';
import {getSocket} from '@/utils/socket';
import {ShopListItem} from '@/types';
import {Button} from 'react-native-paper';

const normalize = (s: string) => s.toLowerCase().trim();

interface EnrichedShopItem extends ShopListItem {
  name: string;
  unit: string;
}

export default function ShopListScreen() {
  const t = useAppTheme();
  const dispatch = useAppDispatch();
  const storageItems = useAppSelector(selectStorageItems);
  const shopList = useAppSelector(selectShopList);
  const boughtItems = useAppSelector(selectBoughtItems);
  const [search, setSearch] = useState('');
  const [drawerText, setDrawerText] = useState('');
  const [boughtOpen, setBoughtOpen] = useState(false);
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
      };
    });
  }, [shopList, storageItems]);

  const filtered = useMemo(() => {
    if (!search) return enriched;
    const q = normalize(search);
    return enriched.filter(i => normalize(i.name).includes(q));
  }, [enriched, search]);

  const handleQuantityChange = (item: EnrichedShopItem, value: number) => {
    dispatch(updateShopListItem({id: item.id, itemNumber: value}));
    const socket = getSocket();
    if (!socket) return;
    socket.emit('shopList:update', {id: item.id, itemNumber: value}, (res: any) => {
      if (res.err) console.error('shopList:update error', res.err);
    });
  };

  const handleCheckItem = (item: EnrichedShopItem) => {
    dispatch(addBoughtItem({
      name: item.name,
      unit: item.unit,
      itemNumber: item.itemNumber,
      storageId: item.storageId,
      boughtAt: new Date().toISOString(),
    }));
    dispatch(removeShopListItem(item.id));
    const socket = getSocket();
    if (!socket) return;
    socket.emit('shopList:delete', item.id, (res: any) => {
      if (res.err) console.error('shopList:delete error', res.err);
    });
  };

  const handleUncheckBought = (index: number) => {
    const item = boughtItems[index];
    dispatch(removeBoughtItem(index));
    const socket = getSocket();
    if (!socket) return;
    const payload = item.storageId
      ? {storageId: item.storageId, itemNumber: item.itemNumber}
      : {name: item.name, itemNumber: item.itemNumber};
    socket.emit('shopList:create', payload, (res: any) => {
      if (!res.err) dispatch(addShopListItem(res.d));
      else console.error('shopList:create error', res.err);
    });
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

  const sections = useMemo(() => {
    const result = [{title: 'list', data: filtered}];
    if (boughtItems.length > 0)
      result.push({title: 'bought', data: boughtOpen ? boughtItems as any[] : []});
    return result;
  }, [filtered, boughtItems, boughtOpen]);

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
                Kupione ({boughtItems.length})
              </Text>
              <Text style={{color: t.colors.textSecondary}}>
                {boughtOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          );
          return null;
        }}
        renderItem={({item, section}) => {
          if (section.title === 'bought') {
            const bought = item as BoughtItem;
            const idx = boughtItems.indexOf(bought);
            return (
              <View>
                <View style={[styles.row, {backgroundColor: t.colors.surface, opacity: 0.6}]}>
                  <Checkbox
                    status="checked"
                    onPress={() => handleUncheckBought(idx)}
                    color={t.colors.success}
                  />
                  <Text
                    variant="bodyLarge"
                    style={[styles.boughtText, {color: t.colors.textSecondary}]}
                  >
                    {bought.name}
                  </Text>
                  <Text variant="bodySmall" style={{color: t.colors.textTertiary}}>
                    {bought.itemNumber} {bought.unit}
                  </Text>
                </View>
                <Divider />
              </View>
            );
          }
          const shopItem = item as EnrichedShopItem;
          return (
            <View>
              <View style={[styles.row, {backgroundColor: t.colors.surface}]}>
                <Checkbox
                  status="unchecked"
                  onPress={() => handleCheckItem(shopItem)}
                  color={t.colors.primary}
                />
                <Text variant="bodyLarge" style={{flex: 1}}>{shopItem.name}</Text>
                <Stepper
                  value={shopItem.itemNumber}
                  unit={shopItem.unit}
                  onChange={v => handleQuantityChange(shopItem, v)}
                  min={0}
                />
              </View>
              <Divider />
            </View>
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
          onPress={() => bottomSheetRef.current?.snapToIndex(0)}
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
        </BottomSheetView>
      </BottomSheet>
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
  drawerInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
