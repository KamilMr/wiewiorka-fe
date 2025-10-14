import {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {Surface, Divider, Chip, Button as PaperButton} from 'react-native-paper';
import {sizes} from '@/constants/theme';
import MultiSelectCategories, {Items} from './MultiSelectCategories';
import CustomDatePicker from './DatePicker';

export interface FilterState {
  categories: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  holidayTag: boolean;
}

interface FilterDrawerProps {
  visible: boolean;
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearAll: () => void;
  onClose: () => void;
  categoryItems: Items;
}

const FilterDrawer = ({
  visible,
  filters,
  onFiltersChange,
  onClearAll,
  onClose,
  categoryItems,
}: FilterDrawerProps) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  const height = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 600], // Increased for better spacing
  });

  const opacity = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, {maxHeight: height, opacity}]}>
      <Surface elevation={1} style={styles.surface}>
        {/* Date Range Section */}
        <View style={[styles.section, {flexDirection: 'row'}]}>
          <View style={{width: '50%', height: 80}}>
          <CustomDatePicker
            label="Od"
            value={filters.dateFrom}
            onChange={date => onFiltersChange({dateFrom: date || null})}
            style={styles.datePicker}
          />
          </View>
          <View style={styles.dateSpacing} />
          <View style={{width: '50%', height: 80}}>
          <CustomDatePicker
            label="Do"
            value={filters.dateTo}
            onChange={date => onFiltersChange({dateTo: date || null})}
            style={styles.datePicker}
          />
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Categories Multi-Select Section */}
        <View style={styles.section}>
          <MultiSelectCategories
            items={categoryItems}
            value={filters.categories}
            onChange={categories => onFiltersChange({categories})}
            placeholder="Wybierz kategorie"
            showDivider
          />
        </View>

        <Divider style={styles.divider} />

        {/* Holiday Tag Section */}
        <View style={styles.section}>
          <Chip
            icon={filters.holidayTag ? 'calendar-check' : 'calendar'}
            selected={filters.holidayTag}
            onPress={() => onFiltersChange({holidayTag: !filters.holidayTag})}
            mode={filters.holidayTag ? 'flat' : 'outlined'}
            style={styles.holidayChip}
          >
            Urlop
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <PaperButton
            mode="outlined"
            onPress={onClose}
            icon="close"
            style={styles.closeButton}
          >
            Zamknij
          </PaperButton>
          <PaperButton
            mode="outlined"
            onPress={onClearAll}
            icon="filter-remove"
            style={styles.clearButton}
          >
            Wyczyść filtry
          </PaperButton>
        </View>
      </Surface>
    </Animated.View>
  );
};

export default FilterDrawer;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    marginBottom: sizes.md,
  },
  surface: {
    padding: sizes.lg,
    borderRadius: sizes.sm,
  },
  section: {
    marginVertical: sizes.md,
  },
  datePicker: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  dateSpacing: {
    height: sizes.md,
  },
  divider: {
    marginVertical: sizes.md,
  },
  holidayChip: {
    alignSelf: 'flex-start',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: sizes.sm,
    marginTop: sizes.sm,
  },
  closeButton: {
    flex: 1,
  },
  clearButton: {
    flex: 1,
    borderColor: '#d32f2f',
  },
});
