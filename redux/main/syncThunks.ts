import {createAsyncThunk} from '@reduxjs/toolkit';

import type {RootState} from '../store';
import {
  addSyncLog,
  removeFromQueue,
  setSyncError,
  incrementRetryCount,
  setOperationStatus,
} from '../sync/syncSlice';
import {SYNC_CONFIG} from '@/constants/theme';
import {logError, log, setAttribute} from '@/utils/crashlytics';
import {
  deleteBudget as deleteBudgetAction,
  addBudgets as addBudgetsAction,
  updateBudget as updateBudgetAction,
  addExpense as addExpenseAction,
  updateExpense as updateExpenseAction,
  addIncome as addIncomeAction,
  updateIncome as updateIncomeAction,
  replaceBudget as replaceBudgetAction,
  replaceExpense as replaceExpenseAction,
  replaceIncome as replaceIncomeAction,
  setSnackbar,
} from './mainSlice';
import {authenticatedFetch} from './api';

const DIFFERED = 0;

const mainSliceReducers: {[key: string]: (payload: any) => any} = {
  deleteBudget: deleteBudgetAction,
  addBudgets: addBudgetsAction,
  updateBudget: updateBudgetAction,
  addExpense: addExpenseAction,
  updateExpense: updateExpenseAction,
  addIncome: addIncomeAction,
  updateIncome: updateIncomeAction,
  replaceBudget: replaceBudgetAction,
  replaceExpense: replaceExpenseAction,
  replaceIncome: replaceIncomeAction,
};

export const fetchIni = createAsyncThunk<any, void, {state: RootState}>(
  'ini/fetchIni',
  async (_, thunkAPI) => {
    const {dispatch, getState} = thunkAPI;
    const state = getState();
    const pendingOps = state.sync.pendingOperations || [];

    // If there are pending operations, process them first
    if (pendingOps.length > 0) {
      // Process all pending operations sequentially
      for (const operation of pendingOps) {
        try {
          await dispatch(
            genericSync({
              path: operation.path.slice(1), // Remove 'main' prefix
              method: operation.method,
              data: operation.data,
              cb: operation.cb,
              operationId: operation.id,
              frontendId: operation.frontendId,
            }),
          ).unwrap();
        } catch (error) {
          // If any operation fails, stop processing and don't fetch ini
          const errorObj =
            error instanceof Error ? error : new Error(String(error));
          log(`fetchIni: Pending operation failed - ${operation.id}`);
          setAttribute('failedOperationId', operation.id);
          setAttribute('failedOperationPath', operation.path.join('/'));
          logError(errorObj, 'fetchIni:pendingOperation');
          throw error;
        }
      }

      // After processing operations, check if queue is empty
      const updatedState = getState();
      const remainingOps = updatedState.sync.pendingOperations || [];

      // Only proceed if queue is now empty
      if (remainingOps.length > 0) {
        log(
          `fetchIni: ${remainingOps.length} operations still pending after sync`,
        );
        setAttribute('remainingOpsCount', String(remainingOps.length));
        logError(
          new Error('Pending operations remain after sync'),
          'fetchIni:remainingOps',
        );
        throw new Error('Nie możemy pobrać danych');
      }
    }

    const token = getState().auth.token;
    let data;
    try {
      let resp = await authenticatedFetch('ini', token);
      data = await resp.json();
      if (data.err) throw new Error(data.err);
      return data.d;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      log('fetchIni: API fetch failed');
      logError(errorObj, 'fetchIni:apiFetch');
      throw errorObj;
    }
  },
);

export const genericSync = createAsyncThunk<
  any,
  {
    path: string[];
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    cb?: string;
    operationId: string;
    frontendId?: string;
  },
  {state: RootState}
>(
  'sync/generic',
  async ({path, method, data, cb, operationId, frontendId}, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    const {dispatch} = thunkAPI;

    try {
      dispatch(setOperationStatus({operationId, status: 'processing'}));
      const endpoint = path.join('/');

      const response = await authenticatedFetch(endpoint, token, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseText = await response.text();
      let result: any = {};
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Invalid JSON response (${response.status}): ${responseText}`,
        );
      }

      if (!response.ok || result.err) {
        const errorPayload =
          result.err ??
          result.error ??
          result.message ??
          responseText ??
          response.statusText;
        const parsedError =
          typeof errorPayload === 'string'
            ? errorPayload
            : JSON.stringify(errorPayload);
        throw new Error(
          response.ok ? parsedError : `HTTP ${response.status}: ${parsedError}`,
        );
      }

      dispatch(
        addSyncLog({
          level: 'success',
          message: `Sync request succeeded: ${method} ${endpoint}`,
          operationId,
          path: ['main', ...path],
          method,
          status: 'processing',
          frontendId,
        }),
      );

      if (cb) {
        const [callbackName] = cb.split(':');
        if (callbackName === 'fetchIni')
          setTimeout(() => dispatch(fetchIni()), DIFFERED);

        if (mainSliceReducers[cb]) {
          dispatch(
            mainSliceReducers[cb]({
              frontendId,
              resp: result.d,
            }),
          );
        }
      }

      dispatch(removeFromQueue(operationId));

      return result.d;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorObj = error instanceof Error ? error : new Error(errorMessage);

      // Determine operation type for better Crashlytics filtering
      const pathStr = path.join('/').toLowerCase();
      let operationType = 'unknown';
      if (pathStr.includes('expenses')) operationType = 'expense';
      else if (pathStr.includes('income')) operationType = 'income';
      else if (pathStr.includes('budget')) operationType = 'budget';
      else if (pathStr.includes('category')) operationType = 'category';
      else if (pathStr.includes('debt')) operationType = 'debt';

      // Log to Crashlytics with context
      log(`genericSync failed: ${operationType} ${method} ${path.join('/')}`);
      setAttribute('syncOperationType', operationType);
      setAttribute('syncOperationId', operationId);
      setAttribute('syncPath', path.join('/'));
      setAttribute('syncMethod', method);
      if (frontendId) setAttribute('syncFrontendId', frontendId);
      if (data) setAttribute('syncDataKeys', Object.keys(data).join(','));
      logError(errorObj, `genericSync:${operationType}`);

      dispatch(
        incrementRetryCount({operationId, maxRetries: SYNC_CONFIG.MAX_RETRIES}),
      );
      dispatch(setSyncError({operationId, error: errorMessage}));

      // Check if operation permanently failed (max retries exceeded)
      const updatedState = thunkAPI.getState();
      const operation = updatedState.sync.pendingOperations.find(
        op => op.id === operationId,
      );
      if (operation?.status === 'failed') {
        dispatch(
          setSnackbar({
            msg: 'Synchronizacja nie powiodła się. Sprawdź w ustawieniach.',
            type: 'error',
            setTime: 5000,
          }),
        );
      }

      return {error: true, message: errorMessage};
    }
  },
);
