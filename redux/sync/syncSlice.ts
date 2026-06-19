import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {SyncSlice, SyncOperation, SyncLogEntry} from '@/types';
import {makeRandomId} from '@/common';
import {SYNC_CONFIG} from '@/constants/theme';
import {RootState} from '../store';
import {logError, log, setAttribute} from '@/utils/crashlytics';

const MAX_SYNC_LOGS = 100;

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

const pushSyncLog = (
  state: SyncSlice,
  entry: Omit<SyncLogEntry, 'id' | 'timestamp'> & {timestamp?: number},
) => {
  if (!state.syncLogs) state.syncLogs = [];

  state.syncLogs.unshift({
    id: `log_${makeRandomId(8)}`,
    timestamp: entry.timestamp ?? Date.now(),
    ...entry,
  });

  if (state.syncLogs.length > MAX_SYNC_LOGS) {
    state.syncLogs.length = MAX_SYNC_LOGS;
  }
};

const getOperationSummary = (operation: SyncOperation) =>
  `${operation.method} ${operation.path.join('/')}`;

const emptyState = (): SyncSlice => ({
  shouldReload: false,
  pendingOperations: [],
  isSyncing: false,
  lastSyncTimestamp: null,
  syncErrors: {},
  syncLogs: [],
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
          const removedCount = state.pendingOperations.filter(
            op => op.frontendId === operation.frontendId,
          ).length;

          state.pendingOperations = state.pendingOperations.filter(
            op => op.frontendId !== operation.frontendId,
          );

          pushSyncLog(state, {
            level: 'info',
            message: `Skipped DELETE for unsynced item and removed ${removedCount} queued operation(s)`,
            operationId: operation.id,
            path: operation.path,
            method: operation.method,
            status: operation.status,
            frontendId: operation.frontendId,
          });
          // Don't add DELETE to queue - item was never synced
          return;
        }

        const removedCount = state.pendingOperations.filter(
          op => op.frontendId === operation.frontendId,
        ).length;

        // DELETE overrides all [POST, PUT, DELETE] -> [DELETE]
        state.pendingOperations = state.pendingOperations.filter(
          op => op.frontendId !== operation.frontendId,
        );
        state.pendingOperations.push(operation);

        pushSyncLog(state, {
          level: removedCount > 0 ? 'warning' : 'info',
          message: `Queued ${getOperationSummary(operation)}${
            removedCount > 0 ? ` and replaced ${removedCount} operation(s)` : ''
          }`,
          operationId: operation.id,
          path: operation.path,
          method: operation.method,
          status: operation.status,
          frontendId: operation.frontendId,
        });
      } else {
        // POST and PUT go one after another, no changes
        state.pendingOperations.push(operation);

        pushSyncLog(state, {
          level: 'info',
          message: `Queued ${getOperationSummary(operation)}`,
          operationId: operation.id,
          path: operation.path,
          method: operation.method,
          status: operation.status,
          frontendId: operation.frontendId,
        });
      }
    },

    removeFromQueue: (state, action: PayloadAction<string>) => {
      const operation = state.pendingOperations.find(
        op => op.id === action.payload,
      );

      if (operation) {
        pushSyncLog(state, {
          level: 'success',
          message: `Removed ${getOperationSummary(operation)} from sync queue`,
          operationId: operation.id,
          path: operation.path,
          method: operation.method,
          status: operation.status,
          frontendId: operation.frontendId,
        });
      }

      state.pendingOperations = state.pendingOperations.filter(
        op => op.id !== action.payload,
      );
      // Remove associated error if exists
      delete state.syncErrors[action.payload];
    },

    clearQueue: state => {
      const count = state.pendingOperations.length;
      state.pendingOperations = [];
      state.syncErrors = {};
      pushSyncLog(state, {
        level: 'warning',
        message: `Cleared sync queue (${count} operation(s))`,
      });
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

        pushSyncLog(state, {
          level: 'error',
          message: `Sync permanently failed after ${operation.retryCount} attempt(s): ${getOperationSummary(operation)}`,
          operationId: operation.id,
          path: operation.path,
          method: operation.method,
          status: operation.status,
          frontendId: operation.frontendId,
        });

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

        pushSyncLog(state, {
          level: 'warning',
          message: `Sync retry ${operation.retryCount}/${maxRetries} scheduled: ${getOperationSummary(operation)}`,
          operationId: operation.id,
          path: operation.path,
          method: operation.method,
          status: operation.status,
          frontendId: operation.frontendId,
        });
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

      pushSyncLog(state, {
        level: 'info',
        message: `Sync status changed to ${action.payload.status}: ${getOperationSummary(operation)}`,
        operationId: operation.id,
        path: operation.path,
        method: operation.method,
        status: operation.status,
        frontendId: operation.frontendId,
      });
    },

    setSyncError: (
      state,
      action: PayloadAction<{operationId: string; error: string}>,
    ) => {
      state.syncErrors[action.payload.operationId] = action.payload.error;

      const operation = state.pendingOperations.find(
        op => op.id === action.payload.operationId,
      );

      pushSyncLog(state, {
        level: 'error',
        message: operation
          ? `Sync error for ${getOperationSummary(operation)}`
          : 'Sync error',
        operationId: action.payload.operationId,
        path: operation?.path,
        method: operation?.method,
        status: operation?.status,
        frontendId: operation?.frontendId,
        error: action.payload.error,
      });
    },

    clearSyncError: (state, action: PayloadAction<string>) => {
      delete state.syncErrors[action.payload];
    },

    addSyncLog: (
      state,
      action: PayloadAction<
        Omit<SyncLogEntry, 'id' | 'timestamp'> & {timestamp?: number}
      >,
    ) => {
      pushSyncLog(state, action.payload);
    },

    clearSyncLogs: state => {
      state.syncLogs = [];
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

      pushSyncLog(state, {
        level: 'info',
        message: `Manual retry queued: ${getOperationSummary(operation)}`,
        operationId: operation.id,
        path: operation.path,
        method: operation.method,
        status: operation.status,
        frontendId: operation.frontendId,
      });
    },

    retryAllFailed: state => {
      let count = 0;
      state.pendingOperations.forEach(op => {
        if (op.status === 'failed') {
          op.status = 'pending';
          op.retryCount = 0;
          op.nextRetryAt = undefined;
          op.lastAttempt = undefined;
          delete state.syncErrors[op.id];
          count += 1;
        }
      });

      if (count > 0) {
        pushSyncLog(state, {
          level: 'info',
          message: `Manual retry queued for ${count} failed operation(s)`,
        });
      }
    },

    discardOperation: (state, action: PayloadAction<string>) => {
      const operation = state.pendingOperations.find(
        op => op.id === action.payload,
      );
      if (!operation || operation.status !== 'failed') return;

      state.pendingOperations = state.pendingOperations.filter(
        op => op.id !== action.payload,
      );
      delete state.syncErrors[action.payload];

      pushSyncLog(state, {
        level: 'warning',
        message: `Discarded failed operation: ${getOperationSummary(operation)}`,
        operationId: operation.id,
        path: operation.path,
        method: operation.method,
        status: operation.status,
        frontendId: operation.frontendId,
      });
    },

    discardAllFailed: state => {
      const failedOperations = state.pendingOperations.filter(
        op => op.status === 'failed',
      );
      const failedIds = failedOperations.map(op => op.id);
      state.pendingOperations = state.pendingOperations.filter(
        op => op.status !== 'failed',
      );
      failedIds.forEach(id => delete state.syncErrors[id]);

      if (failedOperations.length > 0) {
        pushSyncLog(state, {
          level: 'warning',
          message: `Discarded ${failedOperations.length} failed operation(s)`,
        });
      }
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
        pushSyncLog(state, {
          level: 'error',
          message: `Added test failed operation: ${getOperationSummary(op)}`,
          operationId: op.id,
          path: op.path,
          method: op.method,
          status: op.status,
          frontendId: op.frontendId,
          error: state.syncErrors[op.id],
        });
      });
    },

    dropSync: () => emptyState(),
  },
});

export const selectOperations = (state: RootState) =>
  state.sync.pendingOperations || [];

export const selectFailedOperations = (state: RootState) =>
  (state.sync.pendingOperations || []).filter(op => op.status === 'failed');

export const selectFailedOperationsCount = (state: RootState) =>
  (state.sync.pendingOperations || []).filter(op => op.status === 'failed')
    .length;

export const selectSyncLogs = (state: RootState) => state.sync.syncLogs || [];

export const {
  addSyncLog,
  addTestFailedOperations,
  addToQueue,
  clearQueue,
  clearSyncError,
  clearSyncLogs,
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
