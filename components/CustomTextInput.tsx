import {forwardRef} from 'react';
import {StyleSheet} from 'react-native';

import {TextInput, TextInputProps} from 'react-native-paper';
import {sizes, useAppTheme} from '@/constants/theme';

const CustomTextInput = forwardRef<typeof TextInput, TextInputProps>(
  ({onChangeText, value, style, ...props}, ref) => {
    const theme = useAppTheme();

    return (
      <TextInput
        onChangeText={onChangeText}
        dense
        mode="outlined"
        value={value}
        ref={ref}
        style={[styles.root, style]}
        outlineStyle={[styles.outline, {borderColor: theme.colors.outline}]}
        contentStyle={styles.content}
        {...props}
      />
    );
  },
);

CustomTextInput.displayName = 'CustomTextInput';

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#ffffff',
    minHeight: 80,
  },
  outline: {
    borderWidth: 1,
    borderRadius: sizes.sm,
  },
  content: {
    fontSize: 20,
    paddingVertical: sizes.sm,
    paddingHorizontal: sizes.md,
  },
});

export default CustomTextInput;
