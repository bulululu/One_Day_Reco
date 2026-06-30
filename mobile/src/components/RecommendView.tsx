import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MBTITheme, MBTIType, Recommendation } from '@/types';
import { HOME_ASSETS, HOME_IDEAS, getLifestyleProfile } from '@/data/lifestyleDesign';
import { hexToRgba, softShadow, UI } from '@/styles/ui';

type RecommendViewProps = {
  mbti: MBTIType;
  theme: MBTITheme;
  featured: Recommendation;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenDetail: (recommendation: Recommendation) => void;
  onPrompt: (prompt: string) => void;
  onOpenProfile: () => void;
  onCompleteToday: () => void;
};

export function RecommendView({
  mbti,
  theme,
  featured,
  isLoading,
  onRefresh,
  onOpenDetail,
  onPrompt,
  onOpenProfile,
  onCompleteToday,
}: RecommendViewProps) {
  const colors = theme.colors;
  const lifestyle = getLifestyleProfile(mbti);
  const featureTitle = featured.specific_info?.name || featured.activity_name;
  const featureCopy = featured.recommend_text.split('。')[0] || '慢下来，照顾好自己。';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <View>
          <Text style={[styles.wordmark, { color: colors.accent }]}>OneDayReco</Text>
          <Text style={[styles.brandSub, { color: colors.subtext }]}>每一天，都值得被好好安排。</Text>
        </View>
        <Pressable
          style={[styles.profileButton, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.14) }]}
          onPress={onOpenProfile}
        >
          <Text style={[styles.profileIcon, { color: colors.accent }]}>⚙</Text>
          <Text style={[styles.profileText, { color: colors.text }]}>我的</Text>
        </Pressable>
      </View>

      <ImageBackground
        source={HOME_ASSETS.hero}
        resizeMode="cover"
        imageStyle={styles.greetingImage}
        style={[styles.greetingCard, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }, softShadow(colors.accent, 0.05)]}
      >
        <LinearGradient
          colors={[hexToRgba(colors.card, 0.98), hexToRgba(colors.card, 0.76), hexToRgba(colors.card, 0.08)]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.72, y: 0.5 }}
          style={styles.greetingOverlay}
        >
          <Text style={[styles.greetingTitle, { color: colors.text }]}>早安，{theme.name}</Text>
          <Text style={[styles.greetingSub, { color: colors.text }]}>今天想一起做点什么呢？</Text>
          <Text style={[styles.greetingMeta, { color: colors.accent }]}>{mbti} · {lifestyle.styleName}</Text>
        </LinearGradient>
      </ImageBackground>

      <Pressable onPress={() => onOpenDetail(featured)}>
        <ImageBackground
          source={HOME_ASSETS.feature}
          resizeMode="cover"
          imageStyle={styles.featureImage}
          style={[styles.featureCard, softShadow(colors.accent, 0.06)]}
        >
          <LinearGradient
            colors={[hexToRgba('#fffaf2', 0.5), hexToRgba('#fffaf2', 0.16), 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 0.78 }}
            style={styles.featureOverlay}
          >
            <View style={[styles.featureTag, { backgroundColor: colors.accent }]}>
              <Text style={styles.featureTagText}>今日灵感</Text>
            </View>
            <Text style={[styles.featureTitle, { color: colors.text }]} numberOfLines={2}>
              {featureTitle}
            </Text>
            <Text style={[styles.featureSub, { color: colors.text }]} numberOfLines={2}>
              {featureCopy}。
            </Text>
            <Pressable
              style={[styles.featureButton, { backgroundColor: colors.accent }]}
              onPress={() => onOpenDetail(featured)}
            >
              <Text style={styles.featureButtonText}>开始今日计划</Text>
              <Text style={styles.featureArrow}>→</Text>
            </Pressable>
          </LinearGradient>
        </ImageBackground>
      </Pressable>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.1) }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionIcon, { color: colors.accent }]}>⌁</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>今日灵感卡片</Text>
          </View>
          <Pressable style={styles.refreshInline} onPress={onRefresh} disabled={isLoading}>
            <Text style={[styles.refreshText, { color: colors.subtext }]}>{isLoading ? '刷新中' : '换一批'}</Text>
            <Text style={[styles.refreshIcon, { color: colors.subtext }]}>↻</Text>
          </Pressable>
        </View>

        <View style={styles.ideaGrid}>
          {HOME_IDEAS.slice(0, 3).map((idea) => (
            <Pressable
              key={idea.key}
              style={[styles.ideaCard, { borderColor: hexToRgba(colors.accent, 0.1) }]}
              onPress={() => onPrompt(idea.prompt)}
            >
              <ImageBackground source={idea.image} resizeMode="cover" imageStyle={styles.ideaImage} style={styles.ideaVisual} />
              <View style={styles.ideaCopy}>
                <Text style={[styles.ideaTitle, { color: colors.text }]} numberOfLines={1}>{idea.title}</Text>
                <Text style={[styles.ideaSub, { color: colors.subtext }]} numberOfLines={1}>{idea.subtitle}</Text>
                <View style={styles.ideaFooter}>
                  <Text style={[styles.ideaTag, { color: colors.accent, backgroundColor: hexToRgba(colors.accent, 0.1) }]} numberOfLines={1}>
                    {idea.tag}
                  </Text>
                  <Text style={[styles.ideaDistance, { color: colors.subtext }]} numberOfLines={1}>{idea.distance}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.1) }]}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionIcon, { color: colors.accent }]}>☑</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>今日日程</Text>
        </View>
        <View style={[styles.scheduleCard, { borderColor: hexToRgba(colors.accent, 0.12) }]}>
          <View style={styles.dateBlock}>
            <Text style={[styles.weekText, { color: colors.subtext }]}>今天</Text>
            <Text style={[styles.dateText, { color: colors.text }]}>现在</Text>
          </View>
          <View style={[styles.checkCircle, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
            <Text style={[styles.checkText, { color: colors.accent }]}>✓</Text>
          </View>
          <View style={styles.scheduleCopy}>
            <Text style={[styles.scheduleTitle, { color: colors.text }]} numberOfLines={1}>给自己留一段轻时间</Text>
            <Text style={[styles.scheduleTime, { color: colors.subtext }]} numberOfLines={1}>
              {featured.specific_info?.duration || '约 60-90 分钟'}
            </Text>
          </View>
          <Pressable style={[styles.doneButton, { borderColor: hexToRgba(colors.accent, 0.18) }]} onPress={onCompleteToday}>
            <Text style={[styles.doneText, { color: colors.accent }]}>完成</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.memoryBanner, { backgroundColor: colors.accent }]}>
        <View style={styles.memoryAvatar}>
          <Text style={[styles.memoryFace, { color: colors.accent }]}>•ᴗ•</Text>
        </View>
        <View style={styles.memoryCopy}>
          <Text style={styles.memoryTitle}>记录我们的美好瞬间</Text>
          <Text style={styles.memorySub}>珍藏每一个值得回忆的时刻</Text>
        </View>
        <Pressable style={styles.memoryButton} onPress={() => onPrompt('帮我记录今天这个活动的感受')}>
          <Text style={[styles.memoryButtonText, { color: colors.accent }]}>去记录</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: UI.space.pageX,
    paddingTop: 16,
    paddingBottom: 112,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  wordmark: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  brandSub: {
    fontSize: 14,
    marginTop: 2,
  },
  profileButton: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  profileIcon: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileText: {
    fontSize: 15,
    fontWeight: '700',
  },
  greetingCard: {
    height: 150,
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  greetingImage: {
    borderRadius: UI.radius.xl,
  },
  greetingOverlay: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
  },
  greetingSub: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 6,
  },
  greetingMeta: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 16,
  },
  featureCard: {
    height: 184,
    borderRadius: UI.radius.xl,
    overflow: 'hidden',
    marginBottom: 16,
  },
  featureImage: {
    borderRadius: UI.radius.xl,
  },
  featureOverlay: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  featureTag: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  featureTagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  featureTitle: {
    maxWidth: '58%',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
  },
  featureSub: {
    maxWidth: '60%',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  featureButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 17,
  },
  featureButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  featureArrow: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  section: {
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 19,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
  },
  refreshInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '700',
  },
  refreshIcon: {
    fontSize: 16,
  },
  ideaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  ideaCard: {
    flex: 1,
    borderRadius: UI.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ideaVisual: {
    height: 80,
  },
  ideaImage: {
    borderTopLeftRadius: UI.radius.md,
    borderTopRightRadius: UI.radius.md,
  },
  ideaCopy: {
    padding: 9,
  },
  ideaTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  ideaSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  ideaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 8,
  },
  ideaTag: {
    maxWidth: 66,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
  },
  ideaDistance: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
  },
  scheduleCard: {
    minHeight: 72,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  dateBlock: {
    width: 48,
    borderRightWidth: 1,
    borderRightColor: 'rgba(130,122,112,0.16)',
  },
  weekText: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  checkCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 20,
    fontWeight: '800',
  },
  scheduleCopy: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scheduleTime: {
    fontSize: 13,
    marginTop: 4,
  },
  doneButton: {
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  doneText: {
    fontSize: 13,
    fontWeight: '800',
  },
  memoryBanner: {
    minHeight: 72,
    borderRadius: UI.radius.xl,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  memoryAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,250,242,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryFace: {
    fontSize: 17,
    fontWeight: '800',
  },
  memoryCopy: {
    flex: 1,
  },
  memoryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  memorySub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    marginTop: 4,
  },
  memoryButton: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,250,242,0.92)',
    justifyContent: 'center',
  },
  memoryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
