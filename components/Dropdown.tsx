import {useState, useRef} from 'react';
import {StyleSheet, Text, View, TextInput} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {DropdownProps} from 'react-native-element-dropdown/lib/typescript/components/Dropdown/model';
import {useGradualAnimation} from '@/hooks';
import {sizes, useAppTheme} from '@/constants/theme';

export type Items = Array<{label: string; value: string}>;

interface Props {
  items: Items;
  onChange: (item: {label: string; value: string}) => void;
  value?: string;
  label?: string;
  offset: number;
}

type CombinedProps = Props & DropdownProps<any>;

const DropdownComponent = ({
  items,
  onChange,
  value: propValue,
  label,
  offset = 0,
  ...rest
}: CombinedProps) => {
  const theme = useAppTheme();

  // Standard dropdown state for focus styling
  const [isFocus, setIsFocus] = useState(false);

  // Ref to measure dropdown container position
  const droRef = useRef(null);

  const [dropdownBottomY, setDropdownBottomY] = useState(0);

  const {adjustedMargin} = useGradualAnimation(dropdownBottomY);

  // Standard label rendering logic
  const renderLabel = () => {
    if (propValue || isFocus) {
      return (
        <Text style={[styles.label, isFocus && {color: theme.colors.primary}]}>
          {label ?? 'Wybierz'}
        </Text>
      );
    }
    return null;
  };

  // Standard focus handlers for dropdown styling
  const handleFocus = () => setIsFocus(true);
  const handleBlur = () => setIsFocus(false);

  const measureWrapper = () => {
    droRef?.current?.measure((x, y, width, height, pageX, pageY) => {
      const bottomY = pageY + height;
      setDropdownBottomY(bottomY);
    });
  };

  return (
    <View ref={droRef} style={[styles.container]} onLayout={measureWrapper}>
      {renderLabel()}
      <View
        style={[
          styles.dropdownContainer,
          {borderColor: theme.colors.outline},
          isFocus && {borderColor: theme.colors.primary},
        ]}
      >
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          containerStyle={{
            marginBottom: adjustedMargin > 0 ? adjustedMargin + offset : 0,
          }}
          inputSearchStyle={styles.inputSearchStyle}
          dropdownPosition="top"
          iconStyle={styles.iconStyle}
          data={items}
          search
          renderInputSearch={onSearch => (
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              onChangeText={onSearch}
              autoFocus
            />
          )}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? 'Select item' : '...'}
          searchPlaceholder="Search..."
          value={propValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={item => {
            onChange(item);
            setIsFocus(false);
          }}
          {...rest}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: sizes.lg,
  },
  dropdownContainer: {
    borderWidth: 0.8,
    minHeight: 80,
    borderRadius: sizes.sm,
    backgroundColor: '#ffffff',
    paddingVertical: sizes.sm,
    paddingHorizontal: sizes.md,
    justifyContent: 'center',
  },
  dropdown: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: sizes.sm,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 20,
  },
  selectedTextStyle: {
    fontSize: 20,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    minHeight: 56,
    fontSize: 20,
  },
  searchInput: {
    minHeight: 56,
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: sizes.sm,
    paddingHorizontal: sizes.md,
    margin: sizes.sm,
    backgroundColor: '#ffffff',
  },
});

export default DropdownComponent;
