import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivitySourceMeta, MBTITheme, MBTIType, Recommendation } from '@/types';
import { HOME_IDEAS, getLifestyleHero, getLifestyleProfile } from '@/data/lifestyleDesign';
import { RecommendationCard } from '@/components/RecommendationCard';

type RecommendViewProps = {
  mbti: MBTIType;
  theme: MBTITheme;
  featured: Recommendation;
  recommendations: Recommendation[];
  source?: ActivitySourceMeta;
  location: string;
  weather: string;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenDetail: (recommendation: Recommendation) => void;
  onPrompt: (prompt: string) => void;
};

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

export function RecommendView({
  mbti,
  theme,
  featured,
  recommendations,
  source,
  location,
  weather,
  isLoading,
  onRefresh,
  onOpenDetail,
  onPrompt,
}: RecommendViewProps) {
  const colors = theme.colors;
  const lifestyle = getLifestyleProfile(mbti);
  const hero = getLifestyleHero(mbti);
  const sourceLabel = source?.is_realtime ? '实时候选' : '精选兜底';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <View>
          <Text style={[styles.wordmark, { color: colors.accent }]}>OneDayReco</Text>
          <Text style={[styles.brandSub, { color: colors.subtext }]}>每一天，都值得被好好安排。</Text>
        </View>
        <Pressable
          style={[styles.refreshBtn, { backgroundColor: hexToRgba(colors.accent, 0.1) }]}
          onPress={onRefresh}
          disabled={isLoading}
        >
          <Text style={[styles.refreshText, { color: colors.accent }]}>{isLoading ? '安排中' : '换一批'}</Text>
        </Pressable>
      </View>

      <ImageBackground source={hero} resizeMode="cover" imageStyle={styles.heroImage} style={[styles.heroCard, { backgroundColor: colors.card }]}>
        <LinearGradient
          colors={[hexToRgba(colors.card, 0.9), hexToRgba(colors.card, 0.48), 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.45 }}
          end={{ x: 0.78, y: 0.5 }}
          style={styles.heroOverlay}
        >
          <Text style={[styles.styleName, { color: colors.accent }]}>{lifestyle.styleName}</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>早安，{theme.name}</Text>
          <Text style={[styles.heroSub, { color: colors.text }]}>今天想一起做点什么呢？</Text>
          <View style={[styles.contextPill, { backgroundColor: hexToRgba(colors.accent, 0.1) }]}>
            <Text style={[styles.contextText, { color: colors.accent }]} numberOfLines={1}>{weather} · {location || '当前位置'}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      <Pressable onPress={() => onOpenDetail(featured)} style={styles.featureHit}>
        <RecommendationCard recommendation={featured} theme={theme} activitySource={source} />
      </Pressable>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>个性化推荐</Text>
            <Text style={[styles.sectionSub, { color: colors.subtext }]}>{sourceLabel} · 点开看完整安排</Text>
          </View>
          <Pressable onPress={onRefresh}>
            <Text style={[styles.sectionAction, { color: colors.accent }]}>刷新</Text>
          </Pressable>
        </View>
        {recommendations.slice(0, 3).map((item) => (
          <Pressable
            key={item.activity_id}
            style={[styles.compactCard, { borderColor: hexToRgba(colors.accent, 0.12), backgroundColor: hexToRgba(colors.accent, 0.05) }]}
            onPress={() => onOpenDetail(item)}
          >
            <View style={styles.compactCopy}>
              <Text style={[styles.compactTitle, { color: colors.text }]} numberOfLines={1}>
                {item.specific_info?.name || item.activity_name}
              </Text>
              <Text style={[styles.compactMeta, { color: colors.subtext }]} numberOfLines={1}>
                {[item.specific_info?.location || item.specific_info?.platform, item.specific_info?.duration, item.specific_info?.price || item.budget].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Text style={[styles.compactArrow, { color: colors.accent }]}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>今日灵感卡片</Text>
            <Text style={[styles.sectionSub, { color: colors.subtext }]}>不想思考时，直接点一个方向</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideaList}>
          {HOME_IDEAS.map((idea) => (
            <Pressable
              key={idea.key}
              style={[styles.ideaCard, { borderColor: hexToRgba(colors.accent, 0.12) }]}
              onPress={() => onPrompt(idea.prompt)}
            >
              <ImageBackground source={idea.image} resizeMode="cover" imageStyle={styles.ideaImage} style={styles.ideaVisual} />
              <View style={styles.ideaCopy}>
                <Text style={[styles.ideaTitle, { color: colors.text }]} numberOfLines={1}>{idea.title}</Text>
                <Text style={[styles.ideaSub, { color: colors.subtext }]} numberOfLines={1}>{idea.subtitle}</Text>
                <Text style={[styles.ideaTag, { color: colors.accent }]}>{idea.tag}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 112,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  wordmark: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  brandSub: {
    fontSize: 14,
    marginTop: 2,
  },
  refreshBtn: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '900',
  },
  heroCard: {
    minHeight: 202,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroImage: {
    borderRadius: 28,
  },
  heroOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  styleName: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 13,
  },
  heroTitle: {
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '900',
  },
  heroSub: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  contextPill: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 18,
    maxWidth: '80%',
  },
  contextText: {
    fontSize: 14,
    fontWeight: '900',
  },
  featureHit: {
    marginBottom: 16,
  },
  section: {
    borderRadius: 26,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '900',
  },
  compactCard: {
    minHeight: 72,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  compactCopy: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  compactMeta: {
    fontSize: 13,
    marginTop: 6,
  },
  compactArrow: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 10,
  },
  ideaList: {
    gap: 11,
  },
  ideaCard: {
    width: 154,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ideaVisual: {
    height: 92,
  },
  ideaImage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  ideaCopy: {
    padding: 10,
  },
  ideaTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  ideaSub: {
    fontSize: 12,
    marginTop: 5,
  },
  ideaTag: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 9,
  },
});
