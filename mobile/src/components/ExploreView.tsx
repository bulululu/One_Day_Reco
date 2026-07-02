import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivitySourceMeta, MBTITheme, Recommendation } from '@/types';
import { RecommendationCard } from '@/components/RecommendationCard';
import { hexToRgba, UI } from '@/styles/ui';

type ExploreViewProps = {
  theme: MBTITheme;
  recommendations: Recommendation[];
  source?: ActivitySourceMeta;
  isLoading: boolean;
  notice?: string;
  activeFilter?: string | null;
  onRefresh: () => void;
  onOpenDetail: (recommendation: Recommendation) => void;
  onPrompt: (label: string, prompt: string) => void;
};

const FILTERS = [
  { label: '附近', prompt: '帮我找附近现在能做的具体活动' },
  { label: '室内', prompt: '推荐一个今天适合室内做的具体活动' },
  { label: '人少', prompt: '推荐一个人少安静、适合今天做的具体活动' },
  { label: '低预算', prompt: '推荐一个低预算、现在能做的具体活动' },
  { label: '短时长', prompt: '推荐一个 90 分钟内能完成的具体活动' },
];

export function ExploreView({
  theme,
  recommendations,
  source,
  isLoading,
  notice,
  activeFilter,
  onRefresh,
  onOpenDetail,
  onPrompt,
}: ExploreViewProps) {
  const colors = theme.colors;
  const sourceText = source?.is_realtime ? '实时地点与内容候选' : '本地精选灵感';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>活动方案</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>{sourceText} · 名称、地点、时长、下一步</Text>
        </View>
        <Pressable
          style={[styles.refreshBtn, { backgroundColor: hexToRgba(colors.accent, 0.1) }]}
          onPress={onRefresh}
          disabled={isLoading}
        >
          <Text style={[styles.refreshText, { color: colors.accent }]}>{isLoading ? '推荐中' : '重新推荐'}</Text>
        </Pressable>
      </View>

      {notice ? (
        <View style={[styles.noticeBar, { backgroundColor: hexToRgba(colors.accent, 0.08), borderColor: hexToRgba(colors.accent, 0.14) }]}>
          <Text style={[styles.noticeText, { color: colors.subtext }]} numberOfLines={2}>{notice}</Text>
          <Pressable onPress={onRefresh} disabled={isLoading}>
            <Text style={[styles.noticeAction, { color: colors.accent }]}>{isLoading ? '刷新中' : '重试'}</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
        {FILTERS.map((item) => (
          <Pressable
            key={item.label}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === item.label ? colors.accent : colors.card,
                borderColor: activeFilter === item.label ? colors.accent : hexToRgba(colors.accent, 0.13),
              },
            ]}
            onPress={() => onPrompt(item.label, item.prompt)}
          >
            <Text style={[styles.filterText, { color: activeFilter === item.label ? '#fff' : colors.text }]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.cardList}>
        {recommendations.slice(0, 5).map((item) => (
          <Pressable key={item.activity_id} onPress={() => onOpenDetail(item)} style={styles.cardHit}>
            <RecommendationCard recommendation={item} theme={theme} activitySource={source} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: UI.space.pageX,
    paddingTop: 16,
    paddingBottom: 112,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  refreshBtn: {
    borderRadius: UI.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '800',
  },
  noticeBar: {
    borderRadius: UI.radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  noticeAction: {
    fontSize: 12,
    fontWeight: '800',
  },
  filterList: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardList: {
    gap: 14,
  },
  cardHit: {
    width: '100%',
  },
});
