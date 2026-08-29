import React, {useEffect, useRef} from 'react';
import {StyleSheet, Animated} from 'react-native';
import {warmColors} from '@/constants/warmTheme';

const Glow = ({
  children,
  isGlowing,
  glowColor = warmColors.primaryForeground,
}: {
  children: React.ReactNode;
  isGlowing: boolean;
  glowColor?: string;
}) => {
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isGlowing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      glowAnim.setValue(1);
    }

    return () => {
      glowAnim.stopAnimation();
    };
  }, [isGlowing, glowAnim]);

  return (
    <Animated.View
      style={[
        styles.glowContainer,
        {
          transform: [{scale: glowAnim}],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  glowContainer: {
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1.8,
    shadowRadius: 10,
  },
});

export default Glow;
