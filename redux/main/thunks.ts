import {createAsyncThunk} from '@reduxjs/toolkit';
import {RootState} from '../store';

import {getURL, makeNewIdArr, makeRandomId} from '@/common';
import {Expense, Income} from '@/types';
import {
  addBudgets as addBudgetsAction,
  addExchangeRate as addExchangeRateAction,
  updateBudget as updateBudgetAction,
  addExpense as addExpenseAction,
  updateExpense as updateExpenseAction,
  addIncome as addIncomeAction,
  updateIncome as updateIncomeAction,
  replaceBudget as replaceBudgetAction,
  replaceExpense as replaceExpenseAction,
  replaceIncome as replaceIncomeAction,
  deleteBudget as deleteBudgetAction,
  removeExpense as removeExpenseAction,
  removeIncome as removeIncomeAction,
  addSubcategoryAction,
  updateSubcategoryAction,
  deleteSubcategoryAction,
  addGroupCategoryAction,
  updateGroupCategoryAction,
  deleteGroupCategoryAction,
  setSnackbar,
} from './mainSlice';
import {
  addToQueue,
  removeFromQueue,
  setSyncError,
  incrementRetryCount,
  setOperationStatus,
} from '../sync/syncSlice';
import {SYNC_CONFIG} from '@/constants/theme';
import _, {omit} from 'lodash';

const DIFFERED = 0;

const mainSliceReducers = {
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

export interface Budget {
  id?: string;
  amount: number;
  date: string;
  categoryId?: number;
  groupId?: number;
}

export const deleteBudget = createAsyncThunk<
  any,
  {id: string},
  {state: RootState}
>('budget/delete', async ({id}, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;

  // Check if there are actions waiting in sync queue for this budget frontendId
  const state = getState();
  const pendingOps = state.sync.pendingOperations || [];

  // Remove any pending operations for this budget (check frontendId and budget path)
  const opsToRemove = pendingOps.filter(
    op => op.path?.includes('budget') && op.frontendId === id,
  );

  // Remove the operations from queue
  opsToRemove.forEach(op => {
    dispatch(removeFromQueue(op.id));
  });

  // Update local state immediately
  dispatch(deleteBudgetAction({id}));

  // Queue for sync - DELETE request
  dispatch(
    addToQueue({
      path: ['main', 'budget', id],
      method: 'DELETE',
      handler: 'genericSync',
      data: {},
      cb: 'deleteBudget',
      frontendId: id,
    }),
  );
});

export const uploadBudget = createAsyncThunk<any, Budget, {state: RootState}>(
  'budget/updateBudget',
  async ({id, ...rest}: Budget, thunkAPI): Promise<void> => {
    const token = thunkAPI.getState().auth.token;

    let data;
    const path = 'budget' + (id ? `/${id}` : '');
    let resp = await fetch(getURL(path), {
      method: id ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-type': 'application/json',
      },
      body: JSON.stringify(rest),
    });
    data = await resp.json();
    if (data.err) throw data.err;
    setTimeout(() => thunkAPI.dispatch(fetchIni()), DIFFERED);
  },
);

export const createUpdateBudget = createAsyncThunk<
  any,
  Budget[],
  {state: RootState}
>(
  'budget/createUpdateBudget',
  async (budgets: Budget[], thunkAPI): Promise<void> => {
    const {dispatch} = thunkAPI;

    // Create budgets with frontend IDs
    const budgetsWithFrontendIds = budgets.map(budget => ({
      ...budget,
      id: budget.id ?? `f_b-${makeNewIdArr(2).join('-')}`,
      isNew: !budget.id,
    }));

    // Add to local state immediately
    const newBudgets = budgetsWithFrontendIds.filter(budget => budget.isNew);
    const existingBudgets = budgetsWithFrontendIds.filter(
      budget => !budget.isNew,
    );

    if (newBudgets.length > 0) {
      dispatch(
        addBudgetsAction(
          newBudgets.map(budget =>
            _.pick(budget, ['amount', 'categoryId', 'date', 'id']),
          ),
        ),
      );
    }

    existingBudgets.forEach(budget => {
      dispatch(
        updateBudgetAction({
          id: budget.id,
          ..._.pick(budget, ['amount', 'categoryId', 'date']),
        }),
      );
    });

    // Queue for sync
    budgetsWithFrontendIds.forEach(budget => {
      const tR: {
        path: string[];
        method: 'POST' | 'PATCH';
        handler: string;
        data: any;
        cb: string;
        frontendId: string;
      } = {
        path: ['main', 'budget'],
        method: 'POST',
        handler: 'genericSync',
        data: _.pick(
          budget,
          budget.isNew ? ['amount', 'categoryId', 'date'] : ['amount'],
        ),
        cb: 'replaceBudget',
        frontendId: budget.id,
      };
      if (!budget.isNew) {
        tR.path.push(budget.id);
        tR.method = 'PATCH';
      }
      dispatch(addToQueue(tR));
    });
  },
);

export const updateBudgetItem = createAsyncThunk<
  any,
  {id: string; changes: Partial<Budget>},
  {state: RootState}
>('budget/update', async ({id, changes}, thunkAPI) => {
  const {dispatch} = thunkAPI;

  // Update local state immediately
  dispatch(updateBudgetAction({id, ...changes}));

  // Queue for sync
  dispatch(
    addToQueue({
      path: ['main', 'budget', id],
      method: 'PATCH',
      handler: 'genericSync',
      data: changes,
      cb: 'replaceBudget',
      frontendId: id,
    }),
  );
});

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
          throw error;
        }
      }

      // After processing operations, check if queue is empty
      const updatedState = getState();
      const remainingOps = updatedState.sync.pendingOperations || [];

      // Only proceed if queue is now empty
      if (remainingOps.length > 0) throw 'Nie możemy pobrać danych';
    }

    const token = getState().auth.token;
    let data;
    try {
      let resp = await fetch(getURL('ini'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      data = await resp.json();
      if (data.err) throw data.err;
      return data.d;
    } catch (err) {
      throw String(err);
    }
  },
);

export const addNewExpense = createAsyncThunk<
  any,
  Expense & {frontendId?: string | number},
  {state: RootState}
>('expense/save', async (expense, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;

  const auth = getState().auth;
  // Editing existing expense
  const frontendId = `f_${makeNewIdArr(1)[0]}`;
  dispatch(
    addExpenseAction([
      {
        ...expense,
        ownerId: auth.id || 0,
        houseId: auth.houses?.[0] || '',
        owner: auth.name || '',
        id: frontendId,
      },
    ]),
  );

  dispatch(
    addToQueue({
      path: ['main', 'expenses'],
      method: 'POST',
      handler: 'genericSync',
      data: expense,
      cb: 'replaceExpense',
      frontendId: frontendId,
    }),
  );
});

export const updateExpense = createAsyncThunk<any, Expense, {state: RootState}>(
  'expense/save',
  async (expense, thunkAPI) => {
    const {dispatch} = thunkAPI;

    // Editing existing expense
    dispatch(updateExpenseAction(expense));

    dispatch(
      addToQueue({
        path: ['main', 'expenses', expense.id.toString()],
        method: 'PUT',
        handler: 'genericSync',
        data: expense,
        cb: 'replaceExpense',
        frontendId: expense.id.toString(),
      }),
    );
  },
);

export const addNewIncome = createAsyncThunk<
  any,
  Income & {frontendId?: string | number},
  {state: RootState}
>('income/save', async (income, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;

  const auth = getState().auth;

  const incomeWithAuth = {
    ...income,
    ownerId: auth.id || 0,
    houseId: auth.houses?.[0] || '',
    owner: auth.name || '',
  };

  const frontendId = `f_${makeNewIdArr(1)[0]}`;
  dispatch(addIncomeAction([{...incomeWithAuth, id: frontendId}]));

  dispatch(
    addToQueue({
      path: ['main', 'income'],
      method: 'POST',
      handler: 'genericSync',
      data: income,
      cb: 'replaceIncome',
      frontendId: frontendId,
    }),
  );
});

export const updateIncome = createAsyncThunk<any, Income, {state: RootState}>(
  'income/update',
  async (income, thunkAPI) => {
    const {dispatch} = thunkAPI;

    dispatch(
      updateIncomeAction({
        ...income,
        ownerId: '',
        houseId: '',
        owner: '',
      }),
    );

    dispatch(
      addToQueue({
        path: ['main', 'income', income.id.toString()],
        method: 'PATCH',
        handler: 'genericSync',
        data: omit(income, 'id'),
      }),
    );
  },
);

export const handleCategory = createAsyncThunk<
  any,
  {
    method?: string;
    id?: string;
    name?: string;
    color?: string;
    groupId?: number;
  },
  {state: RootState}
>('category/upsert', async (payload, thunkAPI) => {
  const {token} = thunkAPI.getState().auth;

  if (!Object.keys(payload).length) return;

  const {method, id, ...rest} = payload;
  let q = 'category' + (method === 'PUT' ? `/${id}` : '');
  let data;

  const {name, color, groupId} = rest;
  let resp = await fetch(getURL(q), {
    method,
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({name, color: color?.split('#')[1] || '', groupId}),
  });
  data = await resp.json();
  if (data.err) throw data.err;
  // differed fetch
  setTimeout(() => thunkAPI.dispatch(fetchIni()), DIFFERED);
  return data.d;
});

export const handleDeleteCategory = createAsyncThunk<
  any,
  {id?: string},
  {state: RootState}
>('category/delete', async (payload, thunkAPI) => {
  const {token} = thunkAPI.getState().auth;

  if (!Object.keys(payload).length) return;

  const {id} = payload;
  let q = `category/${id}`;
  let data;

  let resp = await fetch(getURL(q), {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  data = await resp.json();
  if (data.err) throw data.err;
  // deffered fetch
  setTimeout(() => thunkAPI.dispatch(fetchIni()), DIFFERED);
  return data.d;
});

export const addSubcategoryLocal = createAsyncThunk<
  any,
  {
    name: string;
    color: string;
    groupId: number;
  },
  {state: RootState}
>('subcategory/addLocal', async (payload, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;

  const auth = getState().auth;
  const {name, color, groupId} = payload;

  // Generate frontend ID for optimistic update
  const frontendId = `f_${makeRandomId(8)}`;

  // Create temporary subcategory object
  const tempSubcategory = {
    id: frontendId,
    name,
    color: color.split('#')[1] || 'ffffff',
    groupId,
    owner: auth.name,
    ownerId: auth.houses[0],
  };

  // Immediate local update
  dispatch(addSubcategoryAction(tempSubcategory));

  // Queue sync operation
  dispatch(
    addToQueue({
      path: ['main', 'category'],
      method: 'POST',
      data: {name, color: color.split('#')[1] || 'ffffff', groupId},
      handler: 'genericSync',
      frontendId,
      cb: 'replaceSubcategoryAction',
    }),
  );

  return tempSubcategory;
});

export const updateSubcategoryLocal = createAsyncThunk<
  any,
  {
    id: number;
    name: string;
    color: string;
    groupId: number;
  },
  {state: RootState}
>('subcategory/updateLocal', async (payload, thunkAPI) => {
  const {dispatch} = thunkAPI;
  const {id, name, color, groupId} = payload;

  // Immediate local update
  dispatch(updateSubcategoryAction(payload));

  // Queue sync operation
  dispatch(
    addToQueue({
      path: ['main', 'category', id.toString()],
      method: 'PUT',
      data: {name, color: color.split('#')[1] || 'ffffff', groupId},
      handler: 'genericSync',
      frontendId: id.toString(),
      cb: 'replaceSubcategoryAction',
    }),
  );

  return payload;
});

export const deleteSubcategoryLocal = createAsyncThunk<
  any,
  string | number,
  {state: RootState}
>('subcategory/deleteLocal', async (id, thunkAPI) => {
  const {dispatch} = thunkAPI;

  // Immediate local update - remove from state
  dispatch(deleteSubcategoryAction(id));

  // Queue sync operation - let queue logic decide if it's needed
  dispatch(
    addToQueue({
      path: ['main', 'category', id.toString()],
      method: 'DELETE',
      handler: 'genericSync',
      frontendId: id.toString(),
    }),
  );

  return id;
});

export const addGroupCategoryLocal = createAsyncThunk<
  any,
  {
    name: string;
    color: string;
  },
  {state: RootState}
>('groupCategory/addLocal', async (payload, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;

  const auth = getState().auth;
  const {name, color} = payload;

  // Generate frontend ID for optimistic update
  const frontendId = `f_g_${makeRandomId(8)}`;

  // Create temporary group category object
  const tempGroupCategory = {
    id: frontendId,
    name,
    color: color.split('#')[1] || 'ffffff',
    owner: auth.name,
    ownerId: auth.houses[0],
  };

  // Immediate local update
  dispatch(addGroupCategoryAction(tempGroupCategory));

  // Queue sync operation
  dispatch(
    addToQueue({
      path: ['main', 'category', 'group'],
      method: 'POST',
      data: {name, color: tempGroupCategory.color},
      handler: 'genericSync',
      frontendId,
      cb: 'replaceGroupCategoryAction',
    }),
  );

  return tempGroupCategory;
});

export const updateGroupCategoryLocal = createAsyncThunk<
  any,
  {
    id: number | string;
    name: string;
    color: string;
  },
  {state: RootState}
>('groupCategory/updateLocal', async (payload, thunkAPI) => {
  const {dispatch} = thunkAPI;

  // Immediate local update
  dispatch(updateGroupCategoryAction(payload));

  // Queue sync operation
  dispatch(
    addToQueue({
      path: ['main', 'category', 'group', payload.id.toString()],
      method: 'PUT',
      data: {
        name: payload.name,
        color: payload.color.split('#')[1] || 'ffffff',
      },
      handler: 'genericSync',
      frontendId: payload.id.toString(),
      cb: 'replaceGroupCategoryAction',
    }),
  );

  return payload;
});

export const deleteGroupCategoryLocal = createAsyncThunk<
  any,
  string | number,
  {state: RootState}
>('groupCategory/deleteLocal', async (id, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;
  const state = getState();

  // Check if group has subcategories
  const group = state.main.categories[id];
  if (group && group.subcategories.length > 0) {
    dispatch(
      setSnackbar({
        open: true,
        type: 'error',
        msg: 'Najpierw usuń wszystkie podkategorie',
      }),
    );
    throw new Error('Cannot delete group with subcategories');
  }

  // Immediate local update - remove from state
  dispatch(deleteGroupCategoryAction(id));

  // Queue sync operation - let queue logic decide if it's needed
  dispatch(
    addToQueue({
      path: ['main', 'category', 'group', id.toString()],
      method: 'DELETE',
      handler: 'genericSync',
      frontendId: id.toString(),
    }),
  );

  return id;
});

export const handleDeleteGroupCategory = createAsyncThunk<
  any,
  {id?: string},
  {state: RootState}
>('categoryGroup/delete', async (payload, thunkAPI) => {
  const {token} = thunkAPI.getState().auth;

  if (!Object.keys(payload).length) return;

  const {id} = payload;
  let q = `category/group/${id}`;
  let data;

  let resp = await fetch(getURL(q), {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  data = await resp.json();
  if (data.err) throw data.err;
  // differed fetch
  setTimeout(() => thunkAPI.dispatch(fetchIni()), DIFFERED);
  return data.d;
});

export const handleGroupCategory = createAsyncThunk<
  any,
  {method?: string; id?: string; name?: string; color?: string},
  {state: RootState}
>('categoryGroup/upsert', async (payload, thunkAPI) => {
  const {token} = thunkAPI.getState().auth;

  if (!Object.keys(payload).length) return;

  const {method = '', id, ...rest} = payload;
  let q = 'category/group' + (method === 'PUT' ? `/${id}` : '');
  let data;

  const {name, color = '#FFFFFF'} = rest;
  let resp = await fetch(getURL(q), {
    method,
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({name, color: color?.split('#')[1] || ''}),
  });
  data = await resp.json();
  if (data.err) throw data.err;
  // differed fetch
  setTimeout(() => thunkAPI.dispatch(fetchIni()), DIFFERED);
  return data.d;
});

export const uploadFile = createAsyncThunk<
  any,
  {file: any},
  {state: RootState}
>('expense/image', async ({file}: {file: any}, thunkAPI) => {
  const token = thunkAPI.getState().auth.token;
  let data;
  const path = 'expenses/image';
  let resp = await fetch(getURL(path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: file,
  });
  data = await resp.json();

  if (data.err) throw data;
  // deffered fetch
  setTimeout(() => thunkAPI.dispatch(fetchIni()), DIFFERED);
  return data.d;
});

export const deleteExpense = createAsyncThunk<
  any,
  {id?: string},
  {state: RootState}
>('expense/delete', async (id, thunkAPI) => {
  const token = thunkAPI.getState().auth.token;

  let data;
  const path = 'expenses' + (id ? `/${id}` : '');
  let resp = await fetch(getURL(path), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  data = await resp.json();
  if (data.err) throw data.err;

  // differed fetch
  setTimeout(() => thunkAPI.dispatch(fetchIni()), DIFFERED);
});

export const deleteIncome = createAsyncThunk<any, string, {state: RootState}>(
  'income/delete',
  async (id, thunkAPI) => {
    const {dispatch} = thunkAPI;

    // Always remove from local state first
    dispatch(removeIncomeAction(id));

    // Check if it's a synced item (needs backend deletion)
    // Schedule backend deletion for synced items
    dispatch(
      addToQueue({
        path: ['main', 'income', id],
        method: 'DELETE',
        handler: 'genericSync',
        frontendId: id,
      }),
    );
  },
);

export const deleteExpenseLocal = createAsyncThunk<
  any,
  string,
  {state: RootState}
>('expense/deleteLocal', async (id, thunkAPI) => {
  const {dispatch} = thunkAPI;

  // Always remove from local state first
  dispatch(removeExpenseAction(id));

  // Schedule backend deletion for synced items
  dispatch(
    addToQueue({
      path: ['main', 'expenses', id],
      method: 'DELETE',
      handler: 'genericSync',
      frontendId: id,
    }),
  );
});

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

      const response = await fetch(getURL(endpoint), {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();
      if (result.err) throw result.err;

      if (cb) {
        const [callbackName, param] = cb.split(':');
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
      dispatch(
        incrementRetryCount({operationId, maxRetries: SYNC_CONFIG.MAX_RETRIES}),
      );
      dispatch(setSyncError({operationId, error: String(error)}));

      return {error: true, message: String(error)};
    }
  },
);

/**
 * Fetches exchange rate from NBP API with daily caching
 * @param params - Currency code and optional date
 */
export const fetchExchangeRate = createAsyncThunk(
  'main/fetchExchangeRate',
  async (
    {currencyCode, date}: {currencyCode: string; date?: string},
    {dispatch, getState},
  ) => {
    const {formatDateForNBP} = await import('../../helpers/nbpApi');
    const state = getState() as RootState;

    const today = date || formatDateForNBP(new Date());

    // Check if we already have a recent rate (within last 7 days)
    // NBP API returns the last business day rate for weekends/holidays,
    // so we check for any recent cached rate instead of exact date match
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = formatDateForNBP(sevenDaysAgo);

    const existingRate = state.main.exchangeRates
      .filter(
        rate =>
          rate.code.toLowerCase() === currencyCode.toLowerCase() &&
          rate.date >= sevenDaysAgoStr &&
          rate.date <= today,
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0]; // Get most recent

    if (existingRate) {
      return existingRate;
    }


    const {fetchExchangeRate: fetchFromNBP} = await import(
      '../../helpers/nbpApi'
    );

    const exchangeRate = await fetchFromNBP(currencyCode, date);

    if (exchangeRate) {
      dispatch(addExchangeRateAction(exchangeRate));
      return exchangeRate;
    }

    throw new Error(`Failed to fetch exchange rate for ${currencyCode}`);
  },
);
