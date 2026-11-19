import {createAsyncThunk} from '@reduxjs/toolkit';
import _ from 'lodash';

import type {RootState} from '../store';
import {addToQueue, removeFromQueue} from '../sync/syncSlice';
import {
  addBudgets as addBudgetsAction,
  deleteBudget as deleteBudgetAction,
  updateBudget as updateBudgetAction,
} from './mainSlice';
import {authenticatedFetch} from './api';
import {fetchIni} from './syncThunks';
import {makeNewIdArr} from '@/common';

const DIFFERED = 0;

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
    let resp = await authenticatedFetch(path, token, {
      method: id ? 'PATCH' : 'POST',
      headers: {
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
