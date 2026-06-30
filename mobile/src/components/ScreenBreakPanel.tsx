import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MBTITheme } from '@/types';

type ScreenBreakTrigger = {
  appName: string;
  appCategory: string;
  usageMinutes: number;
  continuousMinutes: number;
  label: string;
  detail: string;
};

type ScreenBreakPanelProps = {
  theme: MBTITheme;
  isLoading: boolean;
  onTrigger: (trigger: ScreenBreakTrigger) => void;
};

const TRIGGERS: ScreenBreakTrigger[] = [
  {
    appName: '抖音',
    appCategory: 'short_video',
    usageMinutes: 90,
    continuousMinutes: 40,
    label: '短视频刷久了',
    detail: '40 分钟连续观看',
  },
  {
    appName: '小红书',
    appCategory: 'social_media',
    usageMinutes: 75,
    continuousMinutes: 35,
    label: '种草看累了',
    detail: '35 分钟连续浏览',
  },
  {
    appName: '手游/主机游戏',
    appCategory: 'game',
    usageMinutes: 150,
    continuousMinutes: 65,
    label: '游戏该暂停',
    detail: '65 分钟连续游戏',
  },
];

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

export function ScreenBreakPanel({ theme, isLoading, onTrigger }: ScreenBreakPanelProps) {
  const [selected, setSelected] = useState(TRIGGERS[0]);
  const colors = theme.colors;

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.card,
          borderColor: hexToRgba(colors.accent, 0.14),
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>离开屏幕一会儿</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            按当前天气和时间，换一个低门槛替代活动
          </Text>
        </View>
        <View style={[styles.dot, { backgroundColor: hexToRgba(colors.accent, 0.14) }]}>
          <Text style={[styles.dotText, { color: colors.accent }]}>↗</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.options}
      >
        {TRIGGERS.map((item) => {
          const active = selected.appCategory === item.appCategory;
          return (
            <Pressable
              key={item.appCategory}
              style={[
                styles.option,
                {
                  backgroundColor: active ? colors.accent : hexToRgba(colors.accent, 0.07),
                  borderColor: active ? colors.accent : hexToRgba(colors.accent, 0.16),
                },
              ]}
              onPress={() => setSelected(item)}
            >
              <Text style={[styles.optionTitle, { color: active ? '#fff' : colors.text }]}>
                {item.label}
              </Text>
              <Text style={[styles.optionDetail, { color: active ? 'rgba(255,255,255,0.78)' : colors.subtext }]}>
                {item.detail}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        style={[
          styles.triggerBtn,
          { backgroundColor: colors.accent },
          isLoading && styles.disabled,
        ]}
        onPress={() => onTrigger(selected)}
        disabled={isLoading}
      >
        <Text style={styles.triggerText}>
          {isLoading ? '正在重新安排...' : '给我一个离屏替代'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 13,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 22,
    fontWeight: '800',
  },
  options: {
    gap: 9,
    paddingBottom: 12,
  },
  option: {
    width: 138,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  optionTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  optionDetail: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  triggerBtn: {
    minHeight: 48,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.62,
  },
});
