import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {SyncSlice, SyncOperation} from '@/types';
import {makeRandomId} from '@/common';
import {SYNC_CONFIG} from '@/constants/theme';
import {RootState} from '../store';
import {logError, log, setAttribute} from '@/utils/crashlytics';

const getOperationType = (path: string[]): string => {
  const pathStr = path.join('/').toLowerCase();
  if (pathStr.includes('expenses')) return 'expense';
  if (pathStr.includes('income')) return 'income';
  if (pathStr.includes('budget')) return 'budget';
  if (pathStr.includes('category/group')) return 'categoryGroup';
  if (pathStr.includes('category')) return 'category';
  if (pathStr.includes('debt')) return 'debt';
  return 'unknown';
};

const emptyState = (): SyncSlice => ({
  shouldReload: false,
  pendingOperations: [],
  isSyncing: false,
  lastSyncTimestamp: null,
  syncErrors: {},
});

const syncSlice = createSlice({
  name: 'sync',
  initialState: emptyState(),
  reducers: {
    addToQueue: (
      state,
      action: PayloadAction<
        Omit<
          SyncOperation,
          | 'id'
          | 'timestamp'
          | 'retryCount'
          | 'status'
          | 'lastAttempt'
          | 'nextRetryAt'
        >
      >,
    ) => {
      const operation: SyncOperation = {
        ...action.payload,
        id: `sync_${makeRandomId(8)}`,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      // Smart queue optimization logic
      if (operation.method === 'DELETE') {
        // DELETE and frontendId starts with f_ - remove all items from queue (unsynced item)
        if (operation.frontendId && operation.frontendId.startsWith('f_')) {
          state.pendingOperations = state.pendingOperations.filter(
            op => op.frontendId !== operation.frontendId,
          );
          // Don't add DELETE to queue - item was never synced
          return;
        }

        // DELETE overrides all [POST, PUT, DELETE] -> [DELETE]
        state.pendingOperations = state.pendingOperations.filter(
          op => op.frontendId !== operation.frontendId,
        );
        state.pendingOperations.push(operation);
      } else {
        // POST and PUT go one after another, no changes
        state.pendingOperations.push(operation);
      }
    },

    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.pendingOperations = state.pendingOperations.filter(
        op => op.id !== action.payload,
      );
      // Remove associated error if exists
      delete state.syncErrors[action.payload];
    },

    clearQueue: state => {
      state.pendingOperations = [];
      state.syncErrors = {};
    },

    setSyncingStatus: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },

    setLastSyncTimestamp: (state, action: PayloadAction<number>) => {
      state.lastSyncTimestamp = action.payload;
    },

    incrementRetryCount: (
      state,
      action: PayloadAction<{operationId: string; maxRetries?: number}>,
    ) => {
      const operation = state.pendingOperations.find(
        op => op.id === action.payload.operationId,
      );
      if (!operation) return;
      operation.retryCount += 1;
      operation.lastAttempt = Date.now();

      const maxRetries = action.payload.maxRetries || SYNC_CONFIG.MAX_RETRIES;

      if (operation.retryCount >= maxRetries) {
        operation.status = 'failed';
        operation.nextRetryAt = undefined;

        // Log permanent sync failure to Crashlytics
        const operationType = getOperationType(operation.path);
        log(`Sync permanently failed: ${operationType} ${operation.method}`);
        setAttribute('failedOperationId', operation.id);
        setAttribute('failedOperationType', operationType);
        setAttribute('failedOperationPath', operation.path.join('/'));
        setAttribute('failedOperationMethod', operation.method);
        setAttribute('failedRetryCount', String(operation.retryCount));
        if (operation.frontendId)
          setAttribute('failedFrontendId', operation.frontendId);
        logError(
          new Error(
            `Sync failed after ${maxRetries} retries: ${operationType} ${operation.method} ${operation.path.join('/')}`,
          ),
          'syncSlice:maxRetriesExceeded',
        );
      } else {
        operation.status = 'retrying';
        // Fixed 3-minute delay for all retries
        const delay = SYNC_CONFIG.RETRY_DELAY;

        operation.nextRetryAt = Date.now() + delay;
      }
    },

    setOperationStatus: (
      state,
      action: PayloadAction<{
        operationId: string;
        status: SyncOperation['status'];
      }>,
    ) => {
      const operation = state.pendingOperations.find(
        op => op.id === action.payload.operationId,
      );
      if (!operation) return;
      operation.status = action.payload.status;
      if (action.payload.status === 'processing')
        operation.lastAttempt = Date.now();
    },

    setSyncError: (
      state,
      action: PayloadAction<{operationId: string; error: string}>,
    ) => {
      state.syncErrors[action.payload.operationId] = action.payload.error;
    },

    clearSyncError: (state, action: PayloadAction<string>) => {
      delete state.syncErrors[action.payload];
    },

    retryOperation: (state, action: PayloadAction<string>) => {
      const operation = state.pendingOperations.find(
        op => op.id === action.payload,
      );
      if (!operation || operation.status !== 'failed') return;

      operation.status = 'pending';
      operation.retryCount = 0;
      operation.nextRetryAt = undefined;
      operation.lastAttempt = undefined;
      delete state.syncErrors[action.payload];
    },

    retryAllFailed: state => {
      state.pendingOperations.forEach(op => {
        if (op.status === 'failed') {
          op.status = 'pending';
          op.retryCount = 0;
          op.nextRetryAt = undefined;
          op.lastAttempt = undefined;
          delete state.syncErrors[op.id];
        }
      });
    },

    discardOperation: (state, action: PayloadAction<string>) => {
      const operation = state.pendingOperations.find(op => op.id === action.payload);
      if (!operation || operation.status !== 'failed') return;

      state.pendingOperations = state.pendingOperations.filter(op => op.id !== action.payload);
      delete state.syncErrors[action.payload];
    },

    discardAllFailed: state => {
      const failedIds = state.pendingOperations
        .filter(op => op.status === 'failed')
        .map(op => op.id);
      state.pendingOperations = state.pendingOperations.filter(
        op => op.status !== 'failed',
      );
      failedIds.forEach(id => delete state.syncErrors[id]);
    },

    // Dev-only: Add test failed operations
    addTestFailedOperations: state => {
      if (!__DEV__) return;

      const testOperations: SyncOperation[] = [
        {
          id: `test_${makeRandomId(8)}`,
          path: ['main', 'expenses'],
          method: 'POST',
          data: {price: 150, category: 'Zakupy'},
          timestamp: Date.now() - 3600000,
          retryCount: 3,
          handler: 'genericSync',
          frontendId: `f_test1`,
          status: 'failed',
        },
        {
          id: `test_${makeRandomId(8)}`,
          path: ['main', 'income'],
          method: 'POST',
          data: {price: 5000, source: 'Wypłata'},
          timestamp: Date.now() - 86400000,
          retryCount: 3,
          handler: 'genericSync',
          frontendId: `f_test2`,
          status: 'failed',
        },
        {
          id: `test_${makeRandomId(8)}`,
          path: ['main', 'expenses', '123'],
          method: 'PUT',
          data: {price: 200},
          timestamp: Date.now() - 172800000,
          retryCount: 3,
          handler: 'genericSync',
          frontendId: `123`,
          status: 'failed',
        },
        {
          id: `test_${makeRandomId(8)}`,
          path: ['main', 'income', '456'],
          method: 'DELETE',
          timestamp: Date.now() - 259200000,
          retryCount: 3,
          handler: 'genericSync',
          frontendId: `456`,
          status: 'failed',
        },
      ];

      testOperations.forEach(op => {
        state.pendingOperations.push(op);
        state.syncErrors[op.id] = 'Test error: Network request failed';
      });
    },

    dropSync: () => emptyState(),
  },
});

export const selectOperations = (state: RootState) =>
  state.sync.pendingOperations;

export const selectFailedOperations = (state: RootState) =>
  state.sync.pendingOperations.filter(op => op.status === 'failed');

export const selectFailedOperationsCount = (state: RootState) =>
  state.sync.pendingOperations.filter(op => op.status === 'failed').length;

export const {
  addTestFailedOperations,
  addToQueue,
  clearQueue,
  clearSyncError,
  discardAllFailed,
  discardOperation,
  dropSync,
  incrementRetryCount,
  removeFromQueue,
  retryAllFailed,
  retryOperation,
  setLastSyncTimestamp,
  setOperationStatus,
  setSyncError,
  setSyncingStatus,
} = syncSlice.actions;

export {emptyState as syncEmptyState};

export default syncSlice.reducer;
