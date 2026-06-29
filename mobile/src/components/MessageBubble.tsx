/**
 * 消息气泡组件（简化版）
 * 用户：右对齐，accent 色
 * 搭子：左对齐，card 色
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage, MBTITheme } from '@/types';
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

  return (
    <View style={styles.assistantRow}>
      {/* 小头像 */}
      <Text style={styles.avatar}>{theme.avatar}</Text>

      <View style={styles.assistantContent}>
        {/* 气泡 */}
        <View style={[styles.assistantBubble, { backgroundColor: colors.card }]}>
          <Text style={[styles.assistantText, { color: colors.text }]}>
            {message.content}
          </Text>
        </View>

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
    marginVertical: 3,
  },
  userBubble: {
    maxWidth: '78%',
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
    marginVertical: 3,
    gap: 8,
  },
  avatar: {
    fontSize: 20,
    marginTop: 2,
  },
  assistantContent: {
    flex: 1,
    maxWidth: '85%',
  },
  assistantBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
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
