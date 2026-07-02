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

const LOCATION_PRESETS = ['上海 徐汇', '上海 静安', '上海 黄浦', '上海 浦东'];

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
            <Text style={[styles.subtitle, { color: colors.subtext }]}>选一个入口，也可以直接跳过。</Text>
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
            <Text style={[styles.heroSub, { color: colors.subtext }]}>选一个，或直接跳过。</Text>
          </LinearGradient>
        </ImageBackground>

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

        <View style={[styles.locationCard, { backgroundColor: hexToRgba(colors.card, 0.72), borderColor: hexToRgba(colors.accent, 0.12) }]}>
          <Text style={[styles.locationLabel, { color: colors.subtext }]}>位置</Text>
          <TextInput
            style={[styles.locationInput, { color: colors.text }]}
            placeholder="输入城市 / 商圈"
            placeholderTextColor={colors.subtext}
            value={location}
            onChangeText={onLocationChange}
            maxLength={40}
          />
          <Text style={[styles.locationHint, { color: colors.subtext }]}>
            {isResolvingContext ? '天气中' : '可选'}
          </Text>
        </View>
        <View style={styles.locationPresets}>
          {LOCATION_PRESETS.map((preset) => {
            const selected = location.trim() === preset;
            return (
              <Pressable
                key={preset}
                style={[
                  styles.locationPreset,
                  {
                    backgroundColor: selected ? colors.accent : hexToRgba(colors.accent, 0.08),
                    borderColor: hexToRgba(colors.accent, selected ? 0 : 0.14),
                  },
                ]}
                onPress={() => onLocationChange(preset)}
              >
                <Text style={[styles.locationPresetText, { color: selected ? '#fff' : colors.accent }]}>
                  {preset.replace('上海 ', '')}
                </Text>
              </Pressable>
            );
          })}
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
    height: 142,
    borderRadius: UI.radius.xl,
    overflow: 'hidden',
    marginTop: 18,
  },
  heroOverlay: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  heroKicker: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: '68%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  locationCard: {
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 46,
    paddingHorizontal: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    paddingVertical: 6,
  },
  locationHint: {
    fontSize: 11,
    lineHeight: 16,
  },
  locationPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  locationPreset: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationPresetText: {
    fontSize: 12,
    fontWeight: '800',
  },
  intentCard: {
    width: '30.8%',
    minHeight: 58,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  intentIcon: {
    fontSize: 14,
    fontWeight: '900',
  },
  intentLabel: {
    fontSize: 12,
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
