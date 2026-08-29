import {StyleSheet, View, Text} from 'react-native';
import {useState} from 'react';
import {useAppTheme} from '@/constants/theme';
import {EnhancedPriceInput} from '@/components/EnhancedPriceInput';
import {CurrencyPriceInput} from '@/components';
import SafeScrollContainer from '@/components/SafeScrollContainer';

const ShowReelPage = () => {
  const t = useAppTheme();

  // V2 component state
  const [priceV2, setPriceV2] = useState('200');
  const [exchangeRate, setExchangeRate] = useState(4.34);

  // Currency component data
  const currencies = [
    {code: 'PLN', symbol: 'zł', name: 'Polski Złoty'},
    {code: 'EUR', symbol: '€', name: 'Euro'},
    {code: 'USD', symbol: '$', name: 'US Dollar'},
    {code: 'GBP', symbol: '£', name: 'British Pound'},
  ];

  const exchangeRates = {
    PLN_EUR: 0.23,
    EUR_PLN: 4.35,
    PLN_USD: 0.25,
    USD_PLN: 4.0,
    EUR_USD: 1.09,
    USD_EUR: 0.92,
    PLN_GBP: 0.2,
    GBP_PLN: 5.0,
    EUR_GBP: 0.86,
    GBP_EUR: 1.16,
    USD_GBP: 0.78,
    GBP_USD: 1.28,
  };

  return (
    <SafeScrollContainer
      style={[styles.root, {backgroundColor: t.colors.background}]}
    >
      <View>
        <Text style={[styles.title, {color: t.colors.foreground}]}>
          Show Reel
        </Text>

        <Text style={[styles.content, {color: t.colors.foreground}]}>
          Testing Enhanced Price Input
        </Text>
        <EnhancedPriceInput
          value={priceV2}
          onValueChange={(v): void => {
            setPriceV2(v[0]);
          }}
          defaultCurrency="PLN"
          availableCurrencies={['EUR', 'USD']}
          exchangeRate={exchangeRate}
          onExchangeRateChange={setExchangeRate}
          label="Cena"
        />

        <Text
          style={[styles.content, {color: t.colors.foreground, marginTop: 20}]}
        >
          Testing Currency Price Input
        </Text>
        <CurrencyPriceInput
          currencies={currencies}
          exchangeRates={exchangeRates}
          initialAmount="100"
          initialCurrency={currencies[0]}
        />
      </View>
    </SafeScrollContainer>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default ShowReelPage;
