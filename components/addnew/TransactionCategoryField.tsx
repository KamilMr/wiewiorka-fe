import {StyleSheet, View} from 'react-native';

import {TextInput} from '@/components';
import ElementDropdown from '@/components/Dropdown';
import {sizes} from '@/constants/theme';

import {SelectRadioButtons} from './SelectRadioButtons';

interface TransactionCategoryFieldProps {
  type: string;
  isSplit: boolean;
  newCustomIncome: string | null;
  categoryValue: string;
  dropdownValue: string | undefined;
  itemsToSelect: {label: string; value: string}[];
  onIncomeModeChange: (value: string) => void;
  onCustomIncomeChange: (text: string) => void;
  onSelectCategory: (category: {label: string; value: string}) => void;
}

export const TransactionCategoryField = ({
  type,
  isSplit,
  newCustomIncome,
  categoryValue,
  dropdownValue,
  itemsToSelect,
  onIncomeModeChange,
  onCustomIncomeChange,
  onSelectCategory,
}: TransactionCategoryFieldProps) => {
  return (
    <>
      {type === 'income' && (
        <SelectRadioButtons
          items={[
            {label: 'Dodaj nową kategorię', value: 'new'},
            {label: 'Wybierz z listy', value: 'list'},
          ]}
          onSelect={onIncomeModeChange}
          selected={newCustomIncome !== null ? 'new' : 'list'}
        />
      )}

      {newCustomIncome !== null && (
        <TextInput
          style={styles.input}
          label="Nowy rodzaj wpływu"
          onChangeText={onCustomIncomeChange}
          value={categoryValue}
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
                {...(type === 'expense' ? {placeholder: 'Bez kategorii'} : {})}
                onChange={onSelectCategory}
                value={dropdownValue}
              />
            </View>
          )}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    flex: 1,
  },
  input: {
    marginVertical: sizes.xxxl,
    padding: sizes.lg,
  },
  splitIconRow: {
    marginVertical: sizes.lg,
  },
});
