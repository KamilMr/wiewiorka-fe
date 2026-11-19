import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {IconButton, Switch, Text} from 'react-native-paper';

import {sizes} from '@/constants/theme';

interface TransactionTypeControlsProps {
  type: string;
  isPasRecord: boolean;
  isSplit: boolean;
  isSplitDisabled: boolean;
  hasVacationTag: boolean;
  onSelectType: (type: string) => void;
  onSplitToggle: () => void;
  onVacationTagToggle: () => void;
}

export const TransactionTypeControls = ({
  type,
  isPasRecord,
  isSplit,
  isSplitDisabled,
  hasVacationTag,
  onSelectType,
  onSplitToggle,
  onVacationTagToggle,
}: TransactionTypeControlsProps) => {
  return (
    <View style={styles.switchContainer}>
      <Text variant="bodyLarge">Wydatek</Text>
      <Switch
        value={type === 'income'}
        onValueChange={value => onSelectType(value ? 'income' : 'expense')}
        disabled={isPasRecord}
      />
      <Text variant="bodyLarge">Przychód</Text>
      <IconButton
        icon={isSplit ? 'call-merge' : 'call-split'}
        onPress={onSplitToggle}
        disabled={isSplitDisabled}
        size={20}
        style={styles.splitToggleButton}
      />
      {type === 'expense' && !isSplit && (
        <TouchableOpacity
          onPress={onVacationTagToggle}
          style={styles.vacationToggleButton}
          accessibilityRole="button"
          accessibilityLabel="Urlop"
          accessibilityState={{selected: hasVacationTag}}
        >
          <Text
            style={[styles.vacationEmoji, {opacity: hasVacationTag ? 1 : 0.3}]}
          >
            🏖️
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: sizes.md,
    marginVertical: sizes.lg,
  },
  splitToggleButton: {
    margin: 0,
    marginLeft: sizes.xl,
    padding: sizes.xs,
    width: 50,
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
