/**
 * 入职引导屏幕
 * 浅色生活方式 UI：先选择性格类型，再配置活动约束。
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '@/store/appStore';
import { updateProfile } from '@/services/api';
import { MBTIType, UserPreferences } from '@/types';
import { getLifestyleProfile } from '@/data/lifestyleDesign';
import { MBTI_THEMES } from '@/data/themes';

const ACCENT = '#f5aa27';
const BG = '#fbf7f0';
const CARD = '#fffdfa';
const TEXT = '#302820';
const SUBTEXT = '#8b8177';
const LINE = '#eee5da';

const PERSONALITY_OPTIONS: Array<{
  type: MBTIType;
  label: string;
  icon: string;
  tint: string;
}> = [
  { type: 'ENFP', label: '乐观自由', icon: '☀', tint: '#fff3c8' },
  { type: 'INFP', label: '平和治愈', icon: '⌁', tint: '#edf5e7' },
  { type: 'INTJ', label: '理性思考', icon: '□', tint: '#e9f0ff' },
  { type: 'ESTJ', label: '行动高效', icon: '⚑', tint: '#fff0df' },
  { type: 'ESFP', label: '社交活跃', icon: '●●', tint: '#f1e9ff' },
  { type: 'ESFJ', label: '温暖体贴', icon: '♥', tint: '#ffe8f0' },
  { type: 'ENTP', label: '好奇探索', icon: '⌕', tint: '#e8f7f4' },
  { type: 'ISTJ', label: '沉稳内敛', icon: '▲', tint: '#f1ede7' },
  { type: 'INFJ', label: '细腻洞察', icon: '✦', tint: '#f0ebff' },
  { type: 'INTP', label: '随性分析', icon: '◇', tint: '#edf2ff' },
  { type: 'ENTJ', label: '目标清晰', icon: '↗', tint: '#e8f7ff' },
  { type: 'ISFP', label: '安静审美', icon: '◐', tint: '#fff0ec' },
  { type: 'ISFJ', label: '可靠细心', icon: '◌', tint: '#f3edf7' },
  { type: 'ISTP', label: '冷静实用', icon: '⌘', tint: '#eaf4ef' },
  { type: 'ESTP', label: '即兴行动', icon: '▶', tint: '#fff2df' },
  { type: 'ENFJ', label: '热情照顾', icon: '✿', tint: '#fff0e8' },
];

const SOCIAL_OPTIONS = [
  { label: '独处充电', value: '大部分时间独处' },
  { label: '小范围社交', value: '偶尔社交' },
  { label: '热闹聚会', value: '经常社交' },
];

const BUDGET_OPTIONS = [
  { label: '¥0-50', value: '0-50元' },
  { label: '¥50-150', value: '50-150元' },
  { label: '¥150+', value: '150元以上' },
];

const COMMUTE_OPTIONS = [
  { label: '15 分钟内', value: '15分钟以内' },
  { label: '30 分钟内', value: '30分钟以内' },
  { label: '45 分钟内', value: '45分钟以内' },
];

const SCENE_OPTIONS = [
  { label: '室内', value: '偏好室内' },
  { label: '户外', value: '偏好户外' },
  { label: '都可以', value: '室内户外都可以' },
];

const DISCOVERY_QUESTIONS = [
  {
    key: 'energy',
    title: '今天的社交能量',
    subtitle: '更接近哪一种？',
    options: [
      { label: '想安静一点', value: 'I' },
      { label: '想见见人', value: 'E' },
    ],
  },
  {
    key: 'reason',
    title: '你更吃哪种推荐',
    subtitle: '我给建议时，你更想听什么？',
    options: [
      { label: '讲清理由', value: 'T' },
      { label: '照顾感受', value: 'F' },
    ],
  },
  {
    key: 'plan',
    title: '安排方式',
    subtitle: '你希望我怎么帮你？',
    options: [
      { label: '直接排好', value: 'J' },
      { label: '给我挑选', value: 'P' },
    ],
  },
  {
    key: 'novelty',
    title: '今天想要的感觉',
    subtitle: '更偏稳定还是新鲜？',
    options: [
      { label: '熟悉舒服', value: 'S' },
      { label: '新鲜灵感', value: 'N' },
    ],
  },
] as const;

type DiscoveryKey = typeof DISCOVERY_QUESTIONS[number]['key'];
type DiscoveryAnswers = Partial<Record<DiscoveryKey, string>>;

function inferMbtiFromAnswers(answers: DiscoveryAnswers): MBTIType | null {
  const energy = answers.energy;
  const reason = answers.reason;
  const plan = answers.plan;
  const novelty = answers.novelty;
  if (!energy || !reason || !plan || !novelty) return null;
  return `${energy}${novelty}${reason}${plan}` as MBTIType;
}

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

type ThemeColors = {
  bg: string;
  card: string;
  accent: string;
  text: string;
  subtext: string;
};

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
  const [selectedMbti, setSelectedMbti] = useState<MBTIType | null>(mbti);
  const [social, setSocial] = useState('偶尔社交');
  const [budget, setBudget] = useState('50-150元');
  const [commute, setCommute] = useState('15分钟以内');
  const [scene, setScene] = useState('室内户外都可以');
  const [notes, setNotes] = useState('');
  const [useDiscovery, setUseDiscovery] = useState(!mbti);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<DiscoveryAnswers>({});

  useEffect(() => {
    if (mbti) setSelectedMbti(mbti);
  }, [mbti]);

  const inferredMbti = inferMbtiFromAnswers(discoveryAnswers);
  const finalMbti = useDiscovery ? inferredMbti : selectedMbti;
  const canStart = !!finalMbti;
  const previewMbti = finalMbti || selectedMbti || mbti || 'INFP';
  const previewTheme = MBTI_THEMES[previewMbti];
  const previewColors = previewTheme.colors;

  const handleStart = async () => {
    if (!finalMbti) return;
    setMBTI(finalMbti);
    const inferredNote = selectedMbti
      ? ''
      : `未手动选择 MBTI，入职问答暂定为 ${finalMbti}`;
    const prefs: UserPreferences = {
      social_frequency: social,
      budget,
      commute_tolerance: commute,
      notes: [scene, inferredNote, notes].filter(Boolean).join('；'),
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
        // 本地画像已保存；下次进入仍可继续使用。
      }
    }
    completeOnboarding();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: previewColors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topBar}>
          <Text style={[styles.back, { color: previewColors.text }]}>‹</Text>
          {isReturningUser ? (
            <Pressable
              onPress={startAppFromSaved}
              style={[
                styles.laterBtn,
                {
                  backgroundColor: previewColors.card,
                  borderColor: hexToRgba(previewColors.accent, 0.18),
                },
              ]}
            >
              <Text style={[styles.laterText, { color: previewColors.subtext }]}>稍后设置</Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>

        <View style={styles.progress}>
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={styles.progressItem}>
              <View
                style={[
                  styles.progressDot,
                  { backgroundColor: hexToRgba(previewColors.accent, 0.14) },
                  item === 0 && {
                    backgroundColor: previewColors.accent,
                    borderColor: hexToRgba(previewColors.accent, 0.18),
                  },
                ]}
              />
              {item < 3 ? (
                <View style={[styles.progressLine, { backgroundColor: hexToRgba(previewColors.accent, 0.12) }]} />
              ) : null}
            </View>
          ))}
        </View>

        <Text style={[styles.title, { color: previewColors.text }]}>让 OneDayReco 更懂你</Text>
        <Text style={[styles.subtitle, { color: previewColors.subtext }]}>
          简单选择你的偏好，推荐会更贴合你的生活方式。
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionIcon, { color: previewColors.accent }]}>♙</Text>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.sectionTitle, { color: previewColors.text }]}>你的推荐风格</Text>
              <Text
                style={[
                  styles.badge,
                  {
                    color: previewColors.accent,
                    backgroundColor: hexToRgba(previewColors.accent, 0.1),
                  },
                ]}
              >
                先定方向
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: previewColors.subtext }]}>
              不知道 MBTI 也可以直接开始
            </Text>
          </View>
        </View>

        <View style={styles.pathChoice}>
          <Pressable
            style={[
              styles.pathCard,
              {
                backgroundColor: previewColors.card,
                borderColor: useDiscovery ? previewColors.accent : hexToRgba(previewColors.accent, 0.14),
              },
            ]}
            onPress={() => {
              setUseDiscovery(true);
              setSelectedMbti(null);
            }}
          >
            <Text style={[styles.pathTitle, { color: useDiscovery ? previewColors.accent : previewColors.text }]}>
              不确定，聊几句
            </Text>
            <Text style={[styles.pathSub, { color: previewColors.subtext }]}>回答 4 个轻问题</Text>
          </Pressable>
          <Pressable
            style={[
              styles.pathCard,
              {
                backgroundColor: previewColors.card,
                borderColor: !useDiscovery ? previewColors.accent : hexToRgba(previewColors.accent, 0.14),
              },
            ]}
            onPress={() => setUseDiscovery(false)}
          >
            <Text style={[styles.pathTitle, { color: !useDiscovery ? previewColors.accent : previewColors.text }]}>
              我知道 MBTI
            </Text>
            <Text style={[styles.pathSub, { color: previewColors.subtext }]}>直接选择类型</Text>
          </Pressable>
        </View>

        {useDiscovery ? (
          <View
            style={[
              styles.discoveryPanel,
              {
                backgroundColor: previewColors.card,
                borderColor: hexToRgba(previewColors.accent, 0.14),
                shadowColor: previewColors.accent,
              },
            ]}
          >
            {DISCOVERY_QUESTIONS.map((question) => (
              <View key={question.key} style={styles.discoveryQuestion}>
                <Text style={[styles.discoveryQuestionTitle, { color: previewColors.text }]}>
                  {question.title}
                </Text>
                <Text style={[styles.discoveryQuestionSub, { color: previewColors.subtext }]}>
                  {question.subtitle}
                </Text>
                <View style={styles.discoveryOptions}>
                  {question.options.map((option) => {
                    const selected = discoveryAnswers[question.key] === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.discoveryOption,
                          {
                            backgroundColor: selected
                              ? hexToRgba(previewColors.accent, 0.12)
                              : hexToRgba(previewColors.accent, 0.04),
                            borderColor: selected ? previewColors.accent : 'transparent',
                          },
                        ]}
                        onPress={() => {
                          setDiscoveryAnswers((current) => ({
                            ...current,
                            [question.key]: option.value,
                          }));
                          setSelectedMbti(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.discoveryOptionText,
                            { color: selected ? previewColors.accent : previewColors.subtext },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            <View style={[styles.inferredBox, { backgroundColor: hexToRgba(previewColors.accent, 0.1) }]}>
              <Text style={[styles.inferredLabel, { color: previewColors.accent }]}>暂定风格</Text>
              <Text style={[styles.inferredValue, { color: previewColors.text }]}>
                {inferredMbti
                  ? `${inferredMbti} · ${getLifestyleProfile(inferredMbti).styleName} · 后续会根据反馈调整`
                  : '回答完 4 个问题后生成'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.personalityGrid}>
            {PERSONALITY_OPTIONS.map((option) => {
              const selected = selectedMbti === option.type;
              const lifestyle = getLifestyleProfile(option.type);
              const optionTheme = MBTI_THEMES[option.type];
              const optionColors = optionTheme.colors;
              return (
                <Pressable
                  key={option.type}
                  onPress={() => {
                    setSelectedMbti(option.type);
                    setMBTI(option.type);
                  }}
                  style={[
                    styles.personalityCard,
                    {
                      backgroundColor: selected ? optionColors.accent : previewColors.card,
                      borderColor: selected ? optionColors.accent : hexToRgba(previewColors.accent, 0.12),
                      shadowColor: selected ? optionColors.accent : previewColors.accent,
                    },
                  ]}
                >
                  {selected ? (
                    <View style={[styles.check, { backgroundColor: '#fff' }]}>
                      <Text style={[styles.checkText, { color: optionColors.accent }]}>✓</Text>
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.iconBubble,
                      {
                        backgroundColor: selected
                          ? 'rgba(255,255,255,0.2)'
                          : hexToRgba(optionColors.accent, 0.12),
                      },
                    ]}
                  >
                    <Text style={[styles.optionIcon, { color: selected ? '#fff' : optionColors.accent }]}>
                      {option.icon}
                    </Text>
                  </View>
                  <Text style={[styles.optionLabel, { color: selected ? '#fff' : previewColors.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionType, { color: selected ? 'rgba(255,255,255,0.84)' : previewColors.subtext }]}>
                    {option.type}
                  </Text>
                  <Text
                    style={[
                      styles.optionStyle,
                      { color: selected ? 'rgba(255,255,255,0.76)' : previewColors.subtext },
                    ]}
                    numberOfLines={1}
                  >
                    {lifestyle.styleName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionIcon, { color: previewColors.accent }]}>♡</Text>
          <View>
            <Text style={[styles.sectionTitle, { color: previewColors.text }]}>你的偏好设置</Text>
            <Text style={[styles.sectionSub, { color: previewColors.subtext }]}>这些帮助我们推荐更合适的活动</Text>
          </View>
        </View>

        <PreferenceRow
          icon="●●"
          title="社交能量"
          subtitle="你喜欢独处还是结伴？"
          options={SOCIAL_OPTIONS}
          value={social}
          onChange={setSocial}
          colors={previewColors}
        />
        <PreferenceRow
          icon="▣"
          title="预算范围"
          subtitle="单次活动的预算大致"
          options={BUDGET_OPTIONS}
          value={budget}
          onChange={setBudget}
          colors={previewColors}
        />
        <PreferenceRow
          icon="◷"
          title="通勤容忍度"
          subtitle="单程大约可以接受"
          options={COMMUTE_OPTIONS}
          value={commute}
          onChange={setCommute}
          colors={previewColors}
        />
        <PreferenceRow
          icon="⌁"
          title="偏好场景"
          subtitle="你更喜欢在哪里放松？"
          options={SCENE_OPTIONS}
          value={scene}
          onChange={setScene}
          colors={previewColors}
        />

        <View
          style={[
            styles.noteCard,
            {
              backgroundColor: previewColors.card,
              borderColor: hexToRgba(previewColors.accent, 0.12),
            },
          ]}
        >
          <Text style={[styles.noteTitle, { color: previewColors.text }]}>还有什么想告诉搭子？</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="比如：人多会累、想找安静的地方、今晚不想走太远"
            placeholderTextColor={hexToRgba(previewColors.subtext, 0.62)}
            multiline
            style={[styles.noteInput, { color: previewColors.text }]}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: previewColors.bg }]}>
        <Pressable
          disabled={!canStart}
          onPress={handleStart}
          style={[
            styles.startBtn,
            { backgroundColor: previewColors.accent },
            !canStart && styles.startBtnDisabled,
          ]}
        >
          <Text style={styles.startText}>开始使用</Text>
          <Text style={styles.startArrow}>›</Text>
        </Pressable>
        <Text style={[styles.privacy, { color: previewColors.subtext }]}>▣ 你的选择仅用于个性化推荐，不会公开</Text>
      </View>
    </SafeAreaView>
  );
}

function PreferenceRow({
  icon,
  title,
  subtitle,
  options,
  value,
  onChange,
  colors,
}: {
  icon: string;
  title: string;
  subtitle: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
  colors: ThemeColors;
}) {
  return (
    <View
      style={[
        styles.prefCard,
        {
          backgroundColor: colors.card,
          borderColor: hexToRgba(colors.accent, 0.12),
          shadowColor: colors.accent,
        },
      ]}
    >
      <View style={styles.prefLead}>
        <View style={[styles.prefIcon, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
          <Text style={[styles.prefIconText, { color: colors.accent }]}>{icon}</Text>
        </View>
        <View style={styles.prefCopy}>
          <Text style={[styles.prefTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.prefSub, { color: colors.subtext }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.segmentGroup}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.segment,
                {
                  backgroundColor: selected ? hexToRgba(colors.accent, 0.1) : hexToRgba(colors.accent, 0.04),
                  borderColor: selected ? colors.accent : 'transparent',
                },
              ]}
            >
              <Text style={[styles.segmentText, { color: selected ? colors.accent : colors.subtext }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 170,
  },
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    color: TEXT,
    fontSize: 42,
    lineHeight: 42,
    marginLeft: -6,
  },
  laterBtn: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fffbf6',
  },
  laterText: {
    color: SUBTEXT,
    fontSize: 14,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 34,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e7e1dc',
  },
  progressDotActive: {
    backgroundColor: ACCENT,
    borderWidth: 4,
    borderColor: '#fff4d7',
  },
  progressLine: {
    width: 46,
    height: 2,
    backgroundColor: '#e7e1dc',
    marginHorizontal: 8,
  },
  title: {
    color: TEXT,
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 10,
  },
  subtitle: {
    color: SUBTEXT,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  sectionIcon: {
    color: '#9b7a44',
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: '700',
  },
  badge: {
    color: '#ba8120',
    backgroundColor: '#fff1d5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    overflow: 'hidden',
  },
  sectionSub: {
    color: SUBTEXT,
    fontSize: 14,
    marginTop: 5,
  },
  pathChoice: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  pathCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f2e6d5',
    backgroundColor: CARD,
    padding: 14,
    justifyContent: 'center',
  },
  pathCardActive: {
    borderColor: ACCENT,
    backgroundColor: '#fff9ed',
  },
  pathTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  pathTitleActive: {
    color: '#b97613',
  },
  pathSub: {
    color: SUBTEXT,
    fontSize: 13,
    lineHeight: 18,
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  personalityCard: {
    width: '22.7%',
    minHeight: 112,
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f3eee8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    shadowColor: '#9b7a44',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  personalityCardSelected: {
    borderColor: ACCENT,
    backgroundColor: '#fffdf8',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  optionIcon: {
    color: '#7a9a54',
    fontSize: 21,
    fontWeight: '800',
  },
  optionLabel: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionType: {
    color: SUBTEXT,
    fontSize: 13,
  },
  optionStyle: {
    color: '#a79686',
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
    maxWidth: '92%',
  },
  discoveryCard: {
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f2e6d5',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#9b7a44',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  discoveryCardActive: {
    borderColor: ACCENT,
    backgroundColor: '#fffaf0',
  },
  discoveryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff2d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  discoveryIconText: {
    color: ACCENT,
    fontSize: 21,
    fontWeight: '800',
  },
  discoveryCopy: {
    flex: 1,
  },
  discoveryTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
  },
  discoverySub: {
    color: SUBTEXT,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  discoveryArrow: {
    color: '#a36f16',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },
  discoveryPanel: {
    backgroundColor: '#fffaf3',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f2e6d5',
    padding: 14,
    marginBottom: 28,
    gap: 14,
  },
  discoveryQuestion: {
    gap: 7,
  },
  discoveryQuestionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
  },
  discoveryQuestionSub: {
    color: SUBTEXT,
    fontSize: 13,
  },
  discoveryOptions: {
    flexDirection: 'row',
    gap: 9,
  },
  discoveryOption: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbf8f4',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  discoveryOptionSelected: {
    backgroundColor: '#fff3d8',
    borderColor: '#e3b45c',
  },
  discoveryOptionText: {
    color: '#7c756e',
    fontSize: 14,
    fontWeight: '700',
  },
  discoveryOptionTextSelected: {
    color: '#a36f16',
  },
  inferredBox: {
    borderRadius: 16,
    backgroundColor: '#fff3d8',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  inferredLabel: {
    color: '#a36f16',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  inferredValue: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '700',
  },
  prefCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f2ebe3',
    shadowColor: '#9b7a44',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  prefLead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  prefIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff2d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prefIconText: {
    color: '#d39424',
    fontSize: 18,
    fontWeight: '800',
  },
  prefCopy: {
    flex: 1,
  },
  prefTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '700',
  },
  prefSub: {
    color: SUBTEXT,
    fontSize: 13,
    marginTop: 3,
  },
  segmentGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbf8f4',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 4,
  },
  segmentSelected: {
    backgroundColor: '#fff8eb',
    borderColor: '#e3b45c',
  },
  segmentText: {
    color: '#7c756e',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  segmentTextSelected: {
    color: '#a36f16',
  },
  noteCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#f2ebe3',
  },
  noteTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  noteInput: {
    minHeight: 78,
    color: TEXT,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BG,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
  },
  startBtn: {
    height: 64,
    borderRadius: 32,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#cf8b1c',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  startBtnDisabled: {
    opacity: 0.5,
  },
  startText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  startArrow: {
    position: 'absolute',
    right: 28,
    color: '#fff',
    fontSize: 36,
    lineHeight: 38,
  },
  privacy: {
    color: SUBTEXT,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
  },
});
