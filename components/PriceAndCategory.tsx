import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {IconButton} from 'react-native-paper';

import DropdownComponent from './Dropdown';
import TextInput from './CustomTextInput';
import {sizes, useAppTheme} from '@/constants/theme';

interface PriceAndCategoryProps {
  item: {price: string; category: string; description?: string};
  index: number;
  expenseCategories: Array<{name: string; id: number}>;
  onUpdateItem: (
    index: number,
    field: 'price' | 'category' | 'description',
    value: string,
  ) => void;
  onRemoveItem: (index: number) => void;
  canRemove: boolean;
}

const AddDescriptionButton = ({
  hasDescription,
  onPress,
}: {
  hasDescription: boolean;
  onPress: () => void;
}) => (
  <IconButton
    icon={hasDescription ? 'text-box-remove' : 'text-box-plus'}
    onPress={onPress}
    size={20}
    style={styles.addDescriptionButton}
  />
);

const PriceAndCategory = ({
  item,
  index,
  expenseCategories,
  onUpdateItem,
  onRemoveItem,
  canRemove,
}: PriceAndCategoryProps) => {
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  const t = useAppTheme();

  const itemsToSelect = expenseCategories.map(cat => ({
    label: cat.name,
    value: cat.name,
  }));

  const handleDescriptionToggle = () => {
    setShowDescriptionInput(!showDescriptionInput);
    onUpdateItem(index, 'description', '');
  };

  return (
    <View style={styles.root}>
      <View
        style={{
          flexDirection: 'row',
          position: 'absolute',
          top: -10,
          right: -10,
        }}
      >
        {canRemove && (
          <IconButton
            icon="trash-can-outline"
            size={20}
            iconColor={t.colors.error}
            onPress={() => onRemoveItem(index)}
          />
        )}
      </View>

      <View style={{flexDirection: 'row', marginVertical: sizes.md}}>
        <View style={{flex: 1, marginBottom: sizes.xl}}>
          {showDescriptionInput && (
            <TextInput
              dense
              label="Opis"
              onChangeText={text => onUpdateItem(index, 'description', text)}
              value={item.description || ''}
            />
          )}
        </View>
        <View style={styles.descriptionRow}>
          <AddDescriptionButton
            hasDescription={!!item.description || showDescriptionInput}
            onPress={handleDescriptionToggle}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <TextInput
          style={{flex: 1, marginVertical: 0, minHeight: 80, borderRadius: 2}}
          // dense
          label="Cena"
          keyboardType="numeric"
          onChangeText={text => onUpdateItem(index, 'price', text)}
          value={item.price}
        />
        <View style={{flex: 2}}>
          <DropdownComponent
            items={itemsToSelect}
            onChange={category =>
              onUpdateItem(index, 'category', category.value)
            }
            value={item.category}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    backgroundColor: 'white',
    padding: sizes.xl,
    marginVertical: sizes.md,
    borderRadius: sizes.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: sizes.md,
  },
  descriptionRow: {
    alignItems: 'flex-end',
    marginBottom: sizes.lg,
  },
  addDescriptionButton: {
    // padding: sizes.sm,
  },
  addDescriptionText: {
    fontSize: 14,
  },
});

export default PriceAndCategory;
