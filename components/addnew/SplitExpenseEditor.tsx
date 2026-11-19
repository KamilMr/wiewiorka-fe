import {StyleSheet, View} from 'react-native';
import {Button} from 'react-native-paper';

import PriceAndCategory from '@/components/PriceAndCategory';
import {sizes} from '@/constants/theme';
import type {AddNewForm, SplitItem} from '@/utils/addNewFormUtils';

import {RemainingAmountDisplay} from './RemainingAmountDisplay';

interface SplitExpenseEditorProps {
  totalPrice: AddNewForm['price'];
  splitItems: SplitItem[];
  expenseCategories: {name: string; id: number}[];
  onUpdateItem: (
    index: number,
    field: 'price' | 'category' | 'description',
    value: string,
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

export const SplitExpenseEditor = ({
  totalPrice,
  splitItems,
  expenseCategories,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
}: SplitExpenseEditorProps) => {
  return (
    <View style={styles.splitContainer}>
      <RemainingAmountDisplay totalPrice={totalPrice} splitItems={splitItems} />
      {splitItems.map((item, index) => (
        <PriceAndCategory
          key={index}
          item={item}
          index={index}
          expenseCategories={expenseCategories}
          onUpdateItem={onUpdateItem}
          onRemoveItem={onRemoveItem}
          canRemove={splitItems.length > 2}
        />
      ))}
      <Button
        mode="text"
        onPress={onAddItem}
        style={styles.addSplitButton}
        icon="plus"
      >
        Dodaj pozycję
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  addSplitButton: {
    marginTop: sizes.sm,
  },
  splitContainer: {
    marginVertical: sizes.lg,
    padding: sizes.md,
    borderRadius: sizes.lg,
  },
});
