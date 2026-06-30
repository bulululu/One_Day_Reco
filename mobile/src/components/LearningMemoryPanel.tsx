import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getRecommendationHistory } from '@/services/api';
import { MBTITheme, RecommendationHistoryRecord } from '@/types';

type LearningMemoryPanelProps = {
  userId: string;
  theme: MBTITheme;
  refreshKey: number;
  onPrompt: (prompt: string) => void;
};

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

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function recordTitle(record: RecommendationHistoryRecord) {
  const first = record.recommendations[0];
  return first?.specific_info?.name || first?.activity_name || '刚刚看过的方向';
}

function recordMeta(record: RecommendationHistoryRecord) {
  const first = record.recommendations[0];
  const location = first?.specific_info?.location || record.context?.location || '当前位置';
  const duration = first?.specific_info?.duration || '按状态安排';
  return `${location} · ${duration}`;
}

export function LearningMemoryPanel({ userId, theme, refreshKey, onPrompt }: LearningMemoryPanelProps) {
  const [history, setHistory] = useState<RecommendationHistoryRecord[]>([]);
  const colors = theme.colors;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getRecommendationHistory(userId, 8);
        if (!cancelled) setHistory(res.history);
      } catch {
        if (!cancelled) setHistory([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  const compactHistory = useMemo(() => history.slice(0, 5), [history]);
  const memoryCount = compactHistory.reduce((count, item) => count + item.recommendations.length, 0);

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
          <Text style={[styles.title, { color: colors.text }]}>正在记住你的选择</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {memoryCount > 0 ? `已沉淀 ${memoryCount} 个近期方向` : '喜欢、完成、跳过都会慢慢变成偏好'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: hexToRgba(colors.accent, 0.1) }]}>
          <Text style={[styles.badgeText, { color: colors.accent }]}>学习中</Text>
        </View>
      </View>

      {compactHistory.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {compactHistory.map((record) => {
            const title = recordTitle(record);
            const meta = recordMeta(record);
            const source = record.activity_source?.is_realtime ? '实时数据' : '精选兜底';
            return (
              <Pressable
                key={record.id}
                style={[
                  styles.memoryCard,
                  {
                    backgroundColor: hexToRgba(colors.accent, 0.07),
                    borderColor: hexToRgba(colors.accent, 0.16),
                  },
                ]}
                onPress={() => onPrompt(`按「${title}」这个方向，再推荐一个更适合现在的具体计划`)}
              >
                <Text style={[styles.time, { color: colors.subtext }]}>{formatTime(record.created_at)}</Text>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
                <Text style={[styles.meta, { color: colors.subtext }]} numberOfLines={2}>{meta}</Text>
                <Text style={[styles.source, { color: colors.accent }]}>{source}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={[styles.empty, { backgroundColor: hexToRgba(colors.accent, 0.06) }]}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            先完成几次推荐反馈，我会开始避开你跳过的方向，多给你真正愿意做的安排。
          </Text>
        </View>
      )}
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
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  badge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  list: {
    gap: 10,
  },
  memoryCard: {
    width: 182,
    minHeight: 136,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  time: {
    fontSize: 12,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  source: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 'auto',
  },
  empty: {
    borderRadius: 18,
    padding: 13,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
