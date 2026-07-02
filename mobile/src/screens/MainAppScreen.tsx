/**
 * 主 App：推荐 / 方案 / 收藏 / 我的 + 中央推荐按钮。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { chat, getWeather, recommend, recordActivityEvent, submitFeedback, triggerRecommendation, updateProfile } from '@/services/api';
import { ActivitySourceMeta, ChatMessage, MBTIType, Recommendation, UserPreferences } from '@/types';
import { ActivityDetailSheet } from '@/components/ActivityDetailSheet';
import { ChatPanel } from '@/components/ChatPanel';
import { DailyIntent, DailyIntentView } from '@/components/DailyIntentView';
import { ExploreView } from '@/components/ExploreView';
import { FavoritesView } from '@/components/FavoritesView';
import { PreferenceEditorSheet } from '@/components/PreferenceEditorSheet';
import { ProfileView } from '@/components/ProfileView';
import { RecommendView } from '@/components/RecommendView';
import { hexToRgba, softShadow, UI } from '@/styles/ui';

const DEFAULT_RECOMMENDATION: Recommendation = {
  activity_id: 'local_documentary_evening',
  activity_name: '今晚看一部 90 分钟纪录片',
  recommend_text: '现在不用出门。打开 B 站搜索《人生果实》或同类生活纪录片，泡一杯热饮，给自己留一段完整的安静时间。',
  tips: '建议 20:30 后开始，先把手机通知关掉。只准备一杯喝的和一个舒服的位置，降低启动门槛。',
  safety_note: '',
  action_url: 'https://search.bilibili.com/all?keyword=%E4%BA%BA%E7%94%9F%E6%9E%9C%E5%AE%9E',
  action_label: '打开 B站搜索',
  category: '居家休闲',
  budget: '低预算',
  specific_info: {
    name: '《人生果实》同类生活纪录片',
    location: 'B站 / 家里',
    duration: '约 90 分钟',
    price: '低预算',
    rating: '本地灵感',
    source: 'local_fallback',
  },
};

const TABS = [
  { key: 'recommend', label: '首页', icon: '⌁' },
  { key: 'explore', label: '方案', icon: '⌖' },
  { key: 'create', label: '推荐', icon: '荐' },
  { key: 'favorites', label: '收藏', icon: '♡' },
  { key: 'profile', label: '我的', icon: '◌' },
] as const;

type TabKey = typeof TABS[number]['key'];

const FAVORITES_KEY_PREFIX = 'onedayreco_favorites';
const LOCATION_KEY = 'onedayreco_last_location';

function favoritesKey(userId: string) {
  return `${FAVORITES_KEY_PREFIX}:${userId || 'guest'}`;
}

function recommendationNoticeText(agentSource?: 'llm' | 'fallback', activitySource?: ActivitySourceMeta) {
  if (agentSource === 'llm') {
    return activitySource?.is_realtime ? 'AI 已结合实时数据生成推荐' : 'AI 已生成推荐，地点数据为精选兜底';
  }
  if (activitySource?.is_realtime) return '已根据实时数据更新推荐';
  return '当前使用本地灵感，实时地点稍后刷新';
}

function parseFavorites(raw: string | null): Recommendation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.activity_id === 'string' && typeof item.activity_name === 'string');
  } catch {
    return [];
  }
}

export function MainAppScreen() {
  const {
    mbti,
    currentTheme,
    messages,
    isLoading,
    addMessage,
    setLoading,
    setPreferences,
    getUserProfile,
    addActivityFeedback,
    setFeedbackSummary,
    userId,
    email,
    hasSkippedAuth,
    preferences,
    feedbackSummary,
    logout,
    redoOnboarding,
    authToken,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabKey>('recommend');
  const [intentReady, setIntentReady] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<DailyIntent | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [isChatSending, setChatSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState('天气获取中');
  const [isResolvingContext, setResolvingContext] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([DEFAULT_RECOMMENDATION]);
  const [source, setSource] = useState<ActivitySourceMeta | undefined>(undefined);
  const [detail, setDetail] = useState<Recommendation | null>(null);
  const [favorites, setFavorites] = useState<Recommendation[]>([]);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [preferenceVisible, setPreferenceVisible] = useState(false);
  const [activeExploreFilter, setActiveExploreFilter] = useState<string | null>(null);
  const [recommendationNotice, setRecommendationNotice] = useState('当前使用本地灵感，实时地点稍后刷新');
  const [feedbackNotice, setFeedbackNotice] = useState('');
  const favoritesHydrated = useRef(false);
  const locationHydrated = useRef(false);
  const theme = currentTheme;
  const colors = theme.colors;
  const activeMbti = (mbti || 'INTP') as MBTIType;
  const featured = recommendations[0] || DEFAULT_RECOMMENDATION;
  const sourceLabel = source?.is_realtime ? '实时候选' : '精选兜底';

  const context = useMemo(() => ({
    weather,
    location,
    mode: '个人',
    mode_note: currentIntent?.prompt || '按当前地点、天气和你的偏好推荐',
  }), [currentIntent?.prompt, location, weather]);

  const displayMessages = useMemo<ChatMessage[]>(() => {
    if (messages.length) return messages;
    return [];
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(LOCATION_KEY).then((value) => {
      if (!cancelled && value && value !== '上海 徐汇') setLocation(value);
    }).finally(() => {
      if (!cancelled) locationHydrated.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!locationHydrated.current) return;
    void AsyncStorage.setItem(LOCATION_KEY, location).catch(() => undefined);
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    favoritesHydrated.current = false;
    AsyncStorage.getItem(favoritesKey(userId)).then((raw) => {
      if (cancelled) return;
      setFavorites(parseFavorites(raw));
      favoritesHydrated.current = true;
    }).catch(() => {
      if (!cancelled) {
        setFavorites([]);
        favoritesHydrated.current = true;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!favoritesHydrated.current) return;
    void AsyncStorage.setItem(favoritesKey(userId), JSON.stringify(favorites)).catch(() => undefined);
  }, [favorites, userId]);

  useEffect(() => {
    if (!intentReady) return;
    let ignore = false;
    const resolveContextAndRecommend = async () => {
      setResolvingContext(true);
      try {
        const currentLocation = location.trim();
        if (!currentLocation) {
          const nextWeather = '未设置位置';
          if (!ignore) {
            setWeather(nextWeather);
            void refreshRecommendation(false, {
              ...context,
              location: '',
              weather: nextWeather,
            });
          }
          return;
        }
        const weatherResult = await getWeather(location);
        const nextWeather = weatherResult.display || weatherResult.weather || '天气未获取';
        if (!ignore) {
          setWeather(nextWeather);
          void refreshRecommendation(false, {
            ...context,
            location,
            weather: nextWeather,
          });
        }
      } finally {
        if (!ignore) {
          setResolvingContext(false);
        }
      }
    };
    void resolveContextAndRecommend();
    return () => {
      ignore = true;
    };
  }, [intentReady, currentIntent?.key]);

  const refreshRecommendation = async (appendMessage = true, contextOverride?: typeof context) => {
    if (isLoading) return;
    const requestContext = contextOverride || context;
    setRecommendationNotice('');
    setLoading(true);
    try {
      const res = await recommend(getUserProfile(), requestContext);
      if (res.recommendations?.length) {
        setRecommendations(res.recommendations);
        setSource(res.activity_source);
        setHistoryRefreshKey((value) => value + 1);
        setRecommendationNotice(recommendationNoticeText(res.agent_source, res.activity_source));
      }
      if (appendMessage && chatVisible) {
        addMessage({
          role: 'assistant',
          content: res.agent_message || '我换了一批更贴合当前状态的推荐。',
          recommendations: res.recommendations,
          timestamp: Date.now(),
        });
      }
    } catch {
      setRecommendationNotice('当前使用本地灵感，实时地点稍后刷新');
      if (appendMessage && chatVisible) {
        addMessage({
          role: 'assistant',
          content: '我先用本地灵感陪你想一个能开始的小计划。实时地点恢复后，我再把路线和场次补上。',
          timestamp: Date.now(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text || inputText).trim();
    if (!content || isChatSending) return;
    setChatVisible(true);
    addMessage({ role: 'user', content, timestamp: Date.now() });
    setInputText('');
    Keyboard.dismiss();
    setChatSending(true);
    try {
      const res = await chat(
        getUserProfile(),
        content,
        context,
        messages.slice(-8).map((item) => ({ role: item.role, content: item.content })),
      );
      if (res.recommendations?.length) {
        setRecommendations(res.recommendations);
        setSource(res.activity_source);
        setHistoryRefreshKey((value) => value + 1);
        setRecommendationNotice(recommendationNoticeText(res.reply_source === 'llm' ? 'llm' : 'fallback', res.activity_source));
      }
      addMessage({
        role: 'assistant',
        content: res.reply,
        reply_source: res.reply_source,
        recommendations: res.recommendations,
        timestamp: Date.now(),
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: '我这边暂时没连上实时聊天。先把你的状态记下来了，你也可以点“发现”看一批本地灵感。',
        reply_source: 'fallback',
        recommendations: [featured],
        timestamp: Date.now(),
      });
    } finally {
      setChatSending(false);
    }
  };

  const handleFeedback = async (feedback: 'liked' | 'completed' | 'skipped') => {
    const target = detail || featured;
    addActivityFeedback(target.activity_name, feedback);
    if (feedback === 'liked') {
      setFavorites((current) => current.some((item) => item.activity_id === target.activity_id) ? current : [target, ...current]);
    }
    void recordActivityEvent({
      userId,
      activityId: target.activity_id,
      activityName: target.activity_name,
      eventType: feedback,
      source: 'main_app',
      metadata: {
        specific_name: target.specific_info?.name,
        category: target.category,
      },
    }).catch(() => undefined);
    const result = await submitFeedback(userId, target.activity_id, feedback, target.activity_name);
    if (result.feedback_summary) setFeedbackSummary(result.feedback_summary);
    setHistoryRefreshKey((value) => value + 1);
    setFeedbackNotice({
      liked: '已收藏。之后会多给类似但不重复的选择。',
      completed: '已记录完成。下次会按这个节奏推荐。',
      skipped: '已跳过。我会换一个更轻的方向。',
    }[feedback]);
    setDetail(null);
    if (feedback === 'skipped') {
      void refreshRecommendation(true);
    }
  };

  const handleRecordAction = (recommendation: Recommendation) => {
    void recordActivityEvent({
      userId,
      activityId: recommendation.activity_id,
      activityName: recommendation.activity_name,
      eventType: 'click',
      source: 'activity_detail',
      metadata: {
        action_url: recommendation.action_url,
        action_label: recommendation.action_label,
        specific_name: recommendation.specific_info?.name,
      },
    }).catch(() => undefined);
  };

  const handleScreenBreak = async (trigger: {
    appName: string;
    appCategory: string;
    usageMinutes: number;
    continuousMinutes: number;
  }) => {
    if (isLoading) return;
    setLoading(true);
    try {
      const res = await triggerRecommendation(
        getUserProfile(),
        {
          app_name: trigger.appName,
          app_category: trigger.appCategory,
          usage_minutes: trigger.usageMinutes,
          continuous_minutes: trigger.continuousMinutes,
        },
        context,
      );
      if (res.recommendations?.length) {
        setRecommendations(res.recommendations);
        setSource(res.activity_source);
        setHistoryRefreshKey((value) => value + 1);
      }
      addMessage({
        role: 'assistant',
        content: res.agent_message || '我按你的屏幕使用状态，换了一个更适合离屏的小计划。',
        recommendations: res.recommendations,
        timestamp: Date.now(),
      });
      setChatVisible(true);
    } catch {
      addMessage({
        role: 'assistant',
        content: '离屏推荐服务暂时不可用。我先建议你换到窗边或楼下走 10 分钟，等服务恢复后再给你具体地点。',
        timestamp: Date.now(),
      });
      setChatVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = (nextPreferences: UserPreferences) => {
    setPreferences(nextPreferences);
    if (authToken) {
      void updateProfile(authToken, {
        mbti: activeMbti,
        preferences: nextPreferences,
        feedback_summary: feedbackSummary,
      }).catch(() => undefined);
    }
    void refreshRecommendation(true);
  };

  const handleExploreFilter = (label: string | null, prompt: string) => {
    setActiveExploreFilter(label);
    void refreshRecommendation(false, {
      ...context,
      mode_note: prompt,
    });
  };

  const handleHomeIdea = (prompt: string) => {
    setActiveTab('explore');
    handleExploreFilter(null, prompt);
  };

  const openChat = () => setChatVisible(true);

  const handleIntentSelect = (intent: DailyIntent) => {
    setCurrentIntent(intent);
    setIntentReady(true);
  };

  const renderContent = () => {
    if (activeTab === 'recommend') {
      return (
        <RecommendView
          theme={theme}
          mbti={activeMbti}
          recommendations={recommendations}
          isLoading={isLoading}
          onRefresh={() => void refreshRecommendation(true)}
          onOpenDetail={setDetail}
          onPrompt={handleHomeIdea}
          onChat={openChat}
        />
      );
    }
    if (activeTab === 'explore') {
      return (
        <ExploreView
          theme={theme}
          recommendations={recommendations}
          source={source}
          isLoading={isLoading}
          notice={feedbackNotice || recommendationNotice}
          activeFilter={activeExploreFilter}
          onRefresh={() => {
            setActiveExploreFilter(null);
            void refreshRecommendation(true);
          }}
          onOpenDetail={setDetail}
          onPrompt={handleExploreFilter}
        />
      );
    }
    if (activeTab === 'favorites') {
      return (
        <FavoritesView
          theme={theme}
          favorites={favorites}
          onOpenDetail={setDetail}
          onExplore={() => setActiveTab('explore')}
        />
      );
    }
    if (activeTab === 'profile') {
      return (
        <ProfileView
          theme={theme}
          mbti={mbti}
          email={email}
          hasSkippedAuth={hasSkippedAuth}
          userId={userId}
          preferences={preferences}
          feedbackSummary={feedbackSummary}
          favorites={favorites.map((item) => item.activity_id)}
          refreshKey={historyRefreshKey}
          onEditPreferences={() => setPreferenceVisible(true)}
          onRedoOnboarding={redoOnboarding}
          onLogout={logout}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {!intentReady ? (
        <DailyIntentView
          theme={theme}
          mbti={activeMbti}
          location={location}
          isResolvingContext={isResolvingContext}
          onLocationChange={setLocation}
          onSelect={handleIntentSelect}
          onSkip={() => {
            setCurrentIntent(null);
            setIntentReady(true);
          }}
          onChat={openChat}
        />
      ) : (
        <>
          <View style={styles.shell}>
            {renderContent()}
          </View>

          <View style={[styles.navWrap, { backgroundColor: hexToRgba(colors.bg, 0.94) }]}>
            <View style={[styles.nav, { backgroundColor: colors.card }, softShadow(colors.accent, 0.08)]}>
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    style={styles.navItem}
                    onPress={() => {
                      if (tab.key === 'create') {
                        setActiveTab('explore');
                        void refreshRecommendation(false);
                        return;
                      }
                      setActiveTab(tab.key);
                    }}
                  >
                    <View style={tab.key === 'create' ? [styles.createBtn, { backgroundColor: colors.accent }] : undefined}>
                      <Text style={[
                        tab.key === 'create' ? styles.createIcon : styles.navIcon,
                        { color: tab.key === 'create' ? '#fff' : active ? colors.accent : colors.subtext },
                      ]}>{tab.icon}</Text>
                    </View>
                    <Text style={[styles.navText, { color: active ? colors.accent : colors.subtext }]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}

      <ChatPanel
        visible={chatVisible}
        theme={theme}
        messages={displayMessages}
        inputText={inputText}
        isLoading={isChatSending}
        onClose={() => setChatVisible(false)}
        onInputChange={setInputText}
        onSend={() => void handleSend()}
        onPrompt={(prompt) => void handleSend(prompt)}
        onOpenRecommendation={(recommendation) => {
          setChatVisible(false);
          setDetail(recommendation);
        }}
      />

      <ActivityDetailSheet
        visible={Boolean(detail)}
        recommendation={detail}
        theme={theme}
        sourceLabel={sourceLabel}
        onClose={() => setDetail(null)}
        onFeedback={handleFeedback}
        onRecordAction={handleRecordAction}
      />
      <PreferenceEditorSheet
        visible={preferenceVisible}
        theme={theme}
        preferences={preferences}
        onClose={() => setPreferenceVisible(false)}
        onSave={handleSavePreferences}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  navWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: UI.space.pageX,
    paddingTop: 10,
    paddingBottom: 16,
  },
  nav: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    minHeight: 64,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  createIcon: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  navIcon: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
  },
  navText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
