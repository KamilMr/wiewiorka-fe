import {AggregatedData, BudgetMainSlice as MonthlyBudget} from '@/utils/types';

export interface AuthSlice {
  name: string;
  email: string;
  token: string;
  id: string;
  houses: [string];
}

export type Snackbar = {
  open: boolean;
  type: string;
  msg: string;
  time?: number;
};

export interface Income {
  id: number;
  date: string;
  price: number;
  source: string;
  ownerId: number;
  vat: number;
  houseId: string;
  description: string;
  owner: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface Debt {
  id: string;
  personName: string;
  totalAmount: number;
  description: string | null;
  ownerId: number;
  houseId: string | null;
  createdAt: string;
  updatedAt: string | null;
  payments: DebtPayment[];
}

export interface Expense {
  id: number | string;
  description: string | null;
  date: string;
  price: number;
  categoryId: number;
  category: string;
  image: string;
  houseId: string;
  owner: string;
  tags?: string[];
}

export interface ExpenseMore {
  categoryName: string;
  isExp: boolean;
}

export type Owner = 'house' | 'user';
export type OwnerId = string | number;

export interface Subcategory {
  id: number;
  name: string;
  color: string;
  groupId: number;
  groupName?: string;
  owner: Owner;
  ownerId: OwnerId;
}

export interface Category {
  subcategories: Subcategory[];
  name: string;
  color: string;
}

export interface MainSlice {
  status: 'idle' | 'fetching';
  expenses: Array<Expense>;
  budgets: Array<MonthlyBudget>;
  incomes: Array<Income>;
  debts: Array<Debt>;
  categories: {[key: number]: Category};
  _aggregated: AggregatedData;
  sources: {[key: string]: string[]};
  exchangeRates: Array<import('./types/nbpTypes').StoredExchangeRate>;
  bidAskExchangeRates?: Array<import('./types/nbpTypes').StoredBidAskExchangeRate>;
  devMode: boolean;
  snackbar: Snackbar;
}

export interface StorageItem {
  id: string;
  pantryId: string;
  name: string;
  itemNumber: number;
  minValue: number;
  step: number;
  unit: string;
}

export interface ShopListItem {
  id: number;
  pantryId: string;
  storageId?: string;
  name?: string;
  itemNumber: number;
  boughtAt: string | null;
}

export interface SyncOperation {
  id: string;
  path: string[];
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  cb?: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  handler: string;
  frontendId?: string;
  status: 'pending' | 'processing' | 'retrying' | 'failed';
  lastAttempt?: number;
  nextRetryAt?: number;
}

export interface SyncSlice {
  pendingOperations: SyncOperation[];
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
  syncErrors: {[operationId: string]: string};
  shouldReload: boolean;
}
