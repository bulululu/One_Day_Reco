import React, { useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { updateProfile } from '@/services/api';
import { MBTIType, UserPreferences } from '@/types';
import { getLifestyleHero, getLifestyleProfile } from '@/data/lifestyleDesign';
import { MBTI_THEMES, MBTI_TYPES } from '@/data/themes';
import { hexToRgba, softShadow, UI } from '@/styles/ui';

const TEST_QUESTIONS = [
  { key: 'energy', title: '今天默认状态更像？', options: [{ label: '独处充电', value: 'I' }, { label: '见人来劲', value: 'E' }] },
  { key: 'input', title: '你更容易被什么打动？', options: [{ label: '真实细节', value: 'S' }, { label: '新鲜可能', value: 'N' }] },
  { key: 'decision', title: '做决定时更需要？', options: [{ label: '理由清楚', value: 'T' }, { label: '感受舒服', value: 'F' }] },
  { key: 'pace', title: '安排方式更喜欢？', options: [{ label: '明确计划', value: 'J' }, { label: '留点余地', value: 'P' }] },
] as const;

type TestKey = typeof TEST_QUESTIONS[number]['key'];
type Answers = Partial<Record<TestKey, string>>;

function inferMbti(answers: Answers): MBTIType | null {
  const result = `${answers.energy || ''}${answers.input || ''}${answers.decision || ''}${answers.pace || ''}`;
  return result.length === 4 ? result as MBTIType : null;
}

function scoreText(text: string, positive: string[], negative: string[]) {
  const source = text.toLowerCase();
  const positiveScore = positive.reduce((score, word) => score + (source.includes(word.toLowerCase()) ? 1 : 0), 0);
  const negativeScore = negative.reduce((score, word) => score + (source.includes(word.toLowerCase()) ? 1 : 0), 0);
  return positiveScore - negativeScore;
}

function inferMbtiFromText(text: string): MBTIType | null {
  const clean = text.trim();
  if (clean.length < 6) return null;
  const energy = scoreText(clean, ['独处', '一个人', '人少', '安静', '宅', '充电'], ['朋友', '一起', '热闹', '聚会', '社交', '见人']) >= 0 ? 'I' : 'E';
  const input = scoreText(clean, ['灵感', '故事', '想象', '新鲜', '意义', '可能'], ['具体', '现实', '细节', '确定', '附近', '实用']) >= 0 ? 'N' : 'S';
  const decision = scoreText(clean, ['感受', '舒服', '温暖', '治愈', '情绪', '喜欢'], ['理由', '效率', '逻辑', '清楚', '性价比', '省事']) >= 0 ? 'F' : 'T';
  const pace = scoreText(clean, ['随便', '自由', '看心情', '临时', '不想计划', '松弛'], ['计划', '安排', '确定', '提前', '准时', '清单']) >= 0 ? 'P' : 'J';
  return `${energy}${input}${decision}${pace}` as MBTIType;
}

export function OnboardingScreen() {
  const {
    mbti,
    setMBTI,
    setPreferences,
    completeOnboarding,
    isReturningUser,
    startAppFromSaved,
    authToken,
    feedbackSummary,
  } = useAppStore();
  const [selected, setSelected] = useState<MBTIType | null>(mbti || 'INFP');
  const [testing, setTesting] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [freeform, setFreeform] = useState('');

  const inferred = inferMbti(answers);
  const textInferred = inferMbtiFromText(freeform);
  const finalMbti = testing ? (inferred || textInferred) : selected;
  const preview = finalMbti || selected || 'INFP';
  const theme = MBTI_THEMES[preview];
  const colors = theme.colors;
  const profile = getLifestyleProfile(preview);
  const hero = getLifestyleHero(preview);
  const canStart = Boolean(finalMbti);

  const prefs: UserPreferences = useMemo(() => ({
    social_frequency: preview.startsWith('I') ? '偏独处，低社交压力' : '愿意适度社交',
    budget: '50-150元',
    commute_tolerance: preview.startsWith('I') ? '30分钟以内，人少优先' : '45分钟以内',
    notes: `onboarding_mbti=${preview}; style=${profile.styleName}; first_run=${testing && textInferred ? 'mbti_chat_guess' : 'mbti_select'}`,
  }), [preview, profile.styleName, testing, textInferred]);

  const finish = async () => {
    if (!finalMbti) return;
    setMBTI(finalMbti);
    setPreferences(prefs);
    if (authToken) {
      await updateProfile(authToken, {
        mbti: finalMbti,
        preferences: prefs,
        feedback_summary: feedbackSummary,
      }).catch(() => undefined);
    }
    completeOnboarding();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.brandRow}>
          <View>
            <Text style={[styles.wordmark, { color: colors.accent }]}>OneDayReco</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>轻松每一天，好好生活</Text>
          </View>
          {isReturningUser ? (
            <Pressable style={[styles.pill, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.14) }]} onPress={startAppFromSaved}>
              <Text style={[styles.pillText, { color: colors.accent }]}>继续</Text>
            </Pressable>
          ) : null}
        </View>

        <ImageBackground source={hero} resizeMode="cover" imageStyle={{ borderRadius: UI.radius.xl }} style={[styles.hero, softShadow(colors.accent, 0.05)]}>
          <LinearGradient
            colors={[hexToRgba(colors.card, 0.92), hexToRgba(colors.card, 0.64), hexToRgba(colors.card, 0.04)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.86, y: 0.5 }}
            style={styles.heroOverlay}
          >
            <Text style={[styles.heroTitle, { color: colors.text }]}>先认识一下你</Text>
            <Text style={[styles.heroSub, { color: colors.subtext }]}>MBTI 会决定首页风格、推荐语气和活动筛选，不确定也可以先测一测。</Text>
            <View style={[styles.styleBadge, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
              <Text style={[styles.styleText, { color: colors.accent }]}>{preview} · {profile.styleName}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.switchRow}>
          <Pressable
            style={[styles.switchItem, { backgroundColor: !testing ? colors.accent : colors.card }]}
            onPress={() => setTesting(false)}
          >
            <Text style={[styles.switchText, { color: !testing ? '#fff' : colors.accent }]}>直接选择</Text>
          </Pressable>
          <Pressable
            style={[styles.switchItem, { backgroundColor: testing ? colors.accent : colors.card }]}
            onPress={() => setTesting(true)}
          >
            <Text style={[styles.switchText, { color: testing ? '#fff' : colors.accent }]}>我不确定</Text>
          </Pressable>
        </View>

        {testing ? (
          <View style={[styles.testPanel, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
            <View style={[styles.chatGuessBox, { backgroundColor: hexToRgba(colors.accent, 0.07), borderColor: hexToRgba(colors.accent, 0.12) }]}>
              <Text style={[styles.chatGuessTitle, { color: colors.text }]}>也可以直接说说你平时的状态</Text>
              <TextInput
                value={freeform}
                onChangeText={(text) => {
                  setFreeform(text);
                  if (text.trim().length >= 6) setSelected(null);
                }}
                multiline
                placeholder="比如：我比较宅，周末可以去人少的影院，但不想去太热闹的地方。"
                placeholderTextColor={colors.subtext}
                style={[styles.freeformInput, { color: colors.text }]}
              />
              <Text style={[styles.chatGuessHint, { color: colors.subtext }]}>
                {textInferred ? `暂定 ${textInferred} · ${getLifestyleProfile(textInferred).styleName}` : '写一句就行；不确定时再选下面 4 个小问题。'}
              </Text>
            </View>
            {TEST_QUESTIONS.map((question) => (
              <View key={question.key} style={styles.questionBlock}>
                <Text style={[styles.questionTitle, { color: colors.text }]}>{question.title}</Text>
                <View style={styles.answerRow}>
                  {question.options.map((option) => {
                    const active = answers[question.key] === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.answerChip,
                          {
                            backgroundColor: active ? colors.accent : hexToRgba(colors.accent, 0.08),
                            borderColor: active ? colors.accent : hexToRgba(colors.accent, 0.12),
                          },
                        ]}
                        onPress={() => {
                          setAnswers((current) => ({ ...current, [question.key]: option.value }));
                          setSelected(null);
                        }}
                      >
                        <Text style={[styles.answerText, { color: active ? '#fff' : colors.text }]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.mbtiGrid}>
            {MBTI_TYPES.map((type) => {
              const optionTheme = MBTI_THEMES[type];
              const optionProfile = getLifestyleProfile(type);
              const active = selected === type;
              return (
                <Pressable
                  key={type}
                  style={[
                    styles.mbtiCard,
                    {
                      backgroundColor: active ? hexToRgba(optionTheme.colors.accent, 0.12) : colors.card,
                      borderColor: active ? optionTheme.colors.accent : hexToRgba(colors.accent, 0.12),
                    },
                  ]}
                  onPress={() => {
                    setTesting(false);
                    setSelected(type);
                    setMBTI(type);
                  }}
                >
                  <View style={[styles.mbtiTone, { backgroundColor: optionTheme.colors.accent }]} />
                  {active ? (
                    <View style={[styles.mbtiCheck, { backgroundColor: optionTheme.colors.accent }]}>
                      <Text style={styles.mbtiCheckText}>✓</Text>
                    </View>
                  ) : null}
                  <View style={[styles.mbtiIconWrap, { backgroundColor: hexToRgba(optionTheme.colors.accent, 0.1) }]}>
                    <Text style={[styles.mbtiIcon, { color: optionTheme.colors.accent }]}>{optionTheme.avatar}</Text>
                  </View>
                  <Text style={[styles.mbtiCode, { color: active ? optionTheme.colors.accent : colors.text }]}>{type}</Text>
                  <Text style={[styles.mbtiName, { color: colors.subtext }]} numberOfLines={1}>{optionTheme.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.bg }]}>
        <Pressable disabled={!canStart} style={[styles.primary, { backgroundColor: colors.accent }, !canStart && styles.disabled]} onPress={() => void finish()}>
          <Text style={styles.primaryText}>{testing ? '保存测试结果' : '保存并开始'}</Text>
        </Pressable>
        <Text style={[styles.privacy, { color: colors.subtext }]}>之后可以在“我的”里重新设置</Text>
      </View>
    </SafeAreaView>
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
    paddingBottom: 126,
  },
  brandRow: {
    minHeight: 58,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordmark: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '900',
  },
  hero: {
    height: 140,
    borderRadius: UI.radius.xl,
    overflow: 'hidden',
    marginTop: 18,
  },
  heroOverlay: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
  },
  heroSub: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
    maxWidth: '76%',
  },
  styleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginTop: 14,
  },
  styleText: {
    fontSize: 12,
    fontWeight: '900',
  },
  switchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
  },
  switchItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '900',
  },
  mbtiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  mbtiCard: {
    width: '23%',
    minHeight: 82,
    borderRadius: UI.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  mbtiTone: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  mbtiCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mbtiCheckText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
  },
  mbtiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  mbtiIcon: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  mbtiCode: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  mbtiName: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
  },
  testPanel: {
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  chatGuessBox: {
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    padding: 13,
  },
  chatGuessTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
  },
  freeformInput: {
    minHeight: 74,
    fontSize: 14,
    lineHeight: 21,
    padding: 0,
    marginTop: 9,
    textAlignVertical: 'top',
  },
  chatGuessHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  questionBlock: {
    gap: 9,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  answerRow: {
    flexDirection: 'row',
    gap: 9,
  },
  answerChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: {
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: UI.space.pageX,
    paddingTop: 10,
    paddingBottom: 18,
  },
  primary: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    minHeight: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  privacy: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 9,
  },
});
