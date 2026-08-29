import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Icon} from 'react-native-paper';

import {warmColors, warmRadius} from '@/constants/warmTheme';

type ChartType = 'pie' | 'bar';

type Props = {
  chartType: ChartType;
  onChartTypeChange: (chartType: ChartType) => void;
};

const chartTypes: {id: ChartType; label: string; icon: string}[] = [
  {id: 'pie', label: 'Wykres kołowy', icon: 'chart-donut'},
  {id: 'bar', label: 'Wykres słupkowy', icon: 'chart-bar'},
];

const SummaryChartTypeControls = ({chartType, onChartTypeChange}: Props) => (
  <View style={styles.container}>
    <Text style={styles.label}>Filtruj kategorie</Text>
    <View style={styles.buttons}>
      {chartTypes.map(type => {
        const isSelected = chartType === type.id;

        return (
          <Pressable
            key={type.id}
            accessibilityRole="button"
            accessibilityLabel={type.label}
            accessibilityState={{selected: isSelected}}
            onPress={() => onChartTypeChange(type.id)}
            style={({pressed}) => [
              styles.button,
              isSelected && styles.selectedButton,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              source={type.icon}
              size={18}
              color={
                isSelected ? warmColors.primary : warmColors.mutedForeground
              }
            />
          </Pressable>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: warmColors.mutedForeground,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  buttons: {
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    borderRadius: warmRadius.lg,
    backgroundColor: warmColors.muted,
  },
  button: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: warmRadius.md,
  },
  selectedButton: {
    backgroundColor: warmColors.card,
  },
  pressed: {
    opacity: 0.75,
  },
});

export default SummaryChartTypeControls;
