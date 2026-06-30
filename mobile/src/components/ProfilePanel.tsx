import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getConfigStatus } from '@/services/api';
import { ConfigStatusResponse, MBTITheme, ServiceStatus, UserPreferences } from '@/types';

type ProfilePanelProps = {
  visible: boolean;
  theme: MBTITheme;
  mbti: string | null;
  email: string | null;
  hasSkippedAuth: boolean;
  userId: string;
  preferences: UserPreferences | null;
  feedbackSummary: string;
  onClose: () => void;
  onRedoOnboarding: () => void;
  onLogout: () => void;
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

function compactUserId(userId: string) {
  if (!userId) return '本地用户';
  if (userId.length <= 14) return userId;
  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
}

export function ProfilePanel({
  visible,
  theme,
  mbti,
  email,
  hasSkippedAuth,
  userId,
  preferences,
  feedbackSummary,
  onClose,
  onRedoOnboarding,
  onLogout,
}: ProfilePanelProps) {
  const colors = theme.colors;
  const [configStatus, setConfigStatus] = useState<ConfigStatusResponse | null>(null);
  const accountLabel = email || (hasSkippedAuth ? '游客体验中' : compactUserId(userId));
  const prefRows = [
    ['社交', preferences?.social_frequency || '未设置'],
    ['预算', preferences?.budget || '未设置'],
    ['通勤', preferences?.commute_tolerance || '未设置'],
    ['备注', preferences?.notes || '暂无'],
  ];

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    getConfigStatus()
      .then((res) => {
        if (!cancelled) setConfigStatus(res);
      })
      .catch(() => {
        if (!cancelled) setConfigStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const services = configStatus?.services
    ? ['llm', 'weather', 'places', 'activities', 'games', 'database']
      .map((key) => [key, configStatus.services[key]] as [string, ServiceStatus | undefined])
      .filter((item): item is [string, ServiceStatus] => Boolean(item[1]))
    : [];

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: hexToRgba(colors.accent, 0.16),
              shadowColor: colors.accent,
            },
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>我的 OneDayReco</Text>
              <Text style={[styles.subtitle, { color: colors.subtext }]}>{accountLabel}</Text>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: hexToRgba(colors.accent, 0.08) }]}
              onPress={onClose}
            >
              <Text style={[styles.closeText, { color: colors.accent }]}>×</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[styles.profileCard, { backgroundColor: hexToRgba(colors.accent, 0.08) }]}>
              <Text style={[styles.avatar, { color: colors.accent }]}>{theme.avatar}</Text>
              <View style={styles.profileCopy}>
                <Text style={[styles.mbti, { color: colors.text }]}>{mbti || '未确认 MBTI'}</Text>
                <Text style={[styles.profileText, { color: colors.subtext }]}>
                  当前主题和互动语气会跟随你的 MBTI 与反馈变化。
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>偏好设置</Text>
              {prefRows.map(([label, value]) => (
                <View key={label} style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.subtext }]}>{label}</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>最近学习到</Text>
              <Text style={[styles.summary, { color: colors.subtext }]}>
                {feedbackSummary || '还没有足够反馈。喜欢、完成、跳过几次后，我会更清楚你想要什么。'}
              </Text>
            </View>

            <View style={[styles.notice, { backgroundColor: hexToRgba(colors.accent, 0.06) }]}>
              <Text style={[styles.noticeTitle, { color: colors.text }]}>真实数据状态</Text>
              {services.length ? (
                <View style={styles.serviceList}>
                  {services.map(([key, service]) => (
                    <View key={key} style={styles.serviceRow}>
                      <View style={styles.serviceCopy}>
                        <Text style={[styles.serviceName, { color: colors.text }]}>{service.label}</Text>
                        <Text style={[styles.serviceDetail, { color: colors.subtext }]} numberOfLines={2}>
                          {service.detail}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: service.configured
                              ? hexToRgba(colors.accent, 0.14)
                              : 'rgba(120,112,102,0.12)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: service.configured ? colors.accent : colors.subtext },
                          ]}
                        >
                          {service.is_realtime ? '实时' : service.configured ? '可用' : '兜底'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noticeText, { color: colors.subtext }]}>
                  正在读取服务状态。未配置 key 时，推荐会明确显示精选兜底，不会伪造实时数据。
                </Text>
              )}
            </View>

            <Pressable style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={onRedoOnboarding}>
              <Text style={styles.primaryText}>重新选择 MBTI 和偏好</Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryBtn, { borderColor: hexToRgba(colors.accent, 0.2) }]}
              onPress={onLogout}
            >
              <Text style={[styles.secondaryText, { color: colors.accent }]}>
                {email ? '退出登录' : '清除本地数据'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,24,20,0.28)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -8 },
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '600',
  },
  profileCard: {
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 16,
  },
  avatar: {
    fontSize: 34,
  },
  profileCopy: {
    flex: 1,
  },
  mbti: {
    fontSize: 20,
    fontWeight: '900',
  },
  profileText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  section: {
    marginBottom: 17,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  rowLabel: {
    width: 44,
    fontSize: 13,
    fontWeight: '700',
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  summary: {
    fontSize: 14,
    lineHeight: 21,
  },
  notice: {
    borderRadius: 20,
    padding: 13,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 20,
  },
  serviceList: {
    gap: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  serviceCopy: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '900',
  },
  serviceDetail: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  statusPill: {
    minWidth: 46,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '900',
  },
});
