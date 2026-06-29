/**
 * 入职引导屏幕（极简版）
 * 1 步：选 MBTI → 直接进入
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/store/appStore';
import { MBTI_THEMES, MBTI_TYPES } from '@/data/themes';
import { MBTIType } from '@/types';

const { width } = Dimensions.get('window');
const CARD_W = (width - 20 * 2 - 10 * 3) / 4; // 4 columns

export function OnboardingScreen() {
  const { completeOnboarding, setMBTI, setPreferences } = useAppStore();
  const [selected, setSelected] = useState<MBTIType | null>(null);

  const theme = selected ? MBTI_THEMES[selected] : MBTI_THEMES['INTP'];
  const colors = theme.colors;

  const handleSelect = (type: MBTIType) => {
    setSelected(type);
    setMBTI(type);
  };

  const handleEnter = () => {
    if (!selected) return;
    setPreferences({
      social_frequency: '',
      budget: '',
      commute_tolerance: '',
      notes: '',
    });
    completeOnboarding();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 顶部渐变装饰 */}
      <LinearGradient
        colors={[colors.accent + '20', 'transparent']}
        style={styles.topGlow}
      />

      {/* Logo + 标题 */}
      <View style={styles.header}>
        <Text style={styles.logo}>🌙</Text>
        <Text style={[styles.title, { color: colors.text }]}>OneDayReco</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          你的私人活动搭子，随时帮你找点事做
        </Text>
      </View>

      {/* MBTI 选择 */}
      <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
        选一下你的 MBTI，我来匹配搭子风格
      </Text>

      <View style={styles.grid}>
        {MBTI_TYPES.map((type) => {
          const isSelected = selected === type;
          const t = MBTI_THEMES[type];
          return (
            <Pressable
              key={type}
              style={[
                styles.card,
                {
                  backgroundColor: isSelected ? t.colors.accent : colors.card,
                  borderColor: isSelected ? t.colors.accent : 'transparent',
                },
              ]}
              onPress={() => handleSelect(type)}
            >
              <Text style={styles.cardEmoji}>{t.avatar}</Text>
              <Text
                style={[
                  styles.cardText,
                  { color: isSelected ? '#fff' : colors.text },
                ]}
              >
                {type}
              </Text>
              {isSelected && <Text style={styles.cardName}>{t.name}</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.btn,
            {
              backgroundColor: selected ? colors.accent : 'rgba(255,255,255,0.08)',
            },
          ]}
          onPress={handleEnter}
          disabled={!selected}
        >
          <Text style={[styles.btnText, { opacity: selected ? 1 : 0.4 }]}>
            {selected ? `进入 · ${theme.name}` : '选择 MBTI 后进入'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 300,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 28,
  },
  logo: { fontSize: 48 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    width: CARD_W,
    height: CARD_W,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardEmoji: { fontSize: 22 },
  cardText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  cardName: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
