/**
 * 快捷操作按钮组
 * MBTI 个性化文案
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MBTITheme, MBTIPersona } from '@/types';

interface QuickActionsProps {
  persona: MBTIPersona;
  theme: MBTITheme;
  onAction: (text: string) => void;
}

export function QuickActions({ persona, theme, onAction }: QuickActionsProps) {
  const colors = theme.colors;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {persona.quickActions.map((action, idx) => (
        <Pressable
          key={idx}
          style={[
            styles.pill,
            {
              backgroundColor: colors.card,
              borderColor: colors.accent,
              borderRadius: parseInt(theme.radius) + 4,
            },
          ]}
          onPress={() => onAction(action)}
        >
          <Text style={[styles.text, { color: colors.text }]}>{action}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
