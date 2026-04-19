import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Text} from '@/components';
import {warmColors, warmRadius, warmShadow} from '@/constants/warmTheme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  dotColor?: string;
}

export default function WarmPill({
  label,
  active = false,
  onPress,
  dotColor,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        active ? styles.active : styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {dotColor ? (
        <View style={[styles.dot, {backgroundColor: dotColor}]} />
      ) : null}
      <Text
        style={[
          styles.label,
          active ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: warmRadius.pill,
    borderWidth: 1,
  },
  active: {
    backgroundColor: warmColors.primary,
    borderColor: warmColors.primary,
    ...warmShadow.sm,
  },
  inactive: {
    backgroundColor: warmColors.cardSolid,
    borderColor: warmColors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  labelActive: {
    color: warmColors.primaryForeground,
  },
  labelInactive: {
    color: warmColors.mutedForeground,
  },
});
