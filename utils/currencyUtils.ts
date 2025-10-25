import {RateType} from '../types/nbpTypes';

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
