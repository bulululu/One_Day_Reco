/**
 * 推荐卡片组件
 * 温暖计划卡：强调个人状态和可执行安排，而不是点评平台式商户信息。
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivitySourceMeta, MBTITheme, Recommendation } from '@/types';
import { hexToRgba, softShadow, UI } from '@/styles/ui';

const MAIN_VISUAL = require('../assets/main-visual.jpeg');

interface RecommendationCardProps {
  recommendation: Recommendation;
  theme: MBTITheme;
  activitySource?: ActivitySourceMeta;
  onAction?: (recommendation: Recommendation) => void;
}

function getPlanMeta(recommendation: Recommendation) {
  const info = recommendation.specific_info;
  return [
    { label: '地点', value: info?.location || info?.platform || '现在可做' },
    { label: '时长', value: info?.duration || '约 90 分钟' },
    { label: '花费', value: info?.price || recommendation.budget || '按需' },
  ];
}

function getSceneCopy(recommendation: Recommendation) {
  const text = `${recommendation.activity_name}${recommendation.recommend_text}`;
  if (text.includes('咖啡')) return { icon: '☕', label: '安静充电' };
  if (text.includes('纪录片') || text.includes('电影')) return { icon: '▣', label: '客厅片刻' };
  if (text.includes('散步') || text.includes('公园')) return { icon: '⌁', label: '慢走透气' };
  if (text.includes('手工') || text.includes('画')) return { icon: '✿', label: '一起动手' };
  return { icon: '☀', label: '今日小计划' };
}

function getSpecificSummary(recommendation: Recommendation) {
  const info = recommendation.specific_info;
  if (!info) return '';
  return [info.name, info.rating || info.source].filter(Boolean).join(' · ');
}

export function RecommendationCard({
  recommendation,
  theme,
  activitySource,
  onAction,
}: RecommendationCardProps) {
  const colors = theme.colors;
  const meta = getPlanMeta(recommendation);
  const scene = getSceneCopy(recommendation);
  const specificSummary = getSpecificSummary(recommendation);
  const sourceLabel = activitySource?.is_realtime ? '实时候选' : '精选兜底';

  const handleAction = () => {
    onAction?.(recommendation);
    if (recommendation.action_url) {
      Linking.openURL(recommendation.action_url);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: hexToRgba(colors.accent, 0.14),
        },
        softShadow(colors.accent, 0.06),
      ]}
    >
      <ImageBackground
        source={MAIN_VISUAL}
        resizeMode="cover"
        imageStyle={styles.heroImage}
        style={styles.hero}
      >
        <LinearGradient
          colors={[
            hexToRgba(colors.card, 0.9),
            hexToRgba(colors.card, 0.54),
            hexToRgba(colors.card, 0.08),
          ]}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0.82, y: 0.5 }}
          style={styles.imageOverlay}
        >
          <View style={styles.heroContent}>
            <View style={styles.pillRow}>
              <View style={[styles.modePill, { backgroundColor: hexToRgba(colors.accent, 0.16) }]}>
                <Text style={[styles.modeText, { color: colors.accent }]}>
                  {scene.icon} {scene.label}
                </Text>
              </View>
              <View style={[styles.sourcePill, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
                <Text style={[styles.sourcePillText, { color: colors.accent }]}>
                  {sourceLabel}
                </Text>
              </View>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {recommendation.activity_name}
            </Text>
            <Text style={[styles.recommendText, { color: colors.text }]} numberOfLines={2}>
              {recommendation.recommend_text}
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.metaGrid}>
          {meta.map((item) => (
            <View
              key={item.label}
              style={[styles.metaItem, { backgroundColor: hexToRgba(colors.accent, 0.08) }]}
            >
              <Text style={[styles.metaLabel, { color: colors.subtext }]}>{item.label}</Text>
              <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {specificSummary ? (
          <View style={[styles.specificLine, { borderColor: hexToRgba(colors.accent, 0.14) }]}>
            <Text style={[styles.specificLabel, { color: colors.accent }]}>具体安排</Text>
            <Text style={[styles.specificValue, { color: colors.text }]} numberOfLines={1}>
              {specificSummary}
            </Text>
          </View>
        ) : null}

        <Pressable
          style={[
            styles.actionBtn,
            {
              backgroundColor: colors.accent,
              opacity: recommendation.action_url ? 1 : 0.92,
            },
          ]}
          onPress={handleAction}
          disabled={!recommendation.action_url}
        >
          <Text style={styles.actionLabel}>{recommendation.action_label || '开始这个计划'}</Text>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: UI.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  hero: {
    minHeight: 152,
    backgroundColor: '#f8efe3',
  },
  heroImage: {
    borderTopLeftRadius: UI.radius.xl,
    borderTopRightRadius: UI.radius.xl,
  },
  imageOverlay: {
    flex: 1,
    minHeight: 152,
    padding: 16,
    justifyContent: 'flex-end',
  },
  heroContent: {
    maxWidth: '82%',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  modePill: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sourcePill: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  sourcePillText: {
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 7,
  },
  recommendText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  content: {
    padding: 12,
    gap: 10,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  metaItem: {
    width: '31.5%',
    borderRadius: UI.radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  metaLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    gap: 7,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  detailSource: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    width: 36,
    fontSize: 12,
    fontWeight: '700',
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  specificLine: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  specificLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  specificValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  noteBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  tips: {
    fontSize: 14,
    lineHeight: 21,
  },
  safety: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionBtn: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  actionArrow: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
  },
});
