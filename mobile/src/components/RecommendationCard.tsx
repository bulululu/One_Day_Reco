/**
 * 推荐卡片组件
 * 配图区（渐变 + emoji）+ 推荐语 + 具体信息 + 行动按钮
 * v1.0: 新增 specific_info 展示区域
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, ScrollView } from 'react-native';
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
    <View style={[styles.card, { backgroundColor: colors.card, borderRadius: parseInt(theme.radius) + 4 }]}>
      {/* 视觉区：渐变 + emoji */}
      <LinearGradient
        colors={visual.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.visual}
      >
        {/* 背景 emoji */}
        <Text style={styles.bgEmoji}>{visual.emoji}</Text>
        {/* 前景 emoji */}
        <Text style={styles.fgEmoji}>{visual.emoji}</Text>
      </LinearGradient>

      {/* 内容区 */}
      <View style={styles.content}>
        {/* 活动名称 */}
        <Text style={[styles.title, { color: colors.text }]}>
          {recommendation.activity_name}
        </Text>

        {/* 推荐语 */}
        <Text style={[styles.recommendText, { color: colors.text }]}>
          {recommendation.recommend_text}
        </Text>

        {/* 具体信息（v1.0 新增） */}
        {info && (
          <View style={[styles.infoBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            {info.name ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>名称</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{info.name}</Text>
              </View>
            ) : null}
            {info.location ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>地点</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{info.location}</Text>
              </View>
            ) : null}
            {info.duration ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>时长</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{info.duration}</Text>
              </View>
            ) : null}
            {info.price ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>价格</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{info.price}</Text>
              </View>
            ) : null}
            {info.rating ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>评分</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{info.rating}</Text>
              </View>
            ) : null}
            {info.source ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>来源</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{info.source}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* 实操建议 */}
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
            style={[styles.actionBtn, { backgroundColor: colors.accent, borderRadius: parseInt(theme.radius) + 2 }]}
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
    overflow: 'hidden',
  },
  visual: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bgEmoji: {
    position: 'absolute',
    fontSize: 100,
    opacity: 0.08,
  },
  fgEmoji: {
    fontSize: 48,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  recommendText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  infoBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    width: 36,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 12,
    flex: 1,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
