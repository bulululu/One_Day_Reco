import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getConfigStatus, getRecommendationHistory } from '@/services/api';
import { ConfigStatusResponse, MBTITheme, RecommendationHistoryRecord, UserPreferences } from '@/types';
import { hexToRgba, UI } from '@/styles/ui';

type ProfileViewProps = {
  theme: MBTITheme;
  mbti: string | null;
  email: string | null;
  hasSkippedAuth: boolean;
  userId: string;
  preferences: UserPreferences | null;
  feedbackSummary: string;
  favorites: string[];
  refreshKey: number;
  onEditPreferences: () => void;
  onRedoOnboarding: () => void;
  onLogout: () => void;
};

function compactUserId(userId: string) {
  if (!userId) return '本地用户';
  if (userId.length <= 14) return userId;
  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
}

function recordTitle(record: RecommendationHistoryRecord) {
  const first = record.recommendations[0];
  return first?.specific_info?.name || first?.activity_name || '推荐记录';
}

export function ProfileView({
  theme,
  mbti,
  email,
  hasSkippedAuth,
  userId,
  preferences,
  feedbackSummary,
  favorites,
  refreshKey,
  onEditPreferences,
  onRedoOnboarding,
  onLogout,
}: ProfileViewProps) {
  const colors = theme.colors;
  const [status, setStatus] = useState<ConfigStatusResponse | null>(null);
  const [history, setHistory] = useState<RecommendationHistoryRecord[]>([]);
  const accountLabel = email || (hasSkippedAuth ? '游客体验中' : compactUserId(userId));

  useEffect(() => {
    let cancelled = false;
    getConfigStatus()
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    getRecommendationHistory(userId, 8)
      .then((result) => {
        if (!cancelled) setHistory(result.history);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  const services = status?.services
    ? ['llm', 'weather', 'places', 'movies', 'content', 'activities', 'games', 'database']
      .map((key) => status.services[key])
      .filter(Boolean)
    : [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
        <View style={[styles.avatar, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
          <Text style={[styles.avatarText, { color: colors.accent }]}>{theme.avatar}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.name, { color: colors.text }]}>{theme.name}</Text>
          <Text style={[styles.account, { color: colors.subtext }]}>{accountLabel}</Text>
          <Text style={[styles.mbti, { color: colors.accent }]}>{mbti || '未确认 MBTI'}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard colors={colors} label="推荐记录" value={`${history.length}`} />
        <StatCard colors={colors} label="本地收藏" value={`${favorites.length}`} />
        <StatCard colors={colors} label="学习摘要" value={feedbackSummary ? '已生成' : '待学习'} />
      </View>

      <Section colors={colors} title="我的偏好">
        <InfoRow colors={colors} label="社交" value={preferences?.social_frequency || '未设置'} />
        <InfoRow colors={colors} label="预算" value={preferences?.budget || '未设置'} />
        <InfoRow colors={colors} label="通勤" value={preferences?.commute_tolerance || '未设置'} />
        <Pressable style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={onEditPreferences}>
          <Text style={styles.primaryText}>编辑偏好</Text>
        </Pressable>
      </Section>

      <Section colors={colors} title="报名 / 推荐记录">
        {history.length ? history.slice(0, 5).map((record) => (
          <View key={record.id} style={[styles.historyItem, { borderColor: hexToRgba(colors.accent, 0.1) }]}>
            <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>{recordTitle(record)}</Text>
            <Text style={[styles.historyMeta, { color: colors.subtext }]} numberOfLines={1}>
              {record.context?.location || '当前位置'} · {record.source}
            </Text>
          </View>
        )) : (
          <Text style={[styles.emptyText, { color: colors.subtext }]}>还没有记录。完成几次推荐后这里会沉淀你的活动轨迹。</Text>
        )}
      </Section>

      <Section colors={colors} title="收藏管理">
        <Text style={[styles.emptyText, { color: colors.subtext }]}>
          {favorites.length ? `已收藏 ${favorites.length} 个方向。` : '点推荐卡里的喜欢后，会先记录为本地收藏。'}
        </Text>
      </Section>

      <Section colors={colors} title="数据状态">
        {services.length ? services.map((service) => (
          <View key={service.label} style={styles.serviceRow}>
            <View style={styles.serviceCopy}>
              <Text style={[styles.serviceTitle, { color: colors.text }]}>{service.label}</Text>
              <Text style={[styles.serviceDetail, { color: colors.subtext }]} numberOfLines={2}>{service.detail}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: service.is_realtime ? hexToRgba(colors.accent, 0.12) : 'rgba(130,122,112,0.12)' }]}>
              <Text style={[styles.statusText, { color: service.is_realtime ? colors.accent : colors.subtext }]}>
                {service.is_realtime ? '实时' : service.configured ? '可用' : '兜底'}
              </Text>
            </View>
          </View>
        )) : (
          <Text style={[styles.emptyText, { color: colors.subtext }]}>服务状态暂时不可用。推荐会明确标记实时或兜底来源。</Text>
        )}
      </Section>

      <Pressable style={[styles.secondaryBtn, { borderColor: hexToRgba(colors.accent, 0.18) }]} onPress={onRedoOnboarding}>
        <Text style={[styles.secondaryText, { color: colors.accent }]}>重新设置 MBTI</Text>
      </Pressable>
      <Pressable style={[styles.secondaryBtn, { borderColor: hexToRgba(colors.accent, 0.18) }]} onPress={onLogout}>
        <Text style={[styles.secondaryText, { color: colors.accent }]}>{email ? '退出登录' : '清除本地数据'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({
  colors,
  title,
  children,
}: {
  colors: { accent: string; card: string; text: string };
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function StatCard({
  colors,
  label,
  value,
}: {
  colors: { accent: string; card: string; text: string; subtext: string };
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.subtext }]}>{label}</Text>
    </View>
  );
}

function InfoRow({
  colors,
  label,
  value,
}: {
  colors: { text: string; subtext: string };
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.subtext }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: UI.space.pageX,
    paddingTop: 18,
    paddingBottom: 112,
  },
  profileCard: {
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '900',
  },
  profileCopy: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  account: {
    fontSize: 13,
    marginTop: 5,
  },
  mbti: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 6,
  },
  section: {
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtn: {
    height: 48,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  historyItem: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  historyMeta: {
    fontSize: 12,
    marginTop: 5,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
  },
  serviceCopy: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  serviceDetail: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  statusPill: {
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '900',
  },
});
