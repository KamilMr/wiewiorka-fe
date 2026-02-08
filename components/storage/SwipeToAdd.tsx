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

interface SwipeableRowProps {
  children: React.ReactNode;
  onAdd?: () => void;
  onDelete?: () => void;
}

interface ActionProps {
  translation: SharedValue<number>;
  halfWidth: number;
  onPress: () => void;
}

const AddAction = ({translation, halfWidth, onPress}: ActionProps) => {
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
      onPress={onPress}
      style={[styles.action, {backgroundColor: t.colors.primary, width: halfWidth}]}
    >
      <Reanimated.View style={[styles.buttonContainer, animatedStyle]}>
        <Icon source="cart-plus" color={t.colors.onPrimary} size={28} />
      </Reanimated.View>
    </Pressable>
  );
};

const DeleteAction = ({translation, halfWidth, onPress}: ActionProps) => {
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
      onPress={onPress}
      style={[styles.action, {backgroundColor: t.colors.error, width: halfWidth}]}
    >
      <Reanimated.View style={[styles.buttonContainer, animatedStyle]}>
        <Icon source="trash-can-outline" color={t.colors.onPrimary} size={28} />
      </Reanimated.View>
    </Pressable>
  );
};

export default function SwipeableRow({children, onAdd, onDelete}: SwipeableRowProps) {
  const [containerWidth, setContainerWidth] = useState(300);
  const swipeableRef = useRef<any>(null);

  const halfWidth = containerWidth * 0.4;

  const handleAdd = useCallback(() => {
    swipeableRef.current?.close();
    onAdd?.();
  }, [onAdd]);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete?.();
  }, [onDelete]);

  const renderLeftActions = onAdd
    ? (_progress: SharedValue<number>, translation: SharedValue<number>) => (
        <AddAction translation={translation} halfWidth={halfWidth} onPress={handleAdd} />
      )
    : undefined;

  const renderRightActions = onDelete
    ? (_progress: SharedValue<number>, translation: SharedValue<number>) => (
        <DeleteAction translation={translation} halfWidth={halfWidth} onPress={handleDelete} />
      )
    : undefined;

  return (
    <View onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        leftThreshold={halfWidth * 0.6}
        rightThreshold={halfWidth * 0.6}
        overshootLeft={false}
        overshootRight={false}
        friction={2}
        onSwipeableOpen={direction => {
          if (direction === 'right') handleAdd();
          if (direction === 'left') handleDelete();
        }}
      >
        {children}
      </ReanimatedSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
