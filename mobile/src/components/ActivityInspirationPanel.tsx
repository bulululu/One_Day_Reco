import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getActivities, getNearbyMovies, searchContent } from '@/services/api';
import { Activity, ContentItem, MBTITheme, MovieCandidate } from '@/types';

type AltCard = {
  image: ImageSourcePropType;
  title: string;
  sub: string;
  tag: string;
  prompt: string;
};

type ActivityInspirationPanelProps = {
  theme: MBTITheme;
  location: string;
  onPrompt: (prompt: string) => void;
};

const FALLBACK_CARDS: AltCard[] = [
  {
    image: require('../assets/idea-craft.jpeg'),
    title: '向日葵手作',
    sub: '动手做点小东西',
    tag: '创意手工',
    prompt: '推荐一个手作活动',
  },
  {
    image: require('../assets/idea-walk.jpeg'),
    title: '城市绿道慢走',
    sub: '运动一下，抱抱自然',
    tag: '户外放松',
    prompt: '推荐一个户外散步计划',
  },
  {
    image: require('../assets/idea-movie.jpeg'),
    title: '沙发电影夜',
    sub: '窝在沙发里看一部好电影',
    tag: '室内娱乐',
    prompt: '推荐一个电影夜',
  },
];

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

function imageForActivity(activity: Activity): ImageSourcePropType {
  const text = `${activity.category}${activity.subcategory}${activity.name}`;
  if (text.includes('户外') || text.includes('散步') || text.includes('公园') || text.includes('运动')) {
    return require('../assets/idea-walk.jpeg');
  }
  if (text.includes('手工') || text.includes('创意') || text.includes('绘画')) {
    return require('../assets/idea-craft.jpeg');
  }
  return require('../assets/idea-movie.jpeg');
}

function activityToCard(activity: Activity): AltCard {
  const info = activity.specific_info;
  const detail = info?.platform || info?.location || activity.budget || activity.mood_effect || '现在就能开始';
  return {
    image: imageForActivity(activity),
    title: info?.name || activity.name,
    sub: detail,
    tag: activity.subcategory || activity.category,
    prompt: `推荐一个类似「${info?.name || activity.name}」的具体计划`,
  };
}

function movieToCard(movie: MovieCandidate): AltCard {
  const cinema = movie.cinema_candidates?.[0];
  return {
    image: require('../assets/idea-movie.jpeg'),
    title: movie.title,
    sub: cinema?.name || movie.duration || '猫眼确认场次',
    tag: movie.source === 'TMDb' ? '热映电影' : '精选电影',
    prompt: `推荐一个看${movie.title}的具体计划，包含影院和场次确认方式`,
  };
}

function contentToCard(item: ContentItem): AltCard {
  return {
    image: require('../assets/idea-movie.jpeg'),
    title: item.title,
    sub: item.duration || item.rating || 'B站确认',
    tag: item.source === 'Bilibili' ? 'B站内容' : '精选片单',
    prompt: `推荐一个看「${item.title}」的居家计划`,
  };
}

export function ActivityInspirationPanel({ theme, location, onPrompt }: ActivityInspirationPanelProps) {
  const [cards, setCards] = useState<AltCard[]>(FALLBACK_CARDS);
  const [isRealtime, setRealtime] = useState(false);
  const colors = theme.colors;

  useEffect(() => {
    let cancelled = false;
    const loadActivities = async () => {
      try {
        const [activityRes, movieRes, contentRes] = await Promise.allSettled([
          getActivities({ limit: 12 }),
          getNearbyMovies({ location, limit: 3 }),
          searchContent({ q: '纪录片', limit: 3 }),
        ]);
        if (cancelled) return;

        const nextCards: AltCard[] = [];
        let realtime = false;

        if (movieRes.status === 'fulfilled') {
          realtime = realtime || movieRes.value.is_realtime || movieRes.value.cinema_is_realtime;
          nextCards.push(...movieRes.value.movies.slice(0, 2).map(movieToCard));
        }

        if (contentRes.status === 'fulfilled') {
          realtime = realtime || contentRes.value.is_realtime;
          nextCards.push(...contentRes.value.items.slice(0, 2).map(contentToCard));
        }

        if (activityRes.status === 'fulfilled') {
          realtime = realtime || activityRes.value.is_realtime;
          const preferred = activityRes.value.activities
            .filter((activity) => ['游戏', '纪录片', '创意手工', '户外自然', '城市探索'].some((key) => (
              `${activity.category}${activity.subcategory}`.includes(key)
            )))
            .slice(0, 4);
          const source = preferred.length ? preferred : activityRes.value.activities.slice(0, 4);
          nextCards.push(...source.map(activityToCard));
        }

        if (nextCards.length) {
          setRealtime(realtime);
          setCards(nextCards.slice(0, 6));
        }
      } catch {
        if (!cancelled) setCards(FALLBACK_CARDS);
      }
    };
    loadActivities();
    return () => {
      cancelled = true;
    };
  }, [location]);

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.card,
          borderColor: hexToRgba(colors.accent, 0.14),
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>今日灵感卡片</Text>
        <View style={styles.headerRight}>
          <Text
            style={[
              styles.sourceBadge,
              {
                color: colors.accent,
                backgroundColor: hexToRgba(colors.accent, 0.08),
              },
            ]}
          >
            {isRealtime ? '实时' : '精选'}
          </Text>
          <Pressable onPress={() => onPrompt('换一批推荐')}>
            <Text style={[styles.refresh, { color: colors.accent }]}>换一批 ↻</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {cards.map((item) => (
          <Pressable
            key={`${item.title}-${item.tag}`}
            style={[
              styles.card,
              {
                backgroundColor: hexToRgba(colors.accent, 0.07),
                borderColor: hexToRgba(colors.accent, 0.16),
              },
            ]}
            onPress={() => onPrompt(item.prompt)}
          >
            <ImageBackground
              source={item.image}
              resizeMode="cover"
              imageStyle={styles.image}
              style={styles.visual}
            >
              <View style={[styles.tint, { backgroundColor: hexToRgba(colors.accent, 0.08) }]} />
            </ImageBackground>
            <View style={styles.copy}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.tag, { color: colors.accent }]} numberOfLines={1}>{item.tag}</Text>
              <View style={styles.bottom}>
                <Text style={[styles.sub, { color: colors.subtext }]} numberOfLines={1}>{item.sub}</Text>
                <Text style={[styles.arrow, { color: colors.accent }]}>›</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 26,
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sourceBadge: {
    overflow: 'hidden',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  refresh: {
    fontSize: 14,
  },
  list: {
    gap: 10,
  },
  card: {
    width: 142,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  visual: {
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
  copy: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  tag: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  sub: {
    flex: 1,
    fontSize: 12,
  },
  arrow: {
    fontSize: 22,
    lineHeight: 22,
  },
});
