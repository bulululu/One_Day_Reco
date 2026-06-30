import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityInspirationPanel } from '@/components/ActivityInspirationPanel';
import { ScreenBreakPanel } from '@/components/ScreenBreakPanel';
import { MBTITheme } from '@/types';

type ScreenBreakTrigger = {
  appName: string;
  appCategory: string;
  usageMinutes: number;
  continuousMinutes: number;
};

type CompanionViewProps = {
  theme: MBTITheme;
  location: string;
  isLoading: boolean;
  onPrompt: (prompt: string) => void;
  onTrigger: (trigger: ScreenBreakTrigger) => void;
};

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

const MOOD_PROMPTS = [
  { label: '放松一下', prompt: '我现在想放松一下，推荐一个具体活动' },
  { label: '想要灵感', prompt: '我想找点灵感，推荐一个不俗套的具体活动' },
  { label: '不想出门', prompt: '我今天不想出门，推荐一个居家具体活动' },
  { label: '一个人待着', prompt: '我想一个人待着，推荐一个低社交活动' },
];

export function CompanionView({ theme, location, isLoading, onPrompt, onTrigger }: CompanionViewProps) {
  const colors = theme.colors;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
        <View style={[styles.avatar, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
          <Text style={[styles.avatarText, { color: colors.accent }]}>{theme.avatar}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.title, { color: colors.text }]}>今天想怎么被陪着？</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            你不需要先想清楚需求，点一个状态，我来把它变成具体安排。
          </Text>
        </View>
      </View>

      <View style={styles.promptGrid}>
        {MOOD_PROMPTS.map((item) => (
          <Pressable
            key={item.label}
            style={[styles.promptCard, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}
            onPress={() => onPrompt(item.prompt)}
          >
            <Text style={[styles.promptTitle, { color: colors.text }]}>{item.label}</Text>
            <Text style={[styles.promptArrow, { color: colors.accent }]}>›</Text>
          </Pressable>
        ))}
      </View>

      <ScreenBreakPanel theme={theme} isLoading={isLoading} onTrigger={onTrigger as any} />
      <ActivityInspirationPanel theme={theme} location={location} onPrompt={onPrompt} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 112,
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '900',
  },
  heroCopy: {
    flex: 1,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
    marginTop: 16,
  },
  promptCard: {
    width: '48.3%',
    minHeight: 92,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  promptTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  promptArrow: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '800',
  },
});
