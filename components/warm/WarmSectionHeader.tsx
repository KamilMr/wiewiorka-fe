import React from 'react';
import {StyleSheet} from 'react-native';
import {Text} from '@/components';
import {warmColors} from '@/constants/warmTheme';

interface Props {
  label: string;
}

export default function WarmSectionHeader({label}: Props) {
  return <Text style={styles.label}>{label}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: warmColors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
});
