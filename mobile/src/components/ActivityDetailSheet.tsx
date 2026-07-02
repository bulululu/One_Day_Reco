import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MBTITheme, Recommendation } from '@/types';

type ActivityDetailSheetProps = {
  visible: boolean;
  recommendation: Recommendation | null;
  theme: MBTITheme;
  sourceLabel: string;
  onClose: () => void;
  onFeedback: (feedback: 'liked' | 'completed' | 'skipped') => void;
  onRecordAction: (recommendation: Recommendation) => void;
};

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

export function ActivityDetailSheet({
  visible,
  recommendation,
  theme,
  sourceLabel,
  onClose,
  onFeedback,
  onRecordAction,
}: ActivityDetailSheetProps) {
  const colors = theme.colors;
  const info = recommendation?.specific_info;

  const handleAction = () => {
    if (!recommendation) return;
    onRecordAction(recommendation);
    if (recommendation.action_url) {
      void Linking.openURL(recommendation.action_url).catch(() => undefined);
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: hexToRgba(colors.accent, 0.14),
              shadowColor: colors.accent,
            },
          ]}
        >
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={[styles.icon, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
                <Text style={[styles.iconText, { color: colors.accent }]}>{theme.avatar}</Text>
              </View>
              <View style={styles.headerCopy}>
                <Text style={[styles.source, { color: colors.accent }]}>{sourceLabel}</Text>
                <Text style={[styles.title, { color: colors.text }]}>
                  {info?.name || recommendation?.activity_name || '活动详情'}
                </Text>
              </View>
            </View>

            <Text style={[styles.body, { color: colors.text }]}>
              {recommendation?.recommend_text || '当前没有可展示的推荐详情。'}
            </Text>

            <View style={styles.metaGrid}>
              <MetaItem colors={colors} label="地点/平台" value={info?.location || info?.platform || '按当前情况确认'} />
              <MetaItem colors={colors} label="预计时长" value={info?.duration || '约 60-90 分钟'} />
              <MetaItem colors={colors} label="价格预算" value={info?.price || recommendation?.budget || '按需'} />
              <MetaItem colors={colors} label="评分/来源" value={info?.rating || info?.source || sourceLabel} />
              {info?.route ? <MetaItem colors={colors} label="路线" value={info.route} /> : null}
            </View>

            {recommendation?.tips ? (
              <View style={[styles.note, { backgroundColor: hexToRgba(colors.accent, 0.08) }]}>
                <Text style={[styles.noteTitle, { color: colors.accent }]}>开始前</Text>
                <Text style={[styles.noteText, { color: colors.text }]}>{recommendation.tips}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.accent }, !recommendation?.action_url && styles.softDisabled]}
              onPress={handleAction}
            >
              <Text style={styles.primaryText}>{recommendation?.action_label || '查看下一步'}</Text>
            </Pressable>

            <View style={styles.feedbackRow}>
              <SheetButton colors={colors} label="喜欢" onPress={() => onFeedback('liked')} />
              <SheetButton colors={colors} label="完成" onPress={() => onFeedback('completed')} />
              <SheetButton colors={colors} label="换一个" onPress={() => onFeedback('skipped')} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MetaItem({
  colors,
  label,
  value,
}: {
  colors: { accent: string; text: string; subtext: string };
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.metaItem, { backgroundColor: hexToRgba(colors.accent, 0.07) }]}>
      <Text style={[styles.metaLabel, { color: colors.subtext }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function SheetButton({
  colors,
  label,
  onPress,
}: {
  colors: { accent: string };
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.sheetButton, { borderColor: hexToRgba(colors.accent, 0.2), backgroundColor: hexToRgba(colors.accent, 0.07) }]}
      onPress={onPress}
    >
      <Text style={[styles.sheetButtonText, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(32,28,24,0.26)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -8 },
    elevation: 5,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(90,82,72,0.22)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 18,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 26,
    fontWeight: '900',
  },
  headerCopy: {
    flex: 1,
  },
  source: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  title: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '900',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    width: '48.5%',
    minHeight: 68,
    borderRadius: 16,
    padding: 11,
  },
  metaLabel: {
    fontSize: 12,
    marginBottom: 7,
  },
  metaValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  note: {
    borderRadius: 20,
    padding: 14,
    marginTop: 16,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 7,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 21,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  softDisabled: {
    opacity: 0.74,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
    paddingBottom: 6,
  },
  sheetButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
});
