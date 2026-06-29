/**
 * 呼吸圆加载器（简化版）
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MBTITheme } from '@/types';

interface BreathingLoaderProps {
  theme: MBTITheme;
}

export function BreathingLoader({ theme }: BreathingLoaderProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{theme.avatar}</Text>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: theme.colors.accent },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  emoji: {
    fontSize: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
