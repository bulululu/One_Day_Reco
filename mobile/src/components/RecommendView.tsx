import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MBTITheme, MBTIType, Recommendation } from '@/types';
import { HOME_IDEAS, getLifestyleHero, getLifestyleProfile } from '@/data/lifestyleDesign';
import { hexToRgba, softShadow, UI } from '@/styles/ui';

type RecommendViewProps = {
  theme: MBTITheme;
  mbti: MBTIType;
  recommendations: Recommendation[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenDetail: (recommendation: Recommendation) => void;
  onPrompt: (prompt: string) => void;
  onChat: () => void;
};

function cleanFeatureCopy(text: string) {
  const firstSentence = text.split('。')[0] || '慢下来，照顾好自己';
  let decoded = firstSentence;
  try {
    decoded = decodeURIComponent(firstSentence);
  } catch {
    decoded = firstSentence;
  }
  return decoded
    .replace(/https?:\/\/\S+/g, '')
    .replace(/入口[:：]\s*\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanFeatureTitle(text: string) {
  return text
    .replace(/（搜索选择一家）/g, '')
    .replace(/\(搜索选择一家\)/g, '')
    .replace(/搜索选择一家/g, '')
    .trim() || '给自己一段舒服时光';
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return '早安';
  if (hour >= 11 && hour < 14) return '午安';
  if (hour >= 14 && hour < 18) return '下午好';
  return '晚上好';
}

export function RecommendView({
  theme,
  mbti,
  recommendations,
  isLoading,
  onRefresh,
  onOpenDetail,
  onPrompt,
  onChat,
}: RecommendViewProps) {
  const colors = theme.colors;
  const greeting = timeGreeting();
  const profile = getLifestyleProfile(mbti);
  const hero = getLifestyleHero(mbti);
  const cards = HOME_IDEAS.slice(0, 3).map((idea, index) => {
    const recommendation = recommendations[index];
    if (!recommendation) {
      return {
        key: idea.key,
        title: idea.title,
        subtitle: idea.subtitle,
        tag: idea.tag,
        meta: idea.distance,
        image: idea.image,
        onPress: () => onPrompt(idea.prompt),
      };
    }
    return {
      key: recommendation.activity_id,
      title: cleanFeatureTitle(recommendation.specific_info?.name || recommendation.activity_name),
      subtitle: cleanFeatureCopy(recommendation.recommend_text) || recommendation.category || idea.subtitle,
      tag: recommendation.category || idea.tag,
      meta: recommendation.specific_info?.duration || recommendation.budget || idea.distance,
      image: idea.image,
      onPress: () => onOpenDetail(recommendation),
    };
  });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <View>
          <Text style={[styles.wordmark, { color: colors.accent }]}>OneDayReco</Text>
          <Text style={[styles.brandSub, { color: colors.subtext }]}>每天几个现在能做的活动。</Text>
        </View>
        <Pressable
          style={[styles.profileButton, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.14) }]}
          onPress={onChat}
        >
          <Text style={[styles.profileIcon, { color: colors.accent }]}>{theme.avatar}</Text>
          <Text style={[styles.profileText, { color: colors.text }]}>补充需求</Text>
        </Pressable>
      </View>

      <ImageBackground
        source={hero}
        resizeMode="cover"
        imageStyle={styles.greetingImage}
        style={[styles.greetingCard, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }, softShadow(colors.accent, 0.05)]}
      >
        <LinearGradient
          colors={[hexToRgba(colors.card, 0.94), hexToRgba(colors.card, 0.58), hexToRgba(colors.card, 0.02)]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.72, y: 0.5 }}
          style={styles.greetingOverlay}
        >
          <View style={[styles.styleBadge, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
            <Text style={[styles.styleBadgeText, { color: colors.accent }]}>{mbti} · {profile.styleName}</Text>
          </View>
          <Text style={[styles.greetingTitle, { color: colors.text }]}>{greeting}，{theme.name}</Text>
          <Text style={[styles.greetingSub, { color: colors.text }]}>{profile.subtitle}，我会直接给出具体活动。</Text>
          <Pressable style={[styles.greetingButton, { backgroundColor: colors.accent }]} onPress={onRefresh}>
            <Text style={styles.greetingButtonText}>推荐活动</Text>
          </Pressable>
        </LinearGradient>
      </ImageBackground>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.1) }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionIcon, { color: colors.accent }]}>⌁</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>推荐活动</Text>
          </View>
          <Pressable style={styles.refreshInline} onPress={onRefresh} disabled={isLoading}>
            <Text style={[styles.refreshText, { color: colors.subtext }]}>{isLoading ? '推荐中' : '重新推荐'}</Text>
            <Text style={[styles.refreshIcon, { color: colors.subtext }]}>↻</Text>
          </Pressable>
        </View>

        <View style={styles.ideaGrid}>
          {cards.map((card) => (
            <Pressable
              key={card.key}
              style={[styles.ideaCard, { borderColor: hexToRgba(colors.accent, 0.1) }]}
              onPress={card.onPress}
            >
              <ImageBackground source={card.image} resizeMode="cover" imageStyle={styles.ideaImage} style={styles.ideaVisual} />
              <View style={styles.ideaCopy}>
                <Text style={[styles.ideaTitle, { color: colors.text }]} numberOfLines={1}>{card.title}</Text>
                <Text style={[styles.ideaSub, { color: colors.subtext }]} numberOfLines={1}>{card.subtitle}</Text>
                <View style={styles.ideaFooter}>
                  <Text style={[styles.ideaTag, { color: colors.accent, backgroundColor: hexToRgba(colors.accent, 0.1) }]} numberOfLines={1}>
                    {card.tag}
                  </Text>
                  <Text style={[styles.ideaDistance, { color: colors.subtext }]} numberOfLines={1}>{card.meta}</Text>
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
          <Text style={[styles.chatTitle, { color: colors.text }]}>条件不对？</Text>
          <Text style={[styles.chatSub, { color: colors.subtext }]}>告诉我人少、预算、距离或电影类型。</Text>
        </View>
        <Pressable style={[styles.chatAction, { backgroundColor: colors.accent }]} onPress={onChat}>
          <Text style={styles.chatActionText}>补充条件</Text>
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
  styleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 9,
  },
  styleBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
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
    fontSize: 13,
    fontWeight: '800',
  },
  ideaSub: {
    fontSize: 10,
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
    minHeight: 78,
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  chatMascot: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffaf2',
  },
  chatFace: {
    fontSize: 18,
    fontWeight: '900',
  },
  chatCopy: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 13,
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
    fontSize: 12,
    fontWeight: '900',
  },
});
