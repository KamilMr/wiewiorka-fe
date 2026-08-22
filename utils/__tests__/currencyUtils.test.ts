import {convertCurrency} from '../currencyUtils';

const eur = {code: 'EUR', symbol: '€', name: 'Euro'};
const pln = {code: 'PLN', symbol: 'zł', name: 'Polish złoty'};

describe('convertCurrency', () => {
  it('uses a 1:1 rate when both currencies are the same', () => {
    expect(convertCurrency('12.5', pln, pln, {PLN_PLN: 4.25})).toEqual({
      convertedAmount: 12.5,
      convertedString: '12.50',
      formattedConversion: '~12.50 zł',
      exchangeRateText: '1 PLN = 1.0000 PLN',
    });
  });

  it('uses the EUR-to-PLN mid rate by default', () => {
    expect(convertCurrency('10', eur, pln, {EUR_PLN: 4.2765})).toEqual({
      convertedAmount: 42.765,
      convertedString: '42.77',
      formattedConversion: '~42.77 zł',
      exchangeRateText: '1 EUR = 4.2765 PLN',
    });
  });

  it.each([
    ['bid', 4.2, ' (kupno)'],
    ['ask', 4.35, ' (sprzedaż)'],
  ] as const)(
    'uses the EUR-to-PLN %s rate and label',
    (rateType, rate, label) => {
      expect(
        convertCurrency(
          '10',
          eur,
          pln,
          {
            EUR_PLN: 4.2765,
            [`EUR_PLN_${rateType}`]: rate,
          },
          rateType,
        ),
      ).toMatchObject({
        convertedAmount: rate * 10,
        convertedString: (rate * 10).toFixed(2),
        formattedConversion: `~${(rate * 10).toFixed(2)} zł`,
        exchangeRateText: `1 EUR = ${rate.toFixed(4)} PLN${label}`,
      });
    },
  );

  it.each(['', 'not an amount'])(
    'returns zero outputs for an invalid amount: %p',
    amount => {
      expect(convertCurrency(amount, eur, pln, {EUR_PLN: 4.2765})).toEqual({
        convertedAmount: 0,
        convertedString: '0.00',
        formattedConversion: '~0.00 zł',
        exchangeRateText: '1 EUR = 4.2765 PLN',
      });
    },
  );
});
