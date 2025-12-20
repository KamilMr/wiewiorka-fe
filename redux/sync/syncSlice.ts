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

    dropSync: () => emptyState(),
  },
});

export const selectOperations = (state: RootState) =>
  state.sync.pendingOperations;

export const {
  addToQueue,
  clearQueue,
  clearSyncError,
  dropSync,
  incrementRetryCount,
  removeFromQueue,
  setLastSyncTimestamp,
  setOperationStatus,
  setSyncError,
  setSyncingStatus,
} = syncSlice.actions;

export {emptyState as syncEmptyState};

export default syncSlice.reducer;
