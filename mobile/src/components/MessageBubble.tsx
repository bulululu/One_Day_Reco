/**
 * 消息气泡组件
 * 用户消息：右对齐，纯色背景
 * 互动仔消息：左对齐，主题色渐变背景
 * 支持推荐卡片嵌入
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage, MBTITheme, Recommendation } from '@/types';
import { RecommendationCard } from './RecommendationCard';

interface MessageBubbleProps {
  message: ChatMessage;
  theme: MBTITheme;
}

export function MessageBubble({ message, theme }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const colors = theme.colors;

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={[styles.userBubble, { backgroundColor: colors.accent }]}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  // 互动仔消息
  return (
    <View style={styles.assistantRow}>
      {/* 头像 */}
      <View style={[styles.avatar, { borderRadius: parseInt(theme.radius) + 12 }]}>
        <Text style={styles.avatarEmoji}>{theme.avatar}</Text>
      </View>

      <View style={styles.assistantContent}>
        {/* 消息气泡 */}
        <LinearGradient
          colors={[colors.accent, colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.assistantBubble, { borderRadius: parseInt(theme.radius) + 8 }]}
        >
          <Text style={[styles.assistantText, { color: colors.text }]}>{message.content}</Text>
        </LinearGradient>

        {/* 推荐卡片 */}
        {message.recommendations && message.recommendations.length > 0 && (
          <View style={styles.recommendations}>
            {message.recommendations.map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} theme={theme} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  userBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  userText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  assistantRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 4,
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 4,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  assistantContent: {
    flex: 1,
    maxWidth: '85%',
  },
  assistantBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomLeftRadius: 4,
  },
  assistantText: {
    fontSize: 15,
    lineHeight: 20,
  },
  recommendations: {
    marginTop: 8,
    gap: 8,
  },
});
