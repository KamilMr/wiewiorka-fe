import {View, StyleSheet} from 'react-native';
import {RadioButton} from 'react-native-paper';

import Text from '@/components/CustomText';
import {sizes} from '@/constants/theme';

interface SelectRadioButtonsProps {
  items: {label: string; value: string}[];
  selected: string;
  disabled?: boolean;
  onSelect: (value: string) => void;
}

export const SelectRadioButtons = ({
  items,
  selected,
  onSelect,
  disabled = false,
}: SelectRadioButtonsProps) => {
  return (
    <View style={styles.radioButtons}>
      {items.map(item => (
        <View key={item.value} style={styles.radioButton}>
          <Text>{item.label}</Text>
          <RadioButton
            disabled={disabled}
            value={item.value}
            status={selected === item.value ? 'checked' : 'unchecked'}
            onPress={() => onSelect(item.value)}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  radioButtons: {
    marginVertical: sizes.xl,
    flexDirection: 'row',
  },
  radioButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
});
