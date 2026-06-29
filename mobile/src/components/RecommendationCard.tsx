/**
 * 推荐卡片组件（优化版）
 * 紧凑视觉头 + 推荐语 + 具体信息 + 行动按钮
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recommendation, MBTITheme } from '@/types';
import { CATEGORY_VISUALS } from '@/data/categoryVisuals';

interface RecommendationCardProps {
  recommendation: Recommendation;
  theme: MBTITheme;
}

export function RecommendationCard({ recommendation, theme }: RecommendationCardProps) {
  const colors = theme.colors;
  const category = recommendation.category || '城市探索';
  const visual = CATEGORY_VISUALS[category] || CATEGORY_VISUALS['城市探索'];
  const info = recommendation.specific_info;

  const handleAction = () => {
    if (recommendation.action_url) {
      Linking.openURL(recommendation.action_url);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* 视觉头 */}
      <LinearGradient
        colors={visual.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.visual}
      >
        <Text style={styles.visualEmoji}>{visual.emoji}</Text>
        {recommendation.budget ? (
          <View style={styles.budgetTag}>
            <Text style={styles.budgetText}>{recommendation.budget}</Text>
          </View>
        ) : null}
      </LinearGradient>

      {/* 内容 */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {recommendation.activity_name}
        </Text>
        <Text style={[styles.recommendText, { color: colors.text }]}>
          {recommendation.recommend_text}
        </Text>

        {/* 具体信息 */}
        {info && (
          <View style={styles.infoBox}>
            {info.name ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {info.name}
                  {info.location ? ` · ${info.location}` : ''}
                </Text>
              </View>
            ) : null}
            {info.duration ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>⏱</Text>
                <Text style={[styles.infoValue, { color: colors.subtext }]}>
                  {info.duration}
                </Text>
              </View>
            ) : null}
            {info.price ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>💰</Text>
                <Text style={[styles.infoValue, { color: colors.subtext }]}>
                  {info.price}
                </Text>
              </View>
            ) : null}
            {info.rating ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>⭐</Text>
                <Text style={[styles.infoValue, { color: colors.subtext }]}>
                  {info.rating}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Tips */}
        {recommendation.tips ? (
          <Text style={[styles.tips, { color: colors.subtext }]}>
            💡 {recommendation.tips}
          </Text>
        ) : null}

        {/* 安全提示 */}
        {recommendation.safety_note ? (
          <Text style={[styles.safety, { color: colors.subtext }]}>
            ⚠️ {recommendation.safety_note}
          </Text>
        ) : null}

        {/* 行动按钮 */}
        {recommendation.action_url && recommendation.action_label ? (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.accent }]}
            onPress={handleAction}
          >
            <Text style={styles.actionLabel}>{recommendation.action_label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  visual: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  visualEmoji: {
    fontSize: 36,
  },
  budgetTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  budgetText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  recommendText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  infoBox: {
    gap: 6,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    width: 18,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  tips: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  safety: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  actionBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
