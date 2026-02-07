import {useRef, useState, useCallback} from 'react';
import {StyleSheet, View, Pressable} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import {Icon} from 'react-native-paper';
import {useAppTheme} from '@/constants/theme';

interface SwipeToAddProps {
  children: React.ReactNode;
  onAdd: () => void;
}

interface AddActionProps {
  translation: SharedValue<number>;
  halfWidth: number;
  onAdd: () => void;
}

const AddAction = ({translation, halfWidth, onAdd}: AddActionProps) => {
  const t = useAppTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const dragX = Math.abs(translation.value);
    return {
      opacity: interpolate(dragX, [0, halfWidth * 0.3, halfWidth], [0, 0.9, 1]),
      transform: [
        {scale: interpolate(dragX, [0, halfWidth], [0.5, 1], 'clamp')},
      ],
    };
  });

  return (
    <Pressable
      onPress={onAdd}
      style={[styles.leftAction, {backgroundColor: t.colors.primary, width: halfWidth}]}
    >
      <Reanimated.View style={[styles.buttonContainer, animatedStyle]}>
        <Icon source="cart-plus" color={t.colors.onPrimary} size={28} />
      </Reanimated.View>
    </Pressable>
  );
};

export default function SwipeToAdd({children, onAdd}: SwipeToAddProps) {
  const [containerWidth, setContainerWidth] = useState(300);
  const swipeableRef = useRef<any>(null);

  const halfWidth = containerWidth * 0.4;

  const handleAdd = useCallback(() => {
    swipeableRef.current?.close();
    onAdd();
  }, [onAdd]);

  const renderLeftActions = (
    _progress: SharedValue<number>,
    translation: SharedValue<number>,
  ) => (
    <AddAction
      translation={translation}
      halfWidth={halfWidth}
      onAdd={handleAdd}
    />
  );

  return (
    <View onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        leftThreshold={halfWidth * 0.6}
        overshootLeft={false}
        friction={2}
      >
        {children}
      </ReanimatedSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  leftAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
