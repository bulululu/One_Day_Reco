/**
 * 5 步入职引导：启动页 → MBTI → 活动类型 → 偏好滑杆 → 完成页。
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppStore } from '@/store/appStore';
import { updateProfile } from '@/services/api';
import { MBTIType, UserPreferences } from '@/types';
import { getLifestyleHero, getLifestyleProfile } from '@/data/lifestyleDesign';
import { MBTI_THEMES } from '@/data/themes';

const PERSONALITY_OPTIONS: Array<{ type: MBTIType; label: string; icon: string }> = [
  { type: 'ISTJ', label: '沉稳内敛', icon: '▣' },
  { type: 'ISFJ', label: '可靠细心', icon: '◌' },
  { type: 'INFJ', label: '细腻洞察', icon: '✦' },
  { type: 'INTJ', label: '理性规划', icon: '◈' },
  { type: 'ISTP', label: '冷静实用', icon: '⌘' },
  { type: 'ISFP', label: '安静审美', icon: '◐' },
  { type: 'INFP', label: '温柔理想', icon: '☾' },
  { type: 'INTP', label: '随性分析', icon: '◇' },
  { type: 'ESTP', label: '即兴行动', icon: '▶' },
  { type: 'ESFP', label: '社交活跃', icon: '✺' },
  { type: 'ENFP', label: '创意自由', icon: '☀' },
  { type: 'ENTP', label: '好奇探索', icon: '⌕' },
  { type: 'ESTJ', label: '行动高效', icon: '✓' },
  { type: 'ESFJ', label: '温暖体贴', icon: '♡' },
  { type: 'ENFJ', label: '热情照顾', icon: '✿' },
  { type: 'ENTJ', label: '目标清晰', icon: '↗' },
];

const ACTIVITY_TYPES = [
  '户外探索',
  '文化艺术',
  '运动健身',
  '手工 DIY',
  '美食饮品',
  '学习成长',
  '音乐演出',
  '电影内容',
  '游戏',
  '朋友聚会',
];

const DISCOVERY_QUESTIONS = [
  { key: 'energy', title: '今天更想？', options: [{ label: '安静一点', value: 'I' }, { label: '见见人', value: 'E' }] },
  { key: 'novelty', title: '推荐更偏？', options: [{ label: '熟悉舒服', value: 'S' }, { label: '新鲜灵感', value: 'N' }] },
  { key: 'reason', title: '你更需要？', options: [{ label: '讲清理由', value: 'T' }, { label: '照顾感受', value: 'F' }] },
  { key: 'plan', title: '安排方式？', options: [{ label: '直接排好', value: 'J' }, { label: '给我挑选', value: 'P' }] },
] as const;

type DiscoveryKey = typeof DISCOVERY_QUESTIONS[number]['key'];
type DiscoveryAnswers = Partial<Record<DiscoveryKey, string>>;

function inferMbtiFromAnswers(answers: DiscoveryAnswers): MBTIType | null {
  const energy = answers.energy;
  const novelty = answers.novelty;
  const reason = answers.reason;
  const plan = answers.plan;
  if (!energy || !novelty || !reason || !plan) return null;
  return `${energy}${novelty}${reason}${plan}` as MBTIType;
}

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

function toggleItem(items: string[], item: string) {
  if (items.includes(item)) return items.filter((value) => value !== item);
  return [...items, item].slice(0, 6);
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
  const [step, setStep] = useState(0);
  const [selectedMbti, setSelectedMbti] = useState<MBTIType | null>(mbti);
  const [useDiscovery, setUseDiscovery] = useState(!mbti);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<DiscoveryAnswers>({});
  const [activityTypes, setActivityTypes] = useState<string[]>(['户外探索', '电影内容', '美食饮品']);
  const [durationLevel, setDurationLevel] = useState(2);
  const [activityIntensity, setActivityIntensity] = useState(2);
  const [planningHorizon, setPlanningHorizon] = useState(1);
  const [socialLevel, setSocialLevel] = useState(1);
  const [budgetLevel, setBudgetLevel] = useState(1);

  useEffect(() => {
    if (mbti) setSelectedMbti(mbti);
  }, [mbti]);

  const inferredMbti = inferMbtiFromAnswers(discoveryAnswers);
  const finalMbti = useDiscovery ? inferredMbti : selectedMbti;
  const previewMbti = finalMbti || selectedMbti || mbti || 'INFP';
  const theme = MBTI_THEMES[previewMbti];
  const colors = theme.colors;
  const lifestyle = getLifestyleProfile(previewMbti);
  const hero = getLifestyleHero(previewMbti);
  const canContinue = step === 0
    || (step === 1 && Boolean(finalMbti))
    || (step === 2 && activityTypes.length > 0)
    || step >= 3;

  const budget = ['0-50元', '50-150元', '150元以上'][budgetLevel] || '50-150元';
  const social = ['大部分时间独处', '偶尔社交', '经常社交'][socialLevel] || '偶尔社交';
  const commute = ['15分钟以内', '30分钟以内', '45分钟以内'][durationLevel] || '30分钟以内';

  const preferenceNotes = useMemo(() => ([
    `activityTypes=${activityTypes.join(',')}`,
    `durationLevel=${durationLevel}`,
    `activityIntensity=${activityIntensity}`,
    `planningHorizon=${planningHorizon}`,
    `socialLevel=${socialLevel}`,
    `budgetLevel=${budgetLevel}`,
    useDiscovery && finalMbti ? `未手动选择 MBTI，轻问答暂定为 ${finalMbti}` : '',
  ].filter(Boolean).join('；')), [
    activityTypes,
    durationLevel,
    activityIntensity,
    planningHorizon,
    socialLevel,
    budgetLevel,
    useDiscovery,
    finalMbti,
  ]);

  const handleFinish = async () => {
    if (!finalMbti) return;
    setMBTI(finalMbti);
    const prefs: UserPreferences = {
      social_frequency: social,
      budget,
      commute_tolerance: commute,
      notes: preferenceNotes,
    };
    setPreferences(prefs);
    if (authToken) {
      try {
        await updateProfile(authToken, {
          mbti: finalMbti,
          preferences: prefs,
          feedback_summary: feedbackSummary,
        });
      } catch {
        // 本地画像已保存，服务恢复后继续可用。
      }
    }
    completeOnboarding();
  };

  const next = () => {
    if (!canContinue) return;
    if (step >= 4) {
      void handleFinish();
      return;
    }
    setStep((value) => Math.min(4, value + 1));
  };

  const back = () => {
    if (step === 0) return;
    setStep((value) => Math.max(0, value - 1));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.topBar}>
        <Pressable onPress={back} disabled={step === 0} style={styles.backHit}>
          <Text style={[styles.back, { color: step === 0 ? 'transparent' : colors.text }]}>‹</Text>
        </Pressable>
        <View style={styles.progressWrap}>
          {[0, 1, 2, 3, 4].map((item) => (
            <View
              key={item}
              style={[
                styles.progressDot,
                { backgroundColor: item <= step ? colors.accent : hexToRgba(colors.accent, 0.16) },
                item === step && { width: 24 },
              ]}
            />
          ))}
        </View>
        {isReturningUser ? (
          <Pressable
            onPress={startAppFromSaved}
            style={[styles.skipBtn, { borderColor: hexToRgba(colors.accent, 0.2), backgroundColor: colors.card }]}
          >
            <Text style={[styles.skipText, { color: colors.accent }]}>稍后</Text>
          </Pressable>
        ) : <View style={styles.skipPlaceholder} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {step === 0 ? (
          <View style={styles.startStep}>
            <Text style={[styles.wordmark, { color: colors.accent }]}>OneDayReco</Text>
            <Text style={[styles.startTitle, { color: colors.text }]}>发现适合你的美好时光</Text>
            <Text style={[styles.startSub, { color: colors.subtext }]}>从认识自己开始，每一天都能少一点纠结。</Text>
            <ImageBackground source={hero} resizeMode="cover" imageStyle={styles.heroImage} style={styles.heroCard}>
              <View style={[styles.heroOverlay, { backgroundColor: hexToRgba(colors.card, 0.52) }]}>
                <Text style={[styles.heroLabel, { color: colors.accent }]}>{lifestyle.styleName}</Text>
                <Text style={[styles.heroText, { color: colors.text }]}>我会按你的性格、时间、地点和天气，推荐现在真的能做的事。</Text>
              </View>
            </ImageBackground>
          </View>
        ) : null}

        {step === 1 ? (
          <View>
            <StepTitle
              colors={colors}
              title="你的 MBTI 是？"
              subtitle="知道就直接选；不确定也可以用 4 个轻问题先推断。"
            />
            <View style={styles.modeSwitch}>
              <Pressable
                style={[styles.switchItem, { backgroundColor: !useDiscovery ? colors.accent : colors.card }]}
                onPress={() => setUseDiscovery(false)}
              >
                <Text style={[styles.switchText, { color: !useDiscovery ? '#fff' : colors.accent }]}>我知道 MBTI</Text>
              </Pressable>
              <Pressable
                style={[styles.switchItem, { backgroundColor: useDiscovery ? colors.accent : colors.card }]}
                onPress={() => setUseDiscovery(true)}
              >
                <Text style={[styles.switchText, { color: useDiscovery ? '#fff' : colors.accent }]}>不确定，聊几题</Text>
              </Pressable>
            </View>
            {useDiscovery ? (
              <View style={[styles.discoveryPanel, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.14) }]}>
                {DISCOVERY_QUESTIONS.map((question) => (
                  <View key={question.key} style={styles.discoveryBlock}>
                    <Text style={[styles.questionTitle, { color: colors.text }]}>{question.title}</Text>
                    <View style={styles.answerRow}>
                      {question.options.map((option) => {
                        const selected = discoveryAnswers[question.key] === option.value;
                        return (
                          <Pressable
                            key={option.value}
                            style={[
                              styles.answerChip,
                              {
                                backgroundColor: selected ? colors.accent : hexToRgba(colors.accent, 0.08),
                                borderColor: selected ? colors.accent : hexToRgba(colors.accent, 0.12),
                              },
                            ]}
                            onPress={() => {
                              setDiscoveryAnswers((current) => ({ ...current, [question.key]: option.value }));
                              setSelectedMbti(null);
                            }}
                          >
                            <Text style={[styles.answerText, { color: selected ? '#fff' : colors.text }]}>{option.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
                <View style={[styles.resultBox, { backgroundColor: hexToRgba(colors.accent, 0.1) }]}>
                  <Text style={[styles.resultLabel, { color: colors.accent }]}>暂定风格</Text>
                  <Text style={[styles.resultText, { color: colors.text }]}>
                    {inferredMbti ? `${inferredMbti} · ${getLifestyleProfile(inferredMbti).styleName}` : '回答完 4 题后生成'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.mbtiGrid}>
                {PERSONALITY_OPTIONS.map((option) => {
                  const selected = selectedMbti === option.type;
                  const optionColors = MBTI_THEMES[option.type].colors;
                  const optionStyle = getLifestyleProfile(option.type).styleName;
                  return (
                    <Pressable
                      key={option.type}
                      style={[
                        styles.mbtiCard,
                        {
                          backgroundColor: selected ? optionColors.accent : colors.card,
                          borderColor: selected ? optionColors.accent : hexToRgba(colors.accent, 0.12),
                          shadowColor: selected ? optionColors.accent : colors.accent,
                        },
                      ]}
                      onPress={() => {
                        setSelectedMbti(option.type);
                        setMBTI(option.type);
                      }}
                    >
                      <Text style={[styles.mbtiIcon, { color: selected ? '#fff' : optionColors.accent }]}>{option.icon}</Text>
                      <Text style={[styles.mbtiCode, { color: selected ? '#fff' : colors.text }]}>{option.type}</Text>
                      <Text style={[styles.mbtiLabel, { color: selected ? 'rgba(255,255,255,0.78)' : colors.subtext }]} numberOfLines={1}>
                        {optionStyle}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {step === 2 ? (
          <View>
            <StepTitle colors={colors} title="你喜欢的活动类型是？" subtitle="最多选 6 个，我会优先从这些方向里找具体安排。" />
            <View style={styles.typeGrid}>
              {ACTIVITY_TYPES.map((item) => {
                const selected = activityTypes.includes(item);
                return (
                  <Pressable
                    key={item}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: selected ? colors.accent : colors.card,
                        borderColor: selected ? colors.accent : hexToRgba(colors.accent, 0.12),
                      },
                    ]}
                    onPress={() => setActivityTypes((current) => toggleItem(current, item))}
                  >
                    <Text style={[styles.typeIcon, { color: selected ? '#fff' : colors.accent }]}>✦</Text>
                    <Text style={[styles.typeText, { color: selected ? '#fff' : colors.text }]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View>
            <StepTitle colors={colors} title="你的活动偏好是？" subtitle="不用精确，先给我一个大方向。" />
            <ScaleRow colors={colors} title="活动时长" left="短" right="长" value={durationLevel} onChange={setDurationLevel} />
            <ScaleRow colors={colors} title="活动强度" left="轻" right="高" value={activityIntensity} onChange={setActivityIntensity} />
            <ScaleRow colors={colors} title="预算范围" left="低" right="高" value={budgetLevel} onChange={setBudgetLevel} />
            <ScaleRow colors={colors} title="社交偏好" left="独处" right="热闹" value={socialLevel} onChange={setSocialLevel} />
            <ScaleRow colors={colors} title="计划提前量" left="现在" right="未来" value={planningHorizon} onChange={setPlanningHorizon} />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.doneStep}>
            <ImageBackground source={hero} resizeMode="cover" imageStyle={styles.doneImage} style={styles.doneHero}>
              <View style={[styles.doneOverlay, { backgroundColor: hexToRgba(colors.card, 0.68) }]}>
                <Text style={[styles.doneIcon, { color: colors.accent }]}>{theme.avatar}</Text>
              </View>
            </ImageBackground>
            <Text style={[styles.doneTitle, { color: colors.text }]}>太好了，我们准备好了</Text>
            <Text style={[styles.doneSub, { color: colors.subtext }]}>接下来会为你生成专属推荐、每日灵感和 AI 陪伴聊天。</Text>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.14) }]}>
              <SummaryLine colors={colors} label="风格" value={`${previewMbti} · ${lifestyle.styleName}`} />
              <SummaryLine colors={colors} label="活动" value={activityTypes.join('、')} />
              <SummaryLine colors={colors} label="预算" value={budget} />
              <SummaryLine colors={colors} label="通勤" value={commute} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.bg }]}>
        <Pressable
          disabled={!canContinue}
          onPress={next}
          style={[styles.primaryBtn, { backgroundColor: colors.accent }, !canContinue && styles.disabled]}
        >
          <Text style={styles.primaryText}>{step === 0 ? '开始探索' : step === 4 ? '开始推荐' : '下一步'}</Text>
        </Pressable>
        <Text style={[styles.privacy, { color: colors.subtext }]}>你的选择仅用于个性化推荐，不会公开</Text>
      </View>
    </SafeAreaView>
  );
}

function StepTitle({
  colors,
  title,
  subtitle,
}: {
  colors: { accent: string; text: string; subtext: string };
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.stepTitleWrap}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.subtext }]}>{subtitle}</Text>
    </View>
  );
}

function ScaleRow({
  colors,
  title,
  left,
  right,
  value,
  onChange,
}: {
  colors: { accent: string; card: string; text: string; subtext: string };
  title: string;
  left: string;
  right: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={[styles.scaleCard, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
      <View style={styles.scaleHeader}>
        <Text style={[styles.scaleTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.scaleValue, { color: colors.accent }]}>{value + 1}/5</Text>
      </View>
      <View style={styles.scaleLabels}>
        <Text style={[styles.scaleLabel, { color: colors.subtext }]}>{left}</Text>
        <Text style={[styles.scaleLabel, { color: colors.subtext }]}>{right}</Text>
      </View>
      <View style={styles.scaleTrack}>
        {[0, 1, 2, 3, 4].map((item) => (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={[
              styles.scaleDot,
              {
                backgroundColor: item <= value ? colors.accent : hexToRgba(colors.accent, 0.13),
                borderColor: item === value ? colors.accent : 'transparent',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function SummaryLine({
  colors,
  label,
  value,
}: {
  colors: { text: string; subtext: string };
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, { color: colors.subtext }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backHit: {
    width: 54,
    minHeight: 44,
    justifyContent: 'center',
  },
  back: {
    fontSize: 38,
    lineHeight: 40,
  },
  progressWrap: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skipBtn: {
    minWidth: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
  },
  skipPlaceholder: {
    width: 54,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingBottom: 132,
  },
  startStep: {
    paddingTop: 14,
  },
  wordmark: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  startTitle: {
    fontSize: 27,
    lineHeight: 35,
    fontWeight: '900',
    marginTop: 34,
  },
  startSub: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    marginBottom: 24,
  },
  heroCard: {
    minHeight: 330,
    borderRadius: 28,
    overflow: 'hidden',
  },
  heroImage: {
    borderRadius: 28,
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  heroLabel: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },
  heroText: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '900',
    maxWidth: '78%',
  },
  stepTitleWrap: {
    paddingTop: 18,
    marginBottom: 18,
  },
  stepTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
  },
  stepSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  switchItem: {
    flex: 1,
    minHeight: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '900',
  },
  discoveryPanel: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  discoveryBlock: {
    gap: 9,
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  answerRow: {
    flexDirection: 'row',
    gap: 9,
  },
  answerChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: {
    fontSize: 14,
    fontWeight: '800',
  },
  resultBox: {
    borderRadius: 18,
    padding: 13,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },
  resultText: {
    fontSize: 15,
    fontWeight: '900',
  },
  mbtiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mbtiCard: {
    width: '22.9%',
    minHeight: 96,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  mbtiIcon: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 7,
  },
  mbtiCode: {
    fontSize: 13,
    fontWeight: '900',
  },
  mbtiLabel: {
    fontSize: 9,
    marginTop: 4,
    maxWidth: '94%',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },
  typeCard: {
    width: '47.8%',
    minHeight: 86,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  typeIcon: {
    fontSize: 20,
    fontWeight: '900',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '900',
  },
  scaleCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  scaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scaleTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  scaleValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  scaleLabel: {
    fontSize: 13,
  },
  scaleTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  scaleDot: {
    width: 48,
    height: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  doneStep: {
    alignItems: 'center',
    paddingTop: 18,
  },
  doneHero: {
    width: '100%',
    minHeight: 220,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
  },
  doneImage: {
    borderRadius: 28,
  },
  doneOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneIcon: {
    fontSize: 54,
    fontWeight: '900',
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  doneSub: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 15,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
    paddingVertical: 9,
  },
  summaryLabel: {
    fontSize: 14,
    minWidth: 42,
  },
  summaryValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
  },
  primaryBtn: {
    height: 58,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.48,
  },
  primaryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  privacy: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
  },
});
