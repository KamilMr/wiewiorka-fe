import {useRef, useState, useCallback} from 'react';
import {StyleSheet, View} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {IconButton} from 'react-native-paper';

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
}

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

  const renderRightActions = (
    _progress: SharedValue<number>,
    translation: SharedValue<number>,
  ) => {
    const animatedStyle = useAnimatedStyle(() => {
      const dragX = Math.abs(translation.value);

      // Trigger auto-delete when swiped past threshold
      if (dragX >= autoDeleteThreshold && !hasTriggeredDelete.value) {
        hasTriggeredDelete.value = true;
        runOnJS(handleDelete)();
      }

      return {
        opacity: interpolate(dragX, [0, halfWidth * 0.3, halfWidth], [0, 0.9, 1]),
        transform: [{scale: interpolate(dragX, [0, halfWidth], [0.5, 1], 'clamp')}],
      };
    });

    return (
      <Reanimated.View style={[styles.rightAction, {width: halfWidth}]}>
        <Reanimated.View style={[styles.buttonContainer, animatedStyle]}>
          <IconButton
            icon="trash-can"
            iconColor="white"
            size={28}
            onPress={handleDelete}
          />
        </Reanimated.View>
      </Reanimated.View>
    );
  };

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
