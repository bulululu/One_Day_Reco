/**
 * 入职引导屏幕
 * 3 步流程：MBTI 选择 → 偏好设置 → 备注
 * 灵感: Headspace
 */
import React, { useState } from 'react';
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
import { MBTI_TYPES } from '@/data/themes';
import { MBTI_PERSONAS } from '@/data/personas';
import { MBTIType, UserPreferences } from '@/types';
import { ProgressDots } from '@/components/ProgressDots';

const SOCIAL_OPTIONS = [
  { label: '一个人待着', value: '大部分时间独处' },
  { label: '偶尔社交', value: '偶尔社交' },
  { label: '喜欢和人一起', value: '经常社交' },
  { label: '社交达人', value: '频繁社交' },
];

const BUDGET_OPTIONS = [
  { label: '免费最好', value: '0-30元' },
  { label: '适量花费', value: '30-100元' },
  { label: '品质消费', value: '100-300元' },
  { label: '不限预算', value: '不限' },
];

const COMMUTE_OPTIONS = [
  { label: '步行可达', value: '15分钟以内' },
  { label: '近一点', value: '30分钟以内' },
  { label: '可以坐车', value: '1小时以内' },
  { label: '远点也行', value: '不限' },
];

export function OnboardingScreen() {
  const { mbti, setMBTI, setPreferences, completeOnboarding, currentTheme, isReturningUser, startAppFromSaved } = useAppStore();
  const [step, setStep] = useState(0);
  const [selectedMbti, setSelectedMbti] = useState<MBTIType | null>(mbti);
  const [social, setSocial] = useState('');
  const [budget, setBudget] = useState('');
  const [commute, setCommute] = useState('');
  const [notes, setNotes] = useState('');

  const colors = currentTheme.colors;
  const persona = selectedMbti ? MBTI_PERSONAS[selectedMbti] : MBTI_PERSONAS['INTP'];

  // 返回用户跳过步骤 1
  React.useEffect(() => {
    if (isReturningUser && mbti) {
      setStep(1);
    }
  }, []);

  const handleMbtiSelect = (type: MBTIType) => {
    setSelectedMbti(type);
    setMBTI(type);
  };

  const handleNext = () => {
    if (step === 0 && selectedMbti) {
      setMBTI(selectedMbti);
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      const prefs: UserPreferences = {
        social_frequency: social,
        budget,
        commute_tolerance: commute,
        notes,
      };
      setPreferences(prefs);
      completeOnboarding();
    }
  };

  const canProceed = () => {
    if (step === 0) return !!selectedMbti;
    return true;
  };

  const stepTitles = [
    { title: persona.step1Title, sub: persona.step1Sub },
    { title: persona.step2Title, sub: persona.step2Sub },
    { title: persona.step3Title, sub: persona.step3Sub },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 进度指示 */}
        <ProgressDots total={3} current={step} theme={currentTheme} />

        {/* 步骤标题 */}
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {stepTitles[step].title}
        </Text>
        <Text style={[styles.stepSub, { color: colors.subtext }]}>
          {stepTitles[step].sub}
        </Text>

        {/* 步骤 1: MBTI 选择 */}
        {step === 0 && (
          <View style={styles.mbtiGrid}>
            {MBTI_TYPES.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.mbtiCard,
                  {
                    backgroundColor: selectedMbti === type ? colors.accent : colors.card,
                    borderColor: selectedMbti === type ? colors.accent : 'transparent',
                    borderRadius: parseInt(currentTheme.radius) + 4,
                  },
                ]}
                onPress={() => handleMbtiSelect(type)}
              >
                <Text
                  style={[
                    styles.mbtiText,
                    { color: selectedMbti === type ? '#fff' : colors.text },
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* 步骤 2: 偏好设置 */}
        {step === 1 && (
          <View style={styles.preferencesContainer}>
            {/* 社交频率 */}
            <Text style={[styles.prefLabel, { color: colors.text }]}>社交偏好</Text>
            <View style={styles.optionGrid}>
              {SOCIAL_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: social === opt.value ? colors.accent : colors.card,
                      borderRadius: parseInt(currentTheme.radius) + 4,
                    },
                  ]}
                  onPress={() => setSocial(opt.value)}
                >
                  <Text style={[styles.optionText, { color: social === opt.value ? '#fff' : colors.text }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 预算 */}
            <Text style={[styles.prefLabel, { color: colors.text }]}>预算范围</Text>
            <View style={styles.optionGrid}>
              {BUDGET_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: budget === opt.value ? colors.accent : colors.card,
                      borderRadius: parseInt(currentTheme.radius) + 4,
                    },
                  ]}
                  onPress={() => setBudget(opt.value)}
                >
                  <Text style={[styles.optionText, { color: budget === opt.value ? '#fff' : colors.text }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 通勤容忍 */}
            <Text style={[styles.prefLabel, { color: colors.text }]}>通勤容忍</Text>
            <View style={styles.optionGrid}>
              {COMMUTE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: commute === opt.value ? colors.accent : colors.card,
                      borderRadius: parseInt(currentTheme.radius) + 4,
                    },
                  ]}
                  onPress={() => setCommute(opt.value)}
                >
                  <Text style={[styles.optionText, { color: commute === opt.value ? '#fff' : colors.text }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* 步骤 3: 备注 */}
        {step === 2 && (
          <View style={styles.notesContainer}>
            <Text style={[styles.prefLabel, { color: colors.text }]}>有什么想告诉搭子的？</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderRadius: parseInt(currentTheme.radius) + 4,
                },
              ]}
              placeholder="比如：喜欢安静的地方，人多的地方会焦虑"
              placeholderTextColor={colors.subtext}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}
      </ScrollView>

      {/* 底部按钮 */}
      <View style={[styles.footer, { backgroundColor: colors.bg }]}>
        {isReturningUser && step === 1 && (
          <Pressable onPress={startAppFromSaved} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.subtext }]}>跳过，直接进入</Text>
          </Pressable>
        )}
        <Pressable
          style={[
            styles.nextBtn,
            {
              backgroundColor: canProceed() ? colors.accent : 'rgba(255,255,255,0.1)',
              borderRadius: 30,
            },
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextText}>
            {step === 2 ? '开始使用' : '下一步'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  stepSub: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  mbtiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mbtiCard: {
    width: '23%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  mbtiText: {
    fontSize: 14,
    fontWeight: '700',
  },
  preferencesContainer: {
    gap: 8,
  },
  prefLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexGrow: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesContainer: {
    gap: 8,
  },
  textInput: {
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
  },
  nextBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
