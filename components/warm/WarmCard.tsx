import React from 'react';
import {StyleSheet, View, ViewProps, ViewStyle} from 'react-native';
import {warmColors, warmRadius, warmShadow} from '@/constants/warmTheme';

interface Props extends ViewProps {
  variant?: 'glass' | 'solid';
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export default function WarmCard({
  children,
  variant = 'glass',
  padded = true,
  style,
  ...rest
}: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        variant === 'glass' ? styles.glass : styles.solid,
        padded && styles.padded,
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: warmRadius.xl,
    borderWidth: 1,
    ...warmShadow.sm,
  },
  glass: {
    backgroundColor: warmColors.card,
    borderColor: warmColors.cardBorder,
  },
  solid: {
    backgroundColor: warmColors.cardSolid,
    borderColor: warmColors.border,
  },
  padded: {
    padding: 20,
  },
});
