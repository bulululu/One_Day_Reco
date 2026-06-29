/**
 * 互动仔头部组件
 * 头像 + 名称 + 在线状态 + 主题色
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MBTITheme, MBTIPersona } from '@/types';

interface CompanionHeaderProps {
  theme: MBTITheme;
  persona: MBTIPersona;
}

export function CompanionHeader({ theme, persona }: CompanionHeaderProps) {
  const colors = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* 头像 + 状态点 */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { borderRadius: parseInt(theme.radius) + 20 }]}>
          <Text style={styles.avatarEmoji}>{theme.avatar}</Text>
        </View>
        {/* 脉冲在线状态点 */}
        <View style={[styles.statusDot, { borderColor: colors.card }]} />
      </View>

      {/* 名称 + 状态 */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{theme.name}</Text>
        <Text style={[styles.status, { color: colors.subtext }]}>{persona.status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ade80',
    borderWidth: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
});
