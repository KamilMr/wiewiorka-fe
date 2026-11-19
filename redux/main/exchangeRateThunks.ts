import {createAsyncThunk} from '@reduxjs/toolkit';

import type {RootState} from '../store';
import {
  addExchangeRate as addExchangeRateAction,
  addBidAskExchangeRate as addBidAskExchangeRateAction,
} from './mainSlice';

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

    const {fetchExchangeRate: fetchFromNBP} =
      await import('../../helpers/nbpApi');

    const exchangeRate = await fetchFromNBP(currencyCode, date);

    if (exchangeRate) {
      dispatch(addExchangeRateAction(exchangeRate));
      return exchangeRate;
    }

    throw new Error(`Failed to fetch exchange rate for ${currencyCode}`);
  },
);

/**
 * Fetches bid/ask exchange rates from NBP API with daily caching
 * @param params - Currency code and optional date
 */
export const fetchBidAskExchangeRate = createAsyncThunk(
  'main/fetchBidAskExchangeRate',
  async (
    {currencyCode, date}: {currencyCode: string; date?: string},
    {dispatch, getState},
  ) => {
    const {formatDateForNBP} = await import('../../helpers/nbpApi');
    const state = getState() as RootState;

    const today = date || formatDateForNBP(new Date());

    // Check if we already have a recent bid/ask rate (within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = formatDateForNBP(sevenDaysAgo);

    const existingRate = state.main.bidAskExchangeRates
      ?.filter(
        rate =>
          rate.code.toLowerCase() === currencyCode.toLowerCase() &&
          rate.date >= sevenDaysAgoStr &&
          rate.date <= today,
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0]; // Get most recent

    if (existingRate) {
      return existingRate;
    }

    const {fetchBidAskExchangeRate: fetchFromNBP} =
      await import('../../helpers/nbpApi');

    const exchangeRate = await fetchFromNBP(currencyCode, date);

    if (exchangeRate) {
      dispatch(addBidAskExchangeRateAction(exchangeRate));
      return exchangeRate;
    }

    throw new Error(
      `Failed to fetch bid/ask exchange rate for ${currencyCode}`,
    );
  },
);
