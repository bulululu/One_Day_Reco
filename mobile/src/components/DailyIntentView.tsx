import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MBTITheme } from '@/types';
import { HOME_ASSETS } from '@/data/lifestyleDesign';
import { hexToRgba, softShadow, UI } from '@/styles/ui';

export type DailyIntent = {
  key: string;
  label: string;
  icon: string;
  prompt: string;
};

const INTENTS: DailyIntent[] = [
  { key: 'random', label: '随便看看', icon: '✦', prompt: '我现在没有明确想法，按我的 MBTI 和当前地点推荐一个现在能做的具体活动' },
  { key: 'quiet', label: '人少安静', icon: '☁', prompt: '我想去人少安静的地方，推荐一个附近现在能做的具体活动' },
  { key: 'movie', label: '看电影', icon: '◐', prompt: '我想看电影，推荐具体电影、影院候选、时长、评分和订票下一步' },
  { key: 'home', label: '不想出门', icon: '⌂', prompt: '我今天不想出门，推荐一个居家也能完成的具体活动' },
  { key: 'game', label: '打会儿游戏', icon: '◇', prompt: '我想一个人或和朋友打会儿游戏，推荐游戏名、平台、类型和预计时长' },
  { key: 'walk', label: '出去走走', icon: '⌁', prompt: '我想轻松走走，推荐附近路线、时长、天气建议和结束点' },
];

type Props = {
  theme: MBTITheme;
  companionName: string;
  location: string;
  isResolvingContext: boolean;
  onLocationChange: (location: string) => void;
  onSelect: (intent: DailyIntent) => void;
  onSkip: () => void;
  onChat: () => void;
};

export function DailyIntentView({
  theme,
  companionName,
  location,
  isResolvingContext,
  onLocationChange,
  onSelect,
  onSkip,
  onChat,
}: Props) {
  const colors = theme.colors;
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View>
            <Text style={[styles.wordmark, { color: colors.accent }]}>OneDayReco</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>先告诉我一点点现在的状态。</Text>
          </View>
          <Pressable
            style={[styles.chatBtn, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.16) }]}
            onPress={onChat}
          >
            <Text style={[styles.chatText, { color: colors.text }]}>和{companionName}聊聊</Text>
          </Pressable>
        </View>

        <ImageBackground source={HOME_ASSETS.hero} resizeMode="cover" imageStyle={{ borderRadius: UI.radius.xl }} style={[styles.hero, softShadow(colors.accent, 0.05)]}>
          <LinearGradient
            colors={[hexToRgba(colors.card, 0.94), hexToRgba(colors.card, 0.55), hexToRgba(colors.card, 0.02)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.82, y: 0.5 }}
            style={styles.heroOverlay}
          >
            <Text style={[styles.heroKicker, { color: colors.accent }]}>今天的入口</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>现在想做点什么？</Text>
            <Text style={[styles.heroSub, { color: colors.subtext }]}>选一个就开始；不想选也可以直接推荐。</Text>
          </LinearGradient>
        </ImageBackground>

        <View style={[styles.locationCard, { backgroundColor: hexToRgba(colors.card, 0.74), borderColor: hexToRgba(colors.accent, 0.12) }]}>
          <Text style={[styles.locationLabel, { color: colors.subtext }]}>当前位置</Text>
          <TextInput
            style={[styles.locationInput, { color: colors.text }]}
            placeholder="输入城市、商圈或附近位置"
            placeholderTextColor={colors.subtext}
            value={location}
            onChangeText={onLocationChange}
            maxLength={40}
          />
          <Text style={[styles.locationHint, { color: colors.subtext }]}>
            {isResolvingContext ? '正在获取天气...' : '用于附近活动、影院和路线'}
          </Text>
        </View>

        <View style={styles.grid}>
          {INTENTS.map((intent) => (
            <Pressable
              key={intent.key}
              style={[styles.intentCard, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}
              onPress={() => onSelect(intent)}
            >
              <Text style={[styles.intentIcon, { color: colors.accent }]}>{intent.icon}</Text>
              <Text style={[styles.intentLabel, { color: colors.text }]}>{intent.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.skip, { backgroundColor: colors.accent }]} onPress={onSkip}>
          <Text style={styles.skipText}>跳过，直接推荐</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: UI.space.pageX,
    paddingTop: 18,
    paddingBottom: 24,
  },
  brandRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  wordmark: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  chatBtn: {
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  chatText: {
    fontSize: 13,
    fontWeight: '800',
  },
  hero: {
    height: 188,
    borderRadius: UI.radius.xl,
    overflow: 'hidden',
    marginTop: 18,
  },
  heroOverlay: {
    flex: 1,
    padding: 22,
    justifyContent: 'center',
  },
  heroKicker: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: '68%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  locationCard: {
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  locationInput: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    paddingVertical: 8,
  },
  locationHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  intentCard: {
    width: '48.5%',
    minHeight: 62,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  intentIcon: {
    fontSize: 15,
    fontWeight: '900',
  },
  intentLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  skip: {
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  skipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
});
