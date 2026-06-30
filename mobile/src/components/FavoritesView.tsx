import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MBTITheme, Recommendation } from '@/types';
import { RecommendationCard } from '@/components/RecommendationCard';
import { hexToRgba, UI } from '@/styles/ui';

type Props = {
  theme: MBTITheme;
  favorites: Recommendation[];
  onOpenDetail: (recommendation: Recommendation) => void;
  onExplore: () => void;
};

export function FavoritesView({ theme, favorites, onOpenDetail, onExplore }: Props) {
  const colors = theme.colors;
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>我的收藏</Text>
      <Text style={[styles.subtitle, { color: colors.subtext }]}>喜欢的活动会留在这里，之后推荐会避开重复。</Text>

      {favorites.length ? (
        <View style={styles.list}>
          {favorites.map((item) => (
            <Pressable key={item.activity_id} onPress={() => onOpenDetail(item)}>
              <RecommendationCard recommendation={item} theme={theme} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>还没有收藏</Text>
          <Text style={[styles.emptySub, { color: colors.subtext }]}>在推荐详情里点“喜欢”，这里会保存你的偏好线索。</Text>
          <Pressable style={[styles.emptyBtn, { backgroundColor: colors.accent }]} onPress={onExplore}>
            <Text style={styles.emptyBtnText}>去发现活动</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: UI.space.pageX,
    paddingTop: 18,
    paddingBottom: 112,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 16,
  },
  list: {
    gap: 14,
  },
  empty: {
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    padding: 20,
    minHeight: 220,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  emptyBtn: {
    minHeight: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
});
