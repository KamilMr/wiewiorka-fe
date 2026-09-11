import {createAsyncThunk} from '@reduxjs/toolkit';
import {omit} from 'lodash';

import type {Expense, Income} from '@/types';
import type {RootState} from '../store';
import {addToQueue} from '../sync/syncSlice';
import {log, setAttribute} from '@/utils/crashlytics';
import {makeNewIdArr} from '@/common';
import {
  addExpense as addExpenseAction,
  updateExpense as updateExpenseAction,
  addIncome as addIncomeAction,
  updateIncome as updateIncomeAction,
  removeExpense as removeExpenseAction,
  removeIncome as removeIncomeAction,
} from './mainSlice';
import {authenticatedFetch} from './api';
import {fetchIni} from './syncThunks';

const DIFFERED = 0;

export const addNewExpense = createAsyncThunk<
  any,
  Expense & {frontendId?: string | number},
  {state: RootState}
>('expense/add', async (expense, thunkAPI) => {
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

  // Log breadcrumb for sync tracking
  log(`Expense queued for sync: ${frontendId}`);
  setAttribute('lastExpenseCategory', expense.category || '');
  setAttribute('lastExpenseAmount', String(expense.price || 0));

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
  'expense/update',
  async (expense, thunkAPI) => {
    const {dispatch} = thunkAPI;

    // Editing existing expense
    dispatch(updateExpenseAction(expense));

    // Log breadcrumb for sync tracking
    log(`Expense update queued for sync: ${expense.id}`);

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

  // Log breadcrumb for sync tracking
  log(`Income queued for sync: ${frontendId}`);
  setAttribute('lastIncomeSource', income.source || '');
  setAttribute('lastIncomeAmount', String(income.price || 0));

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

    // Log breadcrumb for sync tracking
    log(`Income update queued for sync: ${income.id}`);

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

export const uploadFile = createAsyncThunk<
  any,
  {file: any},
  {state: RootState}
>('expense/image', async ({file}: {file: any}, thunkAPI) => {
  const token = thunkAPI.getState().auth.token;
  let data;
  const path = 'expenses/image';
  let resp = await authenticatedFetch(path, token, {
    method: 'POST',
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
  let resp = await authenticatedFetch(path, token, {
    method: 'DELETE',
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

    // Log breadcrumb for sync tracking
    log(`Income delete queued for sync: ${id}`);

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

  // Log breadcrumb for sync tracking
  log(`Expense delete queued for sync: ${id}`);

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
