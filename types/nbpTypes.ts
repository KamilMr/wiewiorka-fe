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

export interface NBPBidAskRate {
  /** Exchange rate publication number */
  no: string;
  /** Date when the exchange rate was effective */
  effectiveDate: string;
  /** Bid rate (buying rate) */
  bid: number;
  /** Ask rate (selling rate) */
  ask: number;
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

export interface NBPBidAskExchangeRateResponse {
  /** Exchange rate table type (C) */
  table: string;
  /** Full currency name */
  currency: string;
  /** Three-letter currency code (ISO 4217) */
  code: string;
  /** Array of bid/ask exchange rates */
  rates: NBPBidAskRate[];
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

export interface StoredBidAskExchangeRate {
  /** Three-letter currency code */
  code: string;
  /** Full currency name */
  currency: string;
  /** Bid rate (buying rate) */
  bidRate: number;
  /** Ask rate (selling rate) */
  askRate: number;
  /** Date when the rate was effective */
  date: string;
  /** Timestamp when data was fetched */
  fetchedAt: string;
}

export type RateType = 'mid' | 'bid' | 'ask';
