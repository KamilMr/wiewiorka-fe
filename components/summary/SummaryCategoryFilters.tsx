import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Icon} from 'react-native-paper';

import {warmColors, warmRadius} from '@/constants/warmTheme';

export type SummaryCategoryFilterItem = {
  id: number;
  label: string;
  color: string;
  selected: boolean;
};

type Props = {
  items: SummaryCategoryFilterItem[];
  isGrid: boolean;
  showDisplayToggle: boolean;
  hasFilters: boolean;
  onDisplayChange: () => void;
  onItemPress: (id: number) => void;
  onClearOrReset: () => void;
};

const SummaryCategoryFilters = ({
  items,
  isGrid,
  showDisplayToggle,
  hasFilters,
  onDisplayChange,
  onItemPress,
  onClearOrReset,
}: Props) => {
  const renderChips = (grid: boolean) =>
    items.map(item => (
      <Pressable
        key={item.id}
        accessibilityRole="button"
        accessibilityState={{selected: item.selected}}
        onPress={() => onItemPress(item.id)}
        style={({pressed}) => [
          styles.chip,
          grid && styles.gridChip,
          item.selected && styles.selectedChip,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.dot, {backgroundColor: item.color}]} />
        <Text
          numberOfLines={1}
          style={[
            styles.chipLabel,
            item.selected ? styles.selectedLabel : styles.excludedLabel,
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    ));

  return (
    <View style={styles.container}>
      {isGrid ? (
        <View style={styles.gridChips}>{renderChips(true)}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowChips}
        >
          {renderChips(false)}
        </ScrollView>
      )}
      <View style={styles.footer}>
        {showDisplayToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isGrid ? 'Pokaż kategorie w wierszu' : 'Pokaż kategorie w siatce'
            }
            accessibilityState={{selected: isGrid}}
            onPress={onDisplayChange}
            style={({pressed}) => [
              styles.displayButton,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              source={isGrid ? 'view-list-outline' : 'view-grid-outline'}
              size={16}
              color={warmColors.primary}
            />
            <Text style={styles.displayLabel}>
              {isGrid ? 'Pokaż jako rząd' : 'Pokaż jako siatkę'}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onClearOrReset}
          style={({pressed}) => [styles.resetButton, pressed && styles.pressed]}
        >
          <Text style={styles.resetLabel}>
            {hasFilters ? 'Usuń filtry' : 'Zaznacz wszystkie'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  rowChips: {
    flexDirection: 'row',
    gap: 8,
  },
  gridChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  displayLabel: {
    color: warmColors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  chip: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: warmColors.border,
    borderRadius: warmRadius.pill,
    backgroundColor: warmColors.background,
  },
  selectedChip: {
    borderColor: warmColors.accent,
    backgroundColor: warmColors.accent,
  },
  gridChip: {
    width: '48%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: warmRadius.pill,
  },
  chipLabel: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedLabel: {
    color: warmColors.accentForeground,
  },
  excludedLabel: {
    color: warmColors.mutedForeground,
    fontWeight: '400',
    textDecorationLine: 'line-through',
  },
  resetButton: {
    marginLeft: 'auto',
    paddingVertical: 2,
  },
  resetLabel: {
    color: warmColors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});

export default SummaryCategoryFilters;
