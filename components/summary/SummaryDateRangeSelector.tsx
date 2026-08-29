import {useState} from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {Icon} from 'react-native-paper';
import {
  DatePickerModal,
  pl,
  registerTranslation,
} from 'react-native-paper-dates';
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns';
import {pl as dateFnsPl} from 'date-fns/locale';

import {warmColors} from '@/constants/warmTheme';

registerTranslation('pl', pl);

type DateTarget = 'start' | 'end';
type Preset =
  | 'currentMonth'
  | 'previousMonth'
  | 'lastSixMonths'
  | 'currentYear';

type Props = {
  value: [Date, Date];
  onChange: (value: [Date, Date]) => void;
  style?: StyleProp<ViewStyle>;
};

const presets: {id: Preset; label: string}[] = [
  {id: 'currentMonth', label: 'Ten miesiąc'},
  {id: 'previousMonth', label: 'Poprzedni miesiąc'},
  {id: 'lastSixMonths', label: 'Ostatnie 6 miesięcy'},
  {id: 'currentYear', label: 'Ten rok'},
];

const getPresetDates = (preset: Preset): [Date, Date] => {
  const today = new Date();
  const previousMonth = subMonths(today, 1);

  switch (preset) {
    case 'previousMonth':
      return [startOfMonth(previousMonth), endOfMonth(previousMonth)];
    case 'lastSixMonths':
      return [startOfMonth(subMonths(today, 5)), endOfMonth(today)];
    case 'currentYear':
      return [startOfYear(today), endOfYear(today)];
    case 'currentMonth':
    default:
      return [startOfMonth(today), endOfMonth(today)];
  }
};

const DateField = ({
  label,
  date,
  onPress,
}: {
  label: string;
  date: Date;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label}: ${format(date, 'd MMMM yyyy', {locale: dateFnsPl})}`}
    onPress={onPress}
    style={({pressed}) => [styles.dateField, pressed && styles.pressed]}
  >
    <Icon
      source="calendar-blank-outline"
      size={13}
      color={warmColors.mutedForeground}
    />
    <View style={styles.dateTextContainer}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.dateValue}>
        {format(date, 'd MMM yyyy', {locale: dateFnsPl})}
      </Text>
    </View>
  </Pressable>
);

const SummaryDateRangeSelector = ({value, onChange, style}: Props) => {
  const [pickerTarget, setPickerTarget] = useState<DateTarget | null>(null);
  const [presetsVisible, setPresetsVisible] = useState(false);
  const [activePreset, setActivePreset] = useState<Preset | null>(null);

  const handleDateConfirm = ({date}: {date: Date | undefined}) => {
    if (date && pickerTarget) {
      onChange(pickerTarget === 'start' ? [date, value[1]] : [value[0], date]);
      setActivePreset(null);
    }
    setPickerTarget(null);
  };

  const handlePresetPress = (preset: Preset) => {
    onChange(getPresetDates(preset));
    setActivePreset(preset);
    setPresetsVisible(false);
  };

  return (
    <>
      <View style={[styles.container, style]}>
        <View style={styles.dateRow}>
          <DateField
            label="Start"
            date={value[0]}
            onPress={() => setPickerTarget('start')}
          />
          <Icon
            source="arrow-right"
            size={14}
            color={warmColors.mutedForeground}
          />
          <DateField
            label="Koniec"
            date={value[1]}
            onPress={() => setPickerTarget('end')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pokaż gotowe zakresy dat"
            accessibilityState={{expanded: presetsVisible}}
            onPress={() => setPresetsVisible(visible => !visible)}
            style={({pressed}) => [
              styles.presetsButton,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              source="history"
              size={17}
              color={warmColors.primaryForeground}
            />
          </Pressable>
        </View>

        {presetsVisible ? (
          <View style={styles.presetsGrid}>
            {presets.map(preset => {
              const isActive = activePreset === preset.id;

              return (
                <Pressable
                  key={preset.id}
                  accessibilityRole="button"
                  accessibilityState={{selected: isActive}}
                  onPress={() => handlePresetPress(preset.id)}
                  style={({pressed}) => [
                    styles.preset,
                    isActive && styles.activePreset,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetLabel,
                      isActive && styles.activePresetLabel,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <DatePickerModal
        locale="pl"
        mode="single"
        visible={pickerTarget !== null}
        date={
          pickerTarget ? value[pickerTarget === 'start' ? 0 : 1] : undefined
        }
        dateMode={pickerTarget || undefined}
        onDismiss={() => setPickerTarget(null)}
        onConfirm={handleDateConfirm}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: warmColors.border,
    borderRadius: 20,
    backgroundColor: warmColors.card,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateField: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: warmColors.border,
    borderRadius: 12,
    backgroundColor: warmColors.background,
  },
  dateTextContainer: {
    minWidth: 0,
    flex: 1,
  },
  dateLabel: {
    color: warmColors.mutedForeground,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 12,
    textTransform: 'uppercase',
  },
  dateValue: {
    color: warmColors.foreground,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 17,
  },
  presetsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: warmColors.primary,
    shadowColor: warmColors.foreground,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preset: {
    minWidth: '47%',
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: warmColors.muted,
  },
  activePreset: {
    backgroundColor: warmColors.primary,
  },
  presetLabel: {
    color: warmColors.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
  activePresetLabel: {
    color: warmColors.primaryForeground,
  },
  pressed: {
    opacity: 0.75,
  },
});

export default SummaryDateRangeSelector;
