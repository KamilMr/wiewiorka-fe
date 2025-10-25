import React, {useState, useRef} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {View, StyleSheet, Pressable, TouchableOpacity} from 'react-native';
import {
  TextInput,
  Text,
  Menu,
  Surface,
  Dialog,
  Button,
  Portal,
} from 'react-native-paper';
import {convertCurrency} from '../utils/currencyUtils';
import {RateType} from '../types/nbpTypes';

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
  onExchangeRateChange?: (newRates: Record<string, number>) => void;
  // New props for rate type selection
  rateType?: RateType;
  onRateTypeChange?: (rateType: RateType) => void;
  showRateTypeSelector?: boolean;
}

const CurrencyPriceInput: React.FC<CurrencyPriceInputProps> = ({
  value,
  initialCurrency,
  currencies,
  exchangeRates,
  disabled = false,
  onAmountChange,
  onCurrencyChange,
  onExchangeRateChange,
  rateType = 'mid',
  onRateTypeChange,
  showRateTypeSelector = false,
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
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [editRateValue, setEditRateValue] = useState('');
  const [showRateTypeMenu, setShowRateTypeMenu] = useState(false);

  // Calculator mode
  const [isCalculatorMode, setIsCalculatorMode] = useState(false);
  const [calculatorExpression, setCalculatorExpression] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<any>(null);

  const currentAmount = value ?? baseAmount;

  const {formattedConversion, exchangeRateText} = convertCurrency(
    currentAmount,
    selectedCurrency,
    targetCurrency,
    exchangeRates,
    rateType,
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
      // User deleted the # - exit calculator mode
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
        rateType,
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
      rateType,
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
      rateType,
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

  const insertOperator = (operator: string) => {
    if (disabled) return;

    if (!isCalculatorMode && currentAmount) {
      // Start calculator mode with current value
      setIsCalculatorMode(true);
      setCalculatorExpression(`#${currentAmount}${operator}`);
    } else if (isCalculatorMode) {
      // Add operator to expression
      setCalculatorExpression(prev => `${prev}${operator}`);
    } else {
      // Start calculator mode fresh
      setIsCalculatorMode(true);
      setCalculatorExpression(`#${operator}`);
    }
    inputRef.current?.focus();
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setTargetCurrency(initialCurrency ?? currencies[0]);
        setSelectedCurrency(initialCurrency ?? currencies[0]);
        setIsEditingRate(false);
        setEditRateValue('');
        setIsFocused(false);
        setIsCalculatorMode(false);
        setCalculatorExpression('');
      };
    }, []),
  );

  return (
    <>
      <Surface style={styles.container} elevation={1}>
        <View style={styles.mainSection}>
          {/* Pole kwoty i selektor waluty */}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              value={isCalculatorMode ? calculatorExpression : currentAmount}
              onChangeText={handleAmountChange}
              onSubmitEditing={handleCalculationConfirm}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              placeholder="0"
              keyboardType="phone-pad"
              style={styles.amountInput}
              contentStyle={styles.amountInputContent}
              underlineStyle={{height: 0}}
              mode="flat"
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
                    style={[
                      styles.dropdownIcon,
                      disabled && styles.disabledText,
                    ]}
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
                    selectedCurrency.code === currency.code
                      ? 'check'
                      : undefined
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

              <Pressable
                onPress={() => {
                  if (disabled) return;
                  const rateKey = `${selectedCurrency.code}_${targetCurrency.code}`;
                  const currentRate = exchangeRates[rateKey] || 1.0;
                  setEditRateValue(currentRate.toString());
                  setIsEditingRate(true);
                }}
                style={styles.exchangeRateButton}
              >
                <Text>{exchangeRateText}</Text>
              </Pressable>
            </View>
          )}

          {/* Rate Type Selector - only show for EUR/PLN conversions */}
          {showRateTypeSelector && 
           (selectedCurrency.code === 'EUR' || targetCurrency.code === 'EUR') && (
            <View style={styles.rateTypeSection}>
              <Text style={styles.rateTypeLabel}>Typ kursu:</Text>
              <Menu
                visible={showRateTypeMenu}
                onDismiss={() => setShowRateTypeMenu(false)}
                anchor={
                  <Pressable
                    onPress={() => setShowRateTypeMenu(true)}
                    disabled={disabled}
                    style={styles.rateTypeSelector}
                  >
                    <Text style={styles.rateTypeText}>
                      {rateType === 'bid' ? 'Kupno' : rateType === 'ask' ? 'Sprzedaż' : 'Średni'}
                    </Text>
                    <Text style={styles.dropdownIcon}>▼</Text>
                  </Pressable>
                }
              >
                <Menu.Item
                  onPress={() => {
                    onRateTypeChange?.('bid');
                    setShowRateTypeMenu(false);
                  }}
                  title="Kupno"
                  leadingIcon={rateType === 'bid' ? 'check' : undefined}
                />
                <Menu.Item
                  onPress={() => {
                    onRateTypeChange?.('ask');
                    setShowRateTypeMenu(false);
                  }}
                  title="Sprzedaż"
                  leadingIcon={rateType === 'ask' ? 'check' : undefined}
                />
                <Menu.Item
                  onPress={() => {
                    onRateTypeChange?.('mid');
                    setShowRateTypeMenu(false);
                  }}
                  title="Średni"
                  leadingIcon={rateType === 'mid' ? 'check' : undefined}
                />
              </Menu>
            </View>
          )}
        </View>

        {/* Calculator Accessory Bar */}
        {isFocused && !disabled && (
          <View style={styles.calculatorBar}>
            <TouchableOpacity
              style={styles.calcButton}
              onPress={() => insertOperator('+')}
            >
              <Text style={styles.calcButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calcButton}
              onPress={() => insertOperator('-')}
            >
              <Text style={styles.calcButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calcButton}
              onPress={() => insertOperator('*')}
            >
              <Text style={styles.calcButtonText}>×</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calcButton}
              onPress={() => insertOperator('/')}
            >
              <Text style={styles.calcButtonText}>÷</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.calcButton, styles.calcButtonEquals]}
              onPress={handleCalculationConfirm}
            >
              <Text style={[styles.calcButtonText, styles.calcButtonEqualsText]}>
                =
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Surface>

      <Portal>
        <Dialog
          visible={isEditingRate}
          onDismiss={() => {
            setIsEditingRate(false);
            setEditRateValue('');
          }}
          dismissable={true}
        >
          <Dialog.Title>Edit Exchange Rate</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              1 {selectedCurrency.code} = ? {targetCurrency.code}
            </Text>
            <TextInput
              value={editRateValue}
              onChangeText={setEditRateValue}
              keyboardType="numeric"
              placeholder="Enter exchange rate"
              style={styles.rateInput}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setIsEditingRate(false);
                setEditRateValue('');
              }}
            >
              Anuluj
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                const newRate = parseFloat(editRateValue);
                if (!isNaN(newRate) && newRate > 0) {
                  const rateKey = `${selectedCurrency.code}_${targetCurrency.code}`;
                  const reverseRateKey = `${targetCurrency.code}_${selectedCurrency.code}`;
                  const newRates = {
                    ...exchangeRates,
                    [rateKey]: newRate,
                    [reverseRateKey]: 1 / newRate,
                  };
                  onExchangeRateChange?.(newRates);
                  const converted = convertCurrency(
                    value,
                    selectedCurrency,
                    targetCurrency,
                    newRates,
                    rateType,
                  );
                  onAmountChange?.(value, converted.convertedString);
                }
                setIsEditingRate(false);
                setEditRateValue('');
              }}
            >
              Potwierdź
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
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
  exchangeRateButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  dialogText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  rateInput: {
    marginTop: 8,
  },
  disabledText: {
    color: '#BDBDBD',
    opacity: 0.6,
  },
  calculatorBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    gap: 8,
  },
  calcButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calcButtonEquals: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  calcButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
  },
  calcButtonEqualsText: {
    color: '#FFFFFF',
  },
  rateTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  rateTypeLabel: {
    fontSize: 14,
    color: '#757575',
  },
  rateTypeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  rateTypeText: {
    fontSize: 14,
    marginRight: 4,
  },
});

export default CurrencyPriceInput;
