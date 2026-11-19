import {createAsyncThunk} from '@reduxjs/toolkit';

import type {RootState} from '../store';
import {
  addDebt as addDebtAction,
  addDebtPayment as addDebtPaymentAction,
  removeDebtPayment as removeDebtPaymentAction,
  updateDebtPayment as updateDebtPaymentAction,
  setDebts as setDebtsAction,
} from './mainSlice';
import {authenticatedFetch} from './api';

export const fetchDebts = createAsyncThunk<any, void, {state: RootState}>(
  'debt/fetch',
  async (_, thunkAPI) => {
    const {dispatch, getState} = thunkAPI;
    const token = getState().auth.token;

    try {
      const response = await authenticatedFetch('debt', token);

      const result = await response.json();
      if (result.err) throw result.err;

      dispatch(setDebtsAction(result.d));
      return result.d;
    } catch (error) {
      throw String(error);
    }
  },
);

export const addDebtThunk = createAsyncThunk<
  any,
  {personName: string; totalAmount: number; description?: string},
  {state: RootState}
>('debt/add', async (payload, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;
  const token = getState().auth.token;

  try {
    const response = await authenticatedFetch('debt', token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.err) throw result.err;

    dispatch(addDebtAction({...result.d, payments: []}));
    return result.d;
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
});

export const addDebtPaymentThunk = createAsyncThunk<
  any,
  {debtId: string; amount: number; date: string; note?: string},
  {state: RootState}
>('debt/addPayment', async ({debtId, ...paymentData}, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;
  const token = getState().auth.token;

  try {
    const response = await authenticatedFetch(`debt/${debtId}/payment`, token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    if (result.err) throw result.err;

    dispatch(addDebtPaymentAction({debtId, payment: result.d}));
    return result.d;
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
});

export const deleteDebtPaymentThunk = createAsyncThunk<
  any,
  {debtId: string; paymentId: string},
  {state: RootState}
>('debt/deletePayment', async ({debtId, paymentId}, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;
  const token = getState().auth.token;

  try {
    const response = await authenticatedFetch(
      `debt/${debtId}/payment/${paymentId}`,
      token,
      {
        method: 'DELETE',
      },
    );

    const result = await response.json();
    if (result.err) throw result.err;

    dispatch(removeDebtPaymentAction({debtId, paymentId}));
    return result.d;
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
});

export const updateDebtPaymentThunk = createAsyncThunk<
  any,
  {
    debtId: string;
    paymentId: string;
    amount?: number;
    date?: string;
    note?: string;
  },
  {state: RootState}
>('debt/updatePayment', async ({debtId, paymentId, ...updates}, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;
  const token = getState().auth.token;

  try {
    const response = await authenticatedFetch(
      `debt/${debtId}/payment/${paymentId}`,
      token,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      },
    );

    const result = await response.json();
    if (result.err) throw result.err;

    dispatch(updateDebtPaymentAction({debtId, payment: result.d}));
    return result.d;
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
});
