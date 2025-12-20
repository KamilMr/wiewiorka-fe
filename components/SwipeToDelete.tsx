import {useRef, useState, useCallback} from 'react';
import {StyleSheet, View, Pressable} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {Icon} from 'react-native-paper';

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
}

interface DeleteActionProps {
  translation: SharedValue<number>;
  halfWidth: number;
  autoDeleteThreshold: number;
  hasTriggeredDelete: SharedValue<boolean>;
  onDelete: () => void;
}

const DeleteAction = ({
  translation,
  halfWidth,
  autoDeleteThreshold,
  hasTriggeredDelete,
  onDelete,
}: DeleteActionProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const dragX = Math.abs(translation.value);

    if (dragX >= autoDeleteThreshold && !hasTriggeredDelete.value) {
      hasTriggeredDelete.value = true;
      runOnJS(onDelete)();
    }

    return {
      opacity: interpolate(dragX, [0, halfWidth * 0.3, halfWidth], [0, 0.9, 1]),
      transform: [{scale: interpolate(dragX, [0, halfWidth], [0.5, 1], 'clamp')}],
    };
  });

  return (
    <Pressable onPress={onDelete} style={[styles.rightAction, {width: halfWidth}]}>
      <Reanimated.View style={[styles.buttonContainer, animatedStyle]}>
        <Icon source="trash-can" color="white" size={28} />
      </Reanimated.View>
    </Pressable>
  );
};

export default function SwipeToDelete({children, onDelete}: SwipeToDeleteProps) {
  const [containerWidth, setContainerWidth] = useState(300);
  const swipeableRef = useRef<any>(null);
  const hasTriggeredDelete = useSharedValue(false);

  const halfWidth = containerWidth * 0.5;
  const autoDeleteThreshold = containerWidth * 0.85;

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete();
  }, [onDelete]);

  const renderRightActions = (_progress: SharedValue<number>, translation: SharedValue<number>) => (
    <DeleteAction
      translation={translation}
      halfWidth={halfWidth}
      autoDeleteThreshold={autoDeleteThreshold}
      hasTriggeredDelete={hasTriggeredDelete}
      onDelete={handleDelete}
    />
  );

  const handleSwipeableOpen = () => {
    hasTriggeredDelete.value = false;
  };

  const handleSwipeableClose = () => {
    hasTriggeredDelete.value = false;
  };

  return (
    <View onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeableOpen}
        onSwipeableClose={handleSwipeableClose}
        rightThreshold={halfWidth * 0.6}
        overshootRight={true}
        overshootFriction={8}
        friction={2}
      >
        {children}
      </ReanimatedSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  rightAction: {
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
