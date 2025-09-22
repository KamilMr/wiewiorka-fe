import React, {useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {View, StyleSheet, Pressable} from 'react-native';
import {TextInput, Text, Menu, Surface} from 'react-native-paper';
import {convertCurrency} from '../utils/currencyUtils';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface CurrencyPriceInputProps {
  value: string;
  initialAmount?: string;
  initialCurrency?: Currency;
  currencies: Currency[];
  exchangeRates: Record<string, number>;
  disabled?: boolean;
  onAmountChange?: (value: string, converted: string) => void;
  onCurrencyChange?: (currency: Currency) => void;
}

const CurrencyPriceInput: React.FC<CurrencyPriceInputProps> = ({
  value,
  initialCurrency,
  currencies,
  exchangeRates,
  disabled = false,
  onAmountChange,
  onCurrencyChange,
}) => {
  const [baseAmount, setBaseAmount] = useState(value);

  const [selectedCurrency, setSelectedCurrency] = useState(
    initialCurrency ?? currencies[0],
  );
  const [targetCurrency, setTargetCurrency] = useState(
    initialCurrency ?? currencies[0],
  );
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [currencyPressed, setCurrencyPressed] = useState(false);
  const [conversionPressed, setConversionPressed] = useState(false);

  // Calculator mode
  const [isCalculatorMode, setIsCalculatorMode] = useState(false);
  const [calculatorExpression, setCalculatorExpression] = useState('');

  const currentAmount = value ?? baseAmount;

  const {formattedConversion, exchangeRateText} = convertCurrency(
    currentAmount,
    selectedCurrency,
    targetCurrency,
    exchangeRates,
  );

  const safeCalculate = (expression: string): number | null => {
    try {
      const cleanExpression = expression.replace('#', '').trim();
      if (!/^[0-9+\-*/.() ]+$/.test(cleanExpression))
        throw 'Invalid characters';
      const result = Function(`"use strict"; return (${cleanExpression})`)();
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result))
        throw 'Invalid result';
      return result;
    } catch {
      return null;
    }
  };

  // Handlers
  const handleAmountChange = (newValue: string) => {
    if (disabled) return;

    // Check if calculator mode should be activated/deactivated
    if (newValue.startsWith('#')) {
      setIsCalculatorMode(true);
      setCalculatorExpression(newValue);
      return;
    } else if (isCalculatorMode && !newValue.startsWith('#')) {
      setIsCalculatorMode(false);
      setCalculatorExpression('');
    }

    // Update calculator expression if in calculator mode
    if (isCalculatorMode) {
      setCalculatorExpression(newValue);
      return;
    }

    // Normal mode behavior
    const cleanValue = newValue.replace(/[^0-9.,]/g, '').replace(',', '.');
    const dotCount = (cleanValue.match(/\./g) || []).length;
    if (dotCount <= 1) {
      if (!value) setBaseAmount(cleanValue);
      const converted = convertCurrency(
        cleanValue,
        selectedCurrency,
        targetCurrency,
        exchangeRates,
      );
      onAmountChange?.(cleanValue, converted.convertedString);
    }
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    setSelectedCurrency(newCurrency);
    setShowCurrencyMenu(false);
    onCurrencyChange?.(newCurrency);
    const converted = convertCurrency(
      value,
      newCurrency,
      newCurrency.code === 'PLN' ? newCurrency : selectedCurrency,
      exchangeRates,
    );
    onAmountChange?.(value, converted.convertedString);
  };

  const swapCurrencies = () => {
    // NOTE use temp to change currency
    // const temp = selectedCurrency;
    setSelectedCurrency(targetCurrency);
    setTargetCurrency(targetCurrency);
    const converted = convertCurrency(
      value,
      selectedCurrency,
      targetCurrency,
      exchangeRates,
    );
    onAmountChange?.(converted.convertedString, converted.convertedString);
  };

  const handleConversionPress = () => {
    setConversionPressed(true);
    setTimeout(() => setConversionPressed(false), 100);
    swapCurrencies();
  };

  const handleShowCurrencyMenu = () => setShowCurrencyMenu(true);
  const handleDismissCurrencyMenu = () => setShowCurrencyMenu(false);
  const handleCurrencyPressIn = () => setCurrencyPressed(true);
  const handleCurrencyPressOut = () => setCurrencyPressed(false);
  const handleConversionPressIn = () => setConversionPressed(true);
  const handleConversionPressOut = () => setConversionPressed(false);

  const handleCalculationConfirm = () => {
    const result = safeCalculate(calculatorExpression);
    if (result !== null) {
      const resultString = result.toString();
      if (!value) setBaseAmount(resultString);
      onAmountChange?.(resultString, resultString);
    }
    setIsCalculatorMode(false);
    setCalculatorExpression('');
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setTargetCurrency(initialCurrency ?? currencies[0]);
        setSelectedCurrency(initialCurrency ?? currencies[0]);
      };
    }, []),
  );

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.mainSection}>
        {/* Pole kwoty i selektor waluty */}
        <View style={styles.inputRow}>
          <TextInput
            value={isCalculatorMode ? calculatorExpression : currentAmount}
            onChangeText={handleAmountChange}
            onSubmitEditing={handleCalculationConfirm}
            disabled={disabled}
            placeholder="0"
            keyboardType="phone-pad"
            style={styles.amountInput}
            contentStyle={styles.amountInputContent}
            underlineStyle={{height: 0}}
            mode="flat"
            dense
          />

          <Menu
            visible={showCurrencyMenu}
            onDismiss={handleDismissCurrencyMenu}
            anchor={
              <Pressable
                onPress={handleShowCurrencyMenu}
                onPressIn={handleCurrencyPressIn}
                disabled={disabled}
                onPressOut={handleCurrencyPressOut}
                style={[
                  styles.currencySelector,
                  currencyPressed && styles.currencySelectorPressed,
                ]}
              >
                <Text
                  style={[
                    styles.currencySymbol,
                    disabled && styles.disabledText,
                  ]}
                >
                  {selectedCurrency.symbol}
                </Text>
                <Text
                  style={[styles.dropdownIcon, disabled && styles.disabledText]}
                >
                  ▼
                </Text>
              </Pressable>
            }
          >
            {currencies.map(currency => (
              <Menu.Item
                key={currency.code}
                onPress={() => handleCurrencyChange(currency)}
                title={`${currency.symbol} ${currency.code}`}
                leadingIcon={
                  selectedCurrency.code === currency.code ? 'check' : undefined
                }
              />
            ))}
          </Menu>
        </View>

        {/* Conversion section */}
        {selectedCurrency.code === targetCurrency.code ? null : (
          <View style={styles.conversionSection}>
            <Pressable
              onPress={handleConversionPress}
              onPressIn={handleConversionPressIn}
              disabled={disabled}
              onPressOut={handleConversionPressOut}
              style={[
                styles.conversionButton,
                conversionPressed && styles.conversionButtonPressed,
              ]}
            >
              <Text style={styles.conversionText}>{formattedConversion}</Text>
            </Pressable>

            <Text style={styles.exchangeRate}>{exchangeRateText}</Text>
          </View>
        )}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  mainSection: {
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 28,
  },
  amountInputContent: {
    fontSize: 28,
    fontWeight: '500',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  currencySelectorPressed: {
    backgroundColor: '#F5F5F5',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '500',
    marginRight: 4,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#757575',
  },
  conversionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversionButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conversionButtonPressed: {
    backgroundColor: '#F0F0F0',
  },
  conversionText: {
    fontSize: 16,
    color: '#757575',
  },
  exchangeRate: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  disabledText: {
    color: '#BDBDBD',
    opacity: 0.6,
  },
});

export default CurrencyPriceInput;
