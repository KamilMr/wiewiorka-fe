import {NBPExchangeRateResponse, StoredExchangeRate} from '../types/nbpTypes';

/**
 * NBP API helper module for fetching exchange rates
 */

const NBP_BASE_URL = 'https://api.nbp.pl/api';

/**
 * Fetches exchange rate for specified currency and date from NBP API
 * @param currencyCode - Three-letter currency code (e.g., 'EUR', 'USD')
 * @param date - Date in YYYY-MM-DD format (optional, defaults to current rate)
 * @returns Promise resolving to exchange rate data or null if error
 */
export const fetchExchangeRate = async (
  currencyCode: string,
  date?: string,
): Promise<StoredExchangeRate | null> => {
  try {
    const dateParam = date ? `/${date}` : '';
    const url = `${NBP_BASE_URL}/exchangerates/rates/a/${currencyCode.toLowerCase()}${dateParam}/`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`NBP API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: NBPExchangeRateResponse = await response.json();

    if (!data.rates || data.rates.length === 0) {
      console.error('No exchange rates found in NBP API response');
      return null;
    }

    const latestRate = data.rates[0];

    return {
      code: data.code,
      currency: data.currency,
      rate: latestRate.mid,
      date: latestRate.effectiveDate,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching exchange rate from NBP API:', error);
    return null;
  }
};

/**
 * Formats date to YYYY-MM-DD format required by NBP API
 * @param date - Date object to format
 * @returns Formatted date string
 */
export const formatDateForNBP = (date: Date): string =>
  date.toISOString().split('T')[0];
