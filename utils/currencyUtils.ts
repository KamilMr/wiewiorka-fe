import {RateType} from '../types/nbpTypes';

/**
 * Formats amount in grosze to Polish currency string
 * @param grosze - Amount in grosze (100 gr = 1 zł)
 * @returns Formatted string like '2 zł' or '2 zł 13 gr'
 */
export const formatGrosze = (grosze: number): string => {
  const zl = Math.floor(Math.abs(grosze) / 100);
  const gr = Math.abs(grosze) % 100;
  const sign = grosze < 0 ? '-' : '';

  if (gr === 0) return `${sign}${zl} zł`;
  return `${sign}${zl} zł ${gr} gr`;
};

/**
 * Parses user input in złoty to grosze (integer)
 * @param input - User input string (e.g., "2", "2.10", "0.10")
 * @returns Amount in grosze (e.g., 200, 210, 10) or 0 for invalid input
 */
export const parseZlotyToGrosze = (input: string): number => {
  if (!input || input.trim() === '') return 0;

  const normalized = input.replace(',', '.').trim();
  const num = parseFloat(normalized);

  if (isNaN(num) || num < 0) return 0;

  return Math.round(num * 100);
};

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const convertCurrency = (
  amount: string,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: Record<string, number>,
  rateType: RateType = 'mid',
): {
  convertedAmount: number;
  convertedString: string;
  formattedConversion: string;
  exchangeRateText: string;
} => {
  let numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) numAmount = 0;

  let rateKey = `${fromCurrency.code}_${toCurrency.code}`;
  
  // For EUR/PLN conversions, use specific rate type if not 'mid'
  if (rateType !== 'mid' && 
      ((fromCurrency.code === 'EUR' && toCurrency.code === 'PLN') || 
       (fromCurrency.code === 'PLN' && toCurrency.code === 'EUR'))) {
    rateKey = `${fromCurrency.code}_${toCurrency.code}_${rateType}`;
  }
  
  const rate =
    fromCurrency.code === toCurrency.code
      ? 1.0
      : (exchangeRates[rateKey] ?? 1.0);

  const convertedAmount = numAmount * rate;
  let formattedConversion;
  if (convertedAmount > 0)
    formattedConversion = `~${convertedAmount.toFixed(2)} ${toCurrency.symbol}`;
  else formattedConversion = `~0.00 ${toCurrency.symbol}`;

  const rateTypeLabel = rateType === 'bid' ? ' (kupno)' : rateType === 'ask' ? ' (sprzedaż)' : '';
  const exchangeRateText = `1 ${fromCurrency.code} = ${rate.toFixed(4)} ${toCurrency.code}${rateTypeLabel}`;

  return {
    convertedString: convertedAmount.toFixed(2),
    convertedAmount,
    formattedConversion,
    exchangeRateText,
  };
};
