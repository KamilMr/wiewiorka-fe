/**
 * Types for NBP (National Bank of Poland) API responses
 */

export interface NBPRate {
  /** Exchange rate publication number */
  no: string;
  /** Date when the exchange rate was effective */
  effectiveDate: string;
  /** Mid-market exchange rate value */
  mid: number;
}

export interface NBPExchangeRateResponse {
  /** Exchange rate table type (A, B, or C) */
  table: string;
  /** Full currency name */
  currency: string;
  /** Three-letter currency code (ISO 4217) */
  code: string;
  /** Array of exchange rates */
  rates: NBPRate[];
}

export interface StoredExchangeRate {
  /** Three-letter currency code */
  code: string;
  /** Full currency name */
  currency: string;
  /** Exchange rate value */
  rate: number;
  /** Date when the rate was effective */
  date: string;
  /** Timestamp when data was fetched */
  fetchedAt: string;
}
