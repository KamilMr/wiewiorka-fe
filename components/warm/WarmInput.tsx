import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import {warmColors, warmRadius} from '@/constants/warmTheme';

interface Props extends Omit<TextInputProps, 'style'> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export default function WarmInput({
  leading,
  trailing,
  containerStyle,
  placeholderTextColor = warmColors.mutedForeground,
  ...rest
}: Props) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <TextInput
        {...rest}
        placeholderTextColor={placeholderTextColor}
        style={[styles.input, trailing ? styles.inputWithTrailing : null]}
      />
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: warmColors.inputBackground,
    borderWidth: 1,
    borderColor: warmColors.border,
    borderRadius: warmRadius.lg,
    paddingHorizontal: 14,
    height: 52,
  },
  leading: {
    marginRight: 10,
  },
  trailing: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: warmColors.foreground,
    paddingVertical: 0,
  },
  inputWithTrailing: {
    paddingRight: 44,
  },
});
