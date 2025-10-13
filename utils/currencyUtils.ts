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
): {
  convertedAmount: number;
  convertedString: string;
  formattedConversion: string;
  exchangeRateText: string;
} => {
  let numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) numAmount = 0;

  const rateKey = `${fromCurrency.code}_${toCurrency.code}`;
  const rate =
    fromCurrency.code === toCurrency.code
      ? 1.0
      : (exchangeRates[rateKey] ?? 1.0);

  const convertedAmount = numAmount * rate;
  let formattedConversion;
  if (convertedAmount > 0)
    formattedConversion = `~${convertedAmount.toFixed(2)} ${toCurrency.symbol}`;
  else formattedConversion = `~0.00 ${toCurrency.symbol}`;

  const exchangeRateText = `1 ${fromCurrency.code} = ${rate.toFixed(4)} ${toCurrency.code}`;

  return {
    convertedString: convertedAmount.toFixed(2),
    convertedAmount,
    formattedConversion,
    exchangeRateText,
  };
};
