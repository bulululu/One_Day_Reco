/**
 * 进度指示点组件
 * 灵感: Headspace
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MBTITheme } from '@/types';

interface ProgressDotsProps {
  total: number;
  current: number;
  theme: MBTITheme;
}

export function ProgressDots({ total, current, theme }: ProgressDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.dot,
            {
              backgroundColor: idx === current ? theme.colors.accent : 'rgba(255,255,255,0.2)',
              width: idx === current ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
