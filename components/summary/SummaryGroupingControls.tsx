import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Icon} from 'react-native-paper';

import {warmColors, warmRadius} from '@/constants/warmTheme';

type Props = {
  isSubcategory: boolean;
  holidaySelected: boolean;
  onGroupingChange: (grouping: 'category' | 'subcategory') => void;
  onHolidayChange: () => void;
  onBackToCategories?: () => void;
};

const SummaryGroupingControls = ({
  isSubcategory,
  holidaySelected,
  onGroupingChange,
  onHolidayChange,
  onBackToCategories,
}: Props) => (
  <View style={styles.container}>
    <View style={styles.controlsRow}>
      <View style={styles.segmentedControl}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{selected: !isSubcategory}}
          onPress={() => onGroupingChange('category')}
          style={({pressed}) => [
            styles.segment,
            !isSubcategory && styles.activeSegment,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[styles.segmentLabel, !isSubcategory && styles.activeLabel]}
          >
            Kategorie
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{selected: isSubcategory}}
          onPress={() => onGroupingChange('subcategory')}
          style={({pressed}) => [
            styles.segment,
            isSubcategory && styles.activeSegment,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[styles.segmentLabel, isSubcategory && styles.activeLabel]}
          >
            Podkategorie
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Urlop"
        accessibilityState={{selected: holidaySelected}}
        onPress={onHolidayChange}
        style={({pressed}) => [
          styles.holidayButton,
          holidaySelected && styles.activeHolidayButton,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.holidayLabel,
            holidaySelected && styles.activeHolidayLabel,
          ]}
        >
          🏖️ Urlop
        </Text>
      </Pressable>
    </View>
    {isSubcategory && onBackToCategories ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Wróć do kategorii"
        onPress={onBackToCategories}
        style={({pressed}) => [styles.backButton, pressed && styles.pressed]}
      >
        <Icon source="arrow-left" size={16} color={warmColors.primary} />
        <Text style={styles.backLabel}>Wróć do kategorii</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmentedControl: {
    flex: 1,
    flexDirection: 'row',
    padding: 3,
    borderRadius: warmRadius.lg,
    backgroundColor: warmColors.muted,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 9,
  },
  activeSegment: {
    backgroundColor: warmColors.card,
  },
  segmentLabel: {
    color: warmColors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  activeLabel: {
    color: warmColors.primary,
  },
  holidayButton: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: warmColors.border,
    borderRadius: warmRadius.pill,
    backgroundColor: warmColors.background,
  },
  activeHolidayButton: {
    borderColor: warmColors.primary,
    backgroundColor: warmColors.primary,
  },
  holidayLabel: {
    color: warmColors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  activeHolidayLabel: {
    color: warmColors.primaryForeground,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLabel: {
    color: warmColors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});

export default SummaryGroupingControls;
