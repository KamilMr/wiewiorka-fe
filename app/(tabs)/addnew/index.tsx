import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import _ from 'lodash';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from 'expo-router';
import {formatDate} from 'date-fns';
import {View, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import {Button, IconButton, Switch, Text} from 'react-native-paper';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';

import {
  ButtonWithStatus,
  DatePicker,
  PriceAndCategory,
  TextInput,
} from '@/components';
import {CurrencyPriceInput} from '@/components';
import {SelectRadioButtons} from '@/components/addnew/SelectRadioButtons';
import {RemainingAmountDisplay} from '@/components/addnew/RemainingAmountDisplay';
import {sizes} from '@/constants/theme';
import {
  addNewExpense,
  deleteExpenseLocal,
  deleteIncome,
  updateExpense,
  addNewIncome,
  updateIncome,
  fetchExchangeRate,
} from '@/redux/main/thunks';
import {useAppDispatch, useAppSelector} from '@/hooks';
import {
  selectCategoriesByUsage,
  selectExpense,
  selectIncome,
  selectSources,
  selectLatestExchangeRate,
} from '@/redux/main/selectors';
import {Expense} from '@/types';
import ElementDropdown from '@/components/Dropdown';

const initState = (date = new Date(), categories: any[] = []) => ({
  description: '',
  date,
  price: ['', ''],
  category: categories[0]?.name,
});

const initSplitItem = () => ({
  price: '',
  category: '',
  description: '',
});

export default function AddNew() {
  const expenseCategories = useAppSelector(selectCategoriesByUsage);
  const incomeCategories = useAppSelector(selectSources) || [];
  const eurRate = useAppSelector(selectLatestExchangeRate('EUR'));
  const {id, type: incomingType = ''} = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const [type, setType] = useState<string>('expense');
  const [newCustomIncome, setNewCustomIncome] = useState<string | null>(null);
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [splitItems, setSplitItems] = useState<
    Array<{price: string; category: string; description: string}>
  >([initSplitItem(), initSplitItem()]);
  const [hasVacationTag, setHasVacationTag] = useState<boolean>(false);

  // Manual exchange rates state (when user edits)
  const [manualExchangeRates, setManualExchangeRates] = useState<Record<
    string,
    number
  > | null>(null);

  // Calculate exchange rates - prioritize manual edits over NBP data
  const exchangeRates = useMemo(() => {
    // If user has manually edited rates, use those
    if (manualExchangeRates) {
      console.log(
        '[AddNew] Using manually edited exchange rates:',
        manualExchangeRates,
      );
      return manualExchangeRates;
    }

    // Otherwise use NBP data or fallback
    const rates = {
      PLN_EUR: 0.23, // fallback
      EUR_PLN: 4.35, // fallback
    };

    if (eurRate?.rate) {
      rates.EUR_PLN = eurRate.rate;
      rates.PLN_EUR = 1 / eurRate.rate;
      console.log('[AddNew] Using NBP exchange rates:', {
        EUR_PLN: rates.EUR_PLN,
        PLN_EUR: rates.PLN_EUR.toFixed(4),
        date: eurRate.date,
      });
    } else {
      console.log('[AddNew] Using fallback exchange rates');
    }

    return rates;
  }, [eurRate, manualExchangeRates]);

  // Currency data for CurrencyPriceInput
  const currencies = [
    {code: 'PLN', symbol: 'zł', name: 'Polski Złoty'},
    {code: 'EUR', symbol: '€', name: 'Euro'},
  ];

  const focusRef = useRef<any>(null);
  const dirty = useRef({});
  const dirtyTag = useRef<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isPasRecord = isNaN(+id) ? false : true;

  // logic when editing an existing record
  const record = useAppSelector(state =>
    incomingType === 'expense'
      ? selectExpense(+id)(state)
      : selectIncome(+id)(state),
  );
  const [form, setForm] = useState(initState(new Date(), expenseCategories));

  const isDataTheSame = () => {
    const formSame = _.isEqual(dirty.current, form);
    const tagSame = hasVacationTag === dirtyTag.current;
    return formSame && tagSame;
  };

  const cleanState = () => {
    setForm(initState(new Date(), expenseCategories));
    dirty.current = {};
    dirtyTag.current = false;
    setNewCustomIncome(null);
    setType('expense');
    setIsSplit(false);
    setSplitItems([initSplitItem(), initSplitItem()]);
    setManualExchangeRates(null); // Reset to NBP rates
    setHasVacationTag(false);
  };

  useFocusEffect(
    useCallback(() => {
      // set focus
      if (focusRef.current) {
        setTimeout(() => {
          if (!focusRef.current) return;
          focusRef.current.focus();
        }, 200);
      }

      // Fetch EUR exchange rate (with built-in daily caching)
      console.log('[AddNew] Triggering EUR exchange rate fetch...');
      dispatch(fetchExchangeRate({currencyCode: 'EUR'}));

      return () => {
        if (focusRef.current) {
          focusRef.current.blur();
        }
      };
    }, []),
  );

  useEffect(() => {
    if (
      incomingType &&
      typeof incomingType === 'string' &&
      incomingType !== 'undefined'
    ) {
      setType(incomingType);
    }
  }, [incomingType]);

  useFocusEffect(
    useCallback(() => {
      if (!record) return;
      const priceString = record?.price.toString() || '';
      const tR = {
        description: record?.description || '',
        date:
          incomingType === 'income'
            ? new Date(record?.date)
            : new Date(record.date.split('/').reverse().join('-')),
        price: [priceString, priceString],
        category: 'source' in record ? record.source : record.category || '',
      };
      setForm(tR);
      dirty.current = tR;

      // Set vacation tag checkbox if editing expense with vacation tag
      if (incomingType === 'expense' && 'tags' in record) {
        const hasVacation = record.tags?.some(tag => tag.name === 'urlop') || false;
        setHasVacationTag(hasVacation);
        dirtyTag.current = hasVacation;
      }
    }, [id]),
  );

  useFocusEffect(
    useCallback(() => {
      // clean up params
      const unsubscribe = navigation.addListener('blur', () => {
        navigation.setParams({id: undefined, type: undefined});
        cleanState();
      });

      return unsubscribe;
    }, []),
  );

  const itemsToSelect =
    type === 'expense'
      ? expenseCategories.map(cat => ({label: cat.name, value: cat.name}))
      : incomeCategories
          .map((item: string) => ({label: item, value: item}))
          .sort((a, b) => a.label.localeCompare(b.label));

  const handleSelectCategory = (category: {label: string; value: string}) => {
    if (category.value === 'Dodaj nową kategorię') {
    } else {
      setForm({...form, category: category.value});
      if (!form.price[0]) return focusRef.current?.focus();
      focusRef.current?.blur();
      buttonRef.current?.focus();
    }
  };

  const handleSelectType = (type: string) => {
    setType(type);
    setForm({...form, category: ''});
    setIsSplit(false);
    setSplitItems([initSplitItem(), initSplitItem()]);
  };

  const handleSplitToggle = () => {
    if (!isSplit && form.price[0]) {
      const totalPrice = parseFloat(form.price[0]);
      const halfPrice = (totalPrice / 2).toString();
      setSplitItems([
        {price: halfPrice, category: form.category, description: ''},
        {price: halfPrice, category: '', description: ''},
      ]);
    }
    setIsSplit(!isSplit);
  };

  const updateSplitItem = (
    index: number,
    field: 'price' | 'category' | 'description',
    value: string,
  ) => {
    const newSplitItems = [...splitItems];
    newSplitItems[index] = {...newSplitItems[index], [field]: value};
    setSplitItems(newSplitItems);
  };

  const addSplitItem = () => {
    setSplitItems([...splitItems, initSplitItem()]);
  };

  const removeSplitItem = (index: number) => {
    if (splitItems.length > 2) {
      setSplitItems(splitItems.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (isSplit && type === 'expense') {
      // For split items, validate each split item has price and category
      const hasValidItems = splitItems.every(
        item => item.price && item.category,
      );
      // Check if all money is allocated (no remaining amount)
      const totalSplitPrice = splitItems.reduce(
        (sum, item) => sum + (+item.price || 0),
        0,
      );
      const remainingAmount = (+form.price[0] || 0) - totalSplitPrice;
      return hasValidItems && remainingAmount === 0;
    }

    // For non-split items, price and category are required
    if (!form.price[0] || !form.category) {
      return false;
    }

    return true;
  };

  const handleNavigateBack = () => {
    setForm(initState(new Date(), expenseCategories));
    dirty.current = {};
    router.navigate('/(tabs)/records');
  };

  const handleSave = async () => {
    if (type === 'expense' && isSplit) {
      // Handle split expenses - save multiple expenses
      const savePromises = splitItems.map(item => {
        const dataToSave: Pick<
          Expense,
          'id' | 'date' | 'price' | 'categoryId' | 'description' | 'tags'
        > = {
          id: '',
          date: formatDate(form.date, 'yyyy-MM-dd'),
          price: +item.price,
          categoryId:
            expenseCategories.find(cat => cat.name === item.category)?.id || 0,
          tags: hasVacationTag ? ['urlop'] : [],
        };
        if (item.description) dataToSave.description = item.description;
        return dispatch(addNewExpense(dataToSave));
      });

      try {
        await Promise.all(savePromises);
        setForm(initState(new Date(), expenseCategories));
        setIsSplit(false);
        setSplitItems([initSplitItem(), initSplitItem()]);
        router.navigate('/(tabs)/records');
      } catch (error) {}
    } else {
      // Handle single expense or income
      let dataToSave;
      if (type === 'expense') {
        const {description, date, price} = form;
        dataToSave = {
          id: id ? +id : '',
          description,
          date: formatDate(date, 'yyyy-MM-dd'),
          price: +price[0],
          categoryId:
            expenseCategories.find(cat => cat.name === form.category)?.id || 0,
          tags: hasVacationTag ? ['urlop'] : [],
        };

        dataToSave = _.omitBy(dataToSave, v => typeof v === 'string' && !v);
      } else {
        dataToSave = {
          id: id ? +id : '',
          date: formatDate(form.date, 'yyyy-MM-dd'),
          price: +form.price[0],
          source: form.category,
          vat: 0,
        };
        dataToSave = _.omitBy(dataToSave, v => typeof v === 'string' && !v);
      }
      dispatch(
        type === 'expense'
          ? isPasRecord
            ? updateExpense(dataToSave)
            : addNewExpense(dataToSave)
          : isPasRecord
            ? updateIncome(dataToSave)
            : addNewIncome(dataToSave),
      );
      setForm(initState(new Date(), expenseCategories));
      router.navigate('/(tabs)/records');
    }
  };

  const handleDelete = () => {
    Alert.alert('Potwierdź usunięcie', 'Czy na pewno chcesz usunąć ten wpis?', [
      {
        text: 'Anuluj',
        style: 'cancel',
      },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          if (type === 'expense') dispatch(deleteExpenseLocal(id as string));
          else dispatch(deleteIncome(id as string));
          router.navigate('/(tabs)/records');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          {!isSplit && (
            <TextInput
              style={styles.input}
              label={'Opis'}
              multiline
              onChangeText={text => setForm({...form, description: text})}
              value={form.description}
            />
          )}

          <View style={styles.datePickerContainer}>
            <DatePicker
              label="Wybierz Datę"
              variant="text"
              onChange={date => date && setForm({...form, date})}
              value={form.date}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text variant="bodyLarge">Wydatek</Text>
            <Switch
              value={type === 'income'}
              onValueChange={value =>
                handleSelectType(value ? 'income' : 'expense')
              }
              disabled={isPasRecord}
            />
            <Text variant="bodyLarge">Przychód</Text>
            <IconButton
              icon={isSplit ? 'call-merge' : 'call-split'}
              onPress={handleSplitToggle}
              disabled={(!form.price[0] && !isSplit) || type !== 'expense'}
              size={20}
              style={styles.splitToggleButton}
            />
            {type === 'expense' && !isSplit && (
              <TouchableOpacity
                onPress={() => setHasVacationTag(!hasVacationTag)}
                style={styles.vacationToggleButton}
              >
                <Text
                  style={[
                    styles.vacationEmoji,
                    {opacity: hasVacationTag ? 1 : 0.3},
                  ]}
                >
                  🏖️
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {(type === 'expense' || type === 'income') && (
            <View style={styles.priceInputRow}>
              <View style={styles.currencyInputContainer}>
                <CurrencyPriceInput
                  value={form.price[1]}
                  currencies={currencies}
                  disabled={isSplit}
                  exchangeRates={exchangeRates}
                  initialCurrency={currencies[0]}
                  onAmountChange={(value, converted) =>
                    setForm({...form, price: [converted, value]})
                  }
                  onExchangeRateChange={newRates => {
                    console.log(
                      '[AddNew] Manual exchange rate change:',
                      newRates,
                    );
                    setManualExchangeRates(newRates);
                  }}
                />
              </View>
            </View>
          )}

          {/* Add new category  selection */}
          {type === 'income' && (
            <SelectRadioButtons
              items={[
                {label: 'Dodaj nową kategorię', value: 'new'},
                {label: 'Wybierz z listy', value: 'list'},
              ]}
              onSelect={value => {
                if (value === 'new') {
                  setNewCustomIncome('');
                } else {
                  setNewCustomIncome(null);
                }
                setForm({...form, category: ''});
              }}
              selected={newCustomIncome !== null ? 'new' : 'list'}
            />
          )}

          {/* Add new category  input */}
          {newCustomIncome !== null && (
            <TextInput
              style={styles.input}
              label="Nowy rodzaj wpływu"
              onChangeText={text => setForm({...form, category: text})}
              value={form.category}
            />
          )}

          {!isSplit && (
            <View style={styles.splitIconRow}>
              {(type === 'expense' ||
                (type === 'income' && newCustomIncome === null)) && (
                <View style={styles.dropdownContainer}>
                  <ElementDropdown
                    items={itemsToSelect}
                    showDivider={type === 'expense'}
                    keyboardShouldPersistTaps="handled"
                    dropdownPosition="top"
                    onChange={handleSelectCategory}
                    value={
                      type === 'income'
                        ? form.category
                        : expenseCategories.find(
                            cat => cat.name === form.category,
                          )?.name
                    }
                  />
                </View>
              )}
            </View>
          )}

          {isSplit && type === 'expense' && (
            <View style={styles.splitContainer}>
              <RemainingAmountDisplay
                totalPrice={form.price}
                splitItems={splitItems}
              />
              {splitItems.map((item, index) => (
                <PriceAndCategory
                  key={index}
                  item={item}
                  index={index}
                  expenseCategories={expenseCategories}
                  onUpdateItem={updateSplitItem}
                  onRemoveItem={removeSplitItem}
                  canRemove={splitItems.length > 2}
                />
              ))}
              <Button
                mode="text"
                onPress={addSplitItem}
                style={styles.addSplitButton}
                icon="plus"
              >
                Dodaj pozycję
              </Button>
            </View>
          )}
        </View>
        <View>
          {id ? (
            <ButtonWithStatus textColor="red" onPress={handleDelete}>
              Usuń
            </ButtonWithStatus>
          ) : null}
          <ButtonWithStatus onPress={handleNavigateBack}>
            Przerwij
          </ButtonWithStatus>
          <ButtonWithStatus
            ref={buttonRef}
            showLoading
            mode="contained"
            disabled={!validateForm() || isDataTheSame()}
            onPress={handleSave}
          >
            {isPasRecord ? 'Zapisz zmiany' : 'Zapisz'}
          </ButtonWithStatus>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: sizes.lg,
  },
  datePickerContainer: {
    padding: 0,
    marginVertical: sizes.lg,
    minHeight: 80,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: sizes.md,
    marginVertical: sizes.lg,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencyInputContainer: {
    width: '100%',
  },
  splitToggleButton: {
    margin: 0,
    marginLeft: sizes.xl,
    padding: sizes.xs,
    width: 50,
  },
  dropdownContainer: {
    flex: 1,
  },
  addSplitButton: {
    marginTop: sizes.sm,
  },
  input: {
    marginVertical: sizes.xxxl,
    padding: sizes.lg,
  },
  splitContainer: {
    marginVertical: sizes.lg,
    padding: sizes.md,
    borderRadius: sizes.lg,
  },
  splitIconRow: {
    marginVertical: sizes.lg,
  },
  splitCancelSection: {
    marginVertical: sizes.lg,
    alignItems: 'center',
  },
  vacationToggleButton: {
    margin: 0,
    marginLeft: sizes.sm,
    padding: sizes.xs,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacationEmoji: {
    fontSize: 24,
  },
});
