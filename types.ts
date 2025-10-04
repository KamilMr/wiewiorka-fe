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
  categories: {[key: number]: Category};
  _aggregated: AggregatedData;
  sources: {[key: string]: string[]};
  exchangeRates: Array<import('./types/nbpTypes').StoredExchangeRate>;
  devMode: boolean;
  snackbar: Snackbar;
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
