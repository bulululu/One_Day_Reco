import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MBTITheme, MBTIType, Recommendation } from '@/types';
import { HOME_ASSETS, HOME_IDEAS, getLifestyleHero } from '@/data/lifestyleDesign';
import { hexToRgba, softShadow, UI } from '@/styles/ui';

type RecommendViewProps = {
  mbti: MBTIType;
  theme: MBTITheme;
  featured: Recommendation;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenDetail: (recommendation: Recommendation) => void;
  onPrompt: (prompt: string) => void;
  onCompleteToday: () => void;
  onChat: () => void;
};

export function RecommendView({
  mbti,
  theme,
  featured,
  isLoading,
  onRefresh,
  onOpenDetail,
  onPrompt,
  onCompleteToday,
  onChat,
}: RecommendViewProps) {
  const colors = theme.colors;
  const hero = getLifestyleHero(mbti);
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
          onPress={onChat}
        >
          <Text style={[styles.profileIcon, { color: colors.accent }]}>{theme.avatar}</Text>
          <Text style={[styles.profileText, { color: colors.text }]}>和{theme.name}聊聊</Text>
        </Pressable>
      </View>

      <ImageBackground
        source={hero}
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
          <Pressable style={[styles.greetingButton, { backgroundColor: colors.accent }]} onPress={onRefresh}>
            <Text style={styles.greetingButtonText}>随便看看</Text>
          </Pressable>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>轻松推荐</Text>
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

      <View style={[styles.chatBanner, { backgroundColor: hexToRgba(colors.accent, 0.12), borderColor: hexToRgba(colors.accent, 0.12) }]}>
        <View style={[styles.chatMascot, { borderColor: colors.accent }]}>
          <Text style={[styles.chatFace, { color: colors.accent }]}>•ᴗ•</Text>
        </View>
        <View style={styles.chatCopy}>
          <Text style={[styles.chatTitle, { color: colors.text }]}>想找点灵感，还是想聊聊天？</Text>
          <Text style={[styles.chatSub, { color: colors.subtext }]}>{theme.name}在这里陪你～</Text>
        </View>
        <Pressable style={[styles.chatAction, { backgroundColor: colors.accent }]} onPress={onChat}>
          <Text style={styles.chatActionText}>找{theme.name}聊聊</Text>
        </Pressable>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.1) }]}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionIcon, { color: colors.accent }]}>♬</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>轻松一下</Text>
        </View>
        <View style={[styles.scheduleCard, { borderColor: hexToRgba(colors.accent, 0.12) }]}>
          <View style={[styles.checkCircle, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
            <Text style={[styles.checkText, { color: colors.accent }]}>▶</Text>
          </View>
          <View style={styles.scheduleCopy}>
            <Text style={[styles.scheduleTitle, { color: colors.text }]} numberOfLines={1}>给自己放首歌，放松一下吧～</Text>
            <Text style={[styles.scheduleTime, { color: colors.subtext }]} numberOfLines={1}>现在 · 3 分钟也可以开始</Text>
          </View>
          <Pressable style={[styles.doneButton, { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={onCompleteToday}>
            <Text style={styles.doneTextFilled}>完成</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.memoryBanner, { backgroundColor: colors.accent }]}>
        <View style={styles.memoryAvatar}>
          <Text style={[styles.memoryFace, { color: colors.accent }]}>•ᴗ•</Text>
        </View>
        <View style={styles.memoryCopy}>
          <Text style={styles.memoryTitle}>记录美好瞬间</Text>
          <Text style={styles.memorySub}>留下今天的小美好，回头看会很治愈</Text>
        </View>
        <Pressable style={styles.memoryButton} onPress={onChat}>
          <Text style={[styles.memoryButtonText, { color: colors.accent }]}>去聊天</Text>
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
    fontSize: 28,
    lineHeight: 34,
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
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '800',
  },
  greetingSub: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  greetingButton: {
    alignSelf: 'flex-start',
    borderRadius: 21,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 18,
  },
  greetingButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
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
    fontSize: 19,
    lineHeight: 26,
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
    fontSize: 17,
    lineHeight: 23,
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
  chatBanner: {
    minHeight: 88,
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  chatMascot: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffaf2',
  },
  chatFace: {
    fontSize: 21,
    fontWeight: '900',
  },
  chatCopy: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  chatSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  chatAction: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
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
    fontSize: 14,
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
  doneTextFilled: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
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
    fontSize: 14,
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
