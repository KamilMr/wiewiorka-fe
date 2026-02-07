import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {StorageItem, ShopListItem} from '@/types';
import {RootState} from '../store';

export interface BoughtItem {
  name: string;
  unit: string;
  itemNumber: number;
  storageId?: string;
  boughtAt: string;
}

interface StorageState {
  items: StorageItem[];
  shopList: ShopListItem[];
  boughtItems: BoughtItem[];
}

const emptyState = (): StorageState => ({
  items: [],
  shopList: [],
  boughtItems: [],
});

export const storageSlice = createSlice({
  name: 'storage',
  initialState: emptyState(),
  reducers: {
    setStorageItems: (state, action: PayloadAction<StorageItem[]>) => {
      state.items = action.payload;
    },
    addStorageItem: (state, action: PayloadAction<StorageItem>) => {
      const idx = state.items.findIndex(i => i.id === action.payload.id);
      if (idx !== -1) Object.assign(state.items[idx], action.payload);
      else state.items.push(action.payload);
    },
    updateStorageItem: (
      state,
      action: PayloadAction<Partial<StorageItem> & {id: string}>,
    ) => {
      const idx = state.items.findIndex(i => i.id === action.payload.id);
      if (idx !== -1) Object.assign(state.items[idx], action.payload);
    },
    removeStorageItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    setShopList: (state, action: PayloadAction<ShopListItem[]>) => {
      state.shopList = action.payload;
    },
    addShopListItem: (state, action: PayloadAction<ShopListItem>) => {
      const idx = state.shopList.findIndex(i => i.id === action.payload.id);
      if (idx !== -1) Object.assign(state.shopList[idx], action.payload);
      else state.shopList.push(action.payload);
    },
    updateShopListItem: (
      state,
      action: PayloadAction<Partial<ShopListItem> & {id: number}>,
    ) => {
      const idx = state.shopList.findIndex(i => i.id === action.payload.id);
      if (idx !== -1) Object.assign(state.shopList[idx], action.payload);
    },
    removeShopListItem: (state, action: PayloadAction<number>) => {
      state.shopList = state.shopList.filter(i => i.id !== action.payload);
    },
    addBoughtItem: (state, action: PayloadAction<BoughtItem>) => {
      state.boughtItems.push(action.payload);
    },
    removeBoughtItem: (state, action: PayloadAction<number>) => {
      state.boughtItems.splice(action.payload, 1);
    },
    clearBoughtItems: (state) => {
      state.boughtItems = [];
    },
    resetStorage: () => emptyState(),
  },
});

export const selectStorageItems = (state: RootState) => state.storage.items;
export const selectShopList = (state: RootState) => state.storage.shopList;
export const selectBoughtItems = (state: RootState) => state.storage.boughtItems;

export const {
  setStorageItems,
  addStorageItem,
  updateStorageItem,
  removeStorageItem,
  setShopList,
  addShopListItem,
  updateShopListItem,
  removeShopListItem,
  addBoughtItem,
  removeBoughtItem,
  clearBoughtItems,
  resetStorage,
} = storageSlice.actions;

export {emptyState as storageEmptyState};

export default storageSlice.reducer;
