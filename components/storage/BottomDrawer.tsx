import {forwardRef, useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {Button} from 'react-native-paper';
import {useAppTheme} from '@/constants/theme';

interface BottomDrawerProps {
  onSubmit: (items: string[]) => void;
}

const BottomDrawer = forwardRef<BottomSheet, BottomDrawerProps>(
  ({onSubmit}, ref) => {
    const t = useAppTheme();
    const [text, setText] = useState('');

    const handleSubmit = useCallback(() => {
      const items = text
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

      if (items.length === 0) return;
      onSubmit(items);
      setText('');
      if (ref && typeof ref !== 'function') ref.current?.close();
    }, [text, onSubmit, ref]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['55%']}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{backgroundColor: t.colors.surface}}
        handleIndicatorStyle={{backgroundColor: t.colors.textSecondary}}
      >
        <BottomSheetView style={styles.content}>
          <BottomSheetTextInput
            placeholder="mleko, chleb, masło 2szt"
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              {
                backgroundColor: t.colors.surfaceVariant,
                color: t.colors.textPrimary,
              },
            ]}
            placeholderTextColor={t.colors.textTertiary}
          />
          <Button mode="contained" onPress={handleSubmit}>
            Dodaj
          </Button>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 12,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default BottomDrawer;
