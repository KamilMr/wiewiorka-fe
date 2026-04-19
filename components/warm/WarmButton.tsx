import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Text} from '@/components';
import {warmColors, warmRadius} from '@/constants/warmTheme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: Variant;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  fullWidth?: boolean;
}

export default function WarmButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  leading,
  trailing,
  fullWidth = true,
}: Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.base,
        variants[variant].container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {leading ? <View style={styles.adornment}>{leading}</View> : null}
      <Text style={[styles.label, variants[variant].label]}>{label}</Text>
      {trailing ? <View style={styles.adornment}>{trailing}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: warmRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
  },
  adornment: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});

const variants: Record<Variant, {container: object; label: object}> = {
  primary: {
    container: {
      backgroundColor: warmColors.primary,
      shadowColor: warmColors.primary,
      shadowOpacity: 0.25,
      shadowOffset: {width: 0, height: 4},
      shadowRadius: 8,
      elevation: 4,
    },
    label: {color: warmColors.primaryForeground},
  },
  secondary: {
    container: {
      backgroundColor: warmColors.cardSolid,
      borderWidth: 1,
      borderColor: warmColors.border,
    },
    label: {color: warmColors.foreground},
  },
  ghost: {
    container: {backgroundColor: 'transparent'},
    label: {color: warmColors.primary},
  },
};
