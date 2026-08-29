import {type ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';

import {warmColors, warmRadius} from '@/constants/warmTheme';

type Props = {
  groupingControls: ReactNode;
  chartTypeControls: ReactNode;
  categoryFilters: ReactNode;
  children: ReactNode;
};

const SummaryExploreCard = ({
  groupingControls,
  chartTypeControls,
  categoryFilters,
  children,
}: Props) => (
  <View style={styles.card}>
    {groupingControls}
    {chartTypeControls}
    {categoryFilters}
    <View style={styles.divider} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    gap: 16,
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: warmColors.border,
    borderRadius: warmRadius.xxl,
    backgroundColor: warmColors.card,
  },
  divider: {
    height: 1,
    backgroundColor: warmColors.border,
  },
});

export default SummaryExploreCard;
