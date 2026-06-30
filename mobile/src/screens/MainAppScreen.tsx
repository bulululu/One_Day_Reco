/**
 * 主 App：推荐 / 陪伴 / 聊天 / 我的。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { MBTI_PERSONAS } from '@/data/personas';
import { chat, recommend, recordActivityEvent, submitFeedback, triggerRecommendation, updateProfile } from '@/services/api';
import { ActivitySourceMeta, ChatMessage, MBTIType, Recommendation, UserPreferences } from '@/types';
import { ActivityDetailSheet } from '@/components/ActivityDetailSheet';
import { BreathingLoader } from '@/components/BreathingLoader';
import { CompanionView } from '@/components/CompanionView';
import { PreferenceEditorSheet } from '@/components/PreferenceEditorSheet';
import { ProfileView } from '@/components/ProfileView';
import { RecommendView } from '@/components/RecommendView';
import { RecommendationCard } from '@/components/RecommendationCard';
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
  { key: 'recommend', label: '推荐', icon: '⌁' },
  { key: 'companion', label: '陪伴', icon: '◌' },
  { key: 'chat', label: '聊天', icon: '✦' },
  { key: 'profile', label: '我的', icon: '♡' },
] as const;

type TabKey = typeof TABS[number]['key'];

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
  const [inputText, setInputText] = useState('');
  const [location] = useState('上海 · 徐汇区');
  const [weather] = useState('晴');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([DEFAULT_RECOMMENDATION]);
  const [source, setSource] = useState<ActivitySourceMeta | undefined>(undefined);
  const [detail, setDetail] = useState<Recommendation | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [preferenceVisible, setPreferenceVisible] = useState(false);
  const [recommendationNotice, setRecommendationNotice] = useState('当前使用本地灵感，实时地点稍后刷新');
  const [feedbackNotice, setFeedbackNotice] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const theme = currentTheme;
  const colors = theme.colors;
  const activeMbti = (mbti || 'INTP') as MBTIType;
  const persona = MBTI_PERSONAS[activeMbti];
  const featured = recommendations[0] || DEFAULT_RECOMMENDATION;
  const sourceLabel = source?.is_realtime ? '实时候选' : '精选兜底';

  const context = useMemo(() => ({
    weather,
    location,
    mode: '个人',
    mode_note: '按当前地点、天气和你的偏好推荐',
  }), [location, weather]);

  const displayMessages = useMemo<ChatMessage[]>(() => {
    if (messages.length) return messages;
    return [];
  }, [messages]);

  useEffect(() => {
    void refreshRecommendation(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(timer);
  }, [messages.length, isLoading]);

  const refreshRecommendation = async (appendMessage = true) => {
    if (isLoading) return;
    setRecommendationNotice('');
    setLoading(true);
    try {
      const res = await recommend(getUserProfile(), context);
      if (res.recommendations?.length) {
        setRecommendations(res.recommendations);
        setSource(res.activity_source);
        setHistoryRefreshKey((value) => value + 1);
        setRecommendationNotice(res.activity_source?.is_realtime ? '已根据实时数据更新推荐' : '当前使用精选灵感，实时地点稍后刷新');
      }
      if (appendMessage && activeTab === 'chat') {
        addMessage({
          role: 'assistant',
          content: res.agent_message || '我换了一批更贴合当前状态的推荐。',
          recommendations: res.recommendations,
          timestamp: Date.now(),
        });
      }
    } catch {
      setRecommendationNotice('当前使用本地灵感，实时地点稍后刷新');
      if (appendMessage && activeTab === 'chat') {
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
    if (!content || isLoading) return;
    setActiveTab('chat');
    addMessage({ role: 'user', content, timestamp: Date.now() });
    setInputText('');
    Keyboard.dismiss();
    setLoading(true);
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
      }
      addMessage({
        role: 'assistant',
        content: res.reply,
        recommendations: res.recommendations,
        timestamp: Date.now(),
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: '我刚才没连上服务。你可以先看推荐页的兜底卡；等服务恢复后我再给具体地点、场次或平台。',
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (feedback: 'liked' | 'completed' | 'skipped') => {
    const target = detail || featured;
    addActivityFeedback(target.activity_name, feedback);
    if (feedback === 'liked') {
      setFavorites((current) => current.includes(target.activity_id) ? current : [target.activity_id, ...current]);
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
      setActiveTab('chat');
    } catch {
      addMessage({
        role: 'assistant',
        content: '离屏推荐服务暂时不可用。我先建议你换到窗边或楼下走 10 分钟，等服务恢复后再给你具体地点。',
        timestamp: Date.now(),
      });
      setActiveTab('chat');
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

  const renderContent = () => {
    if (activeTab === 'recommend') {
      return (
        <RecommendView
          mbti={activeMbti}
          theme={theme}
          featured={featured}
          recommendations={recommendations}
          source={source}
          location={location}
          weather={weather}
          isLoading={isLoading}
          notice={feedbackNotice || recommendationNotice}
          onRefresh={() => void refreshRecommendation(true)}
          onOpenDetail={setDetail}
          onPrompt={handleSend}
        />
      );
    }
    if (activeTab === 'companion') {
      return (
        <CompanionView
          theme={theme}
          location={location}
          isLoading={isLoading}
          onPrompt={handleSend}
          onTrigger={handleScreenBreak}
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
          favorites={favorites}
          refreshKey={historyRefreshKey}
          onEditPreferences={() => setPreferenceVisible(true)}
          onRedoOnboarding={redoOnboarding}
          onLogout={logout}
        />
      );
    }
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={styles.chatWrap}
      >
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatContent}>
          <View style={styles.chatHeader}>
            <View style={[styles.chatAvatar, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
              <Text style={[styles.chatAvatarText, { color: colors.accent }]}>{theme.avatar}</Text>
            </View>
            <View>
              <Text style={[styles.chatTitle, { color: colors.text }]}>{theme.name}</Text>
              <Text style={[styles.chatSub, { color: colors.subtext }]}>{persona.placeholder}</Text>
            </View>
          </View>
          {!displayMessages.length ? (
            <View style={[styles.chatWelcome, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
              <Text style={[styles.chatWelcomeTitle, { color: colors.text }]}>今天想怎么安排？</Text>
              <Text style={[styles.chatWelcomeText, { color: colors.subtext }]}>
                可以直接说“想放松一下”“不想出门”或“随便推荐一个”，我会把它变成具体计划。
              </Text>
              {['想放松一下', '不想出门', '随便推荐一个'].map((item) => (
                <Pressable key={item} style={[styles.chatPrompt, { backgroundColor: hexToRgba(colors.accent, 0.08) }]} onPress={() => void handleSend(item)}>
                  <Text style={[styles.chatPromptText, { color: colors.accent }]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {displayMessages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <View key={`${message.timestamp || index}-${index}`} style={[styles.messageRow, isUser && styles.userRow]}>
                <View
                  style={[
                    styles.bubble,
                    { backgroundColor: isUser ? colors.accent : colors.card, shadowColor: colors.accent },
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: isUser ? '#fff' : colors.text }]}>{message.content}</Text>
                </View>
                {message.recommendations?.slice(0, 2).map((item) => (
                  <Pressable key={item.activity_id} style={styles.messageCard} onPress={() => setDetail(item)}>
                    <RecommendationCard recommendation={item} theme={theme} activitySource={source} />
                  </Pressable>
                ))}
              </View>
            );
          })}
          {isLoading ? <BreathingLoader theme={theme} /> : null}
        </ScrollView>
        <View style={[styles.inputBar, { backgroundColor: colors.card, shadowColor: colors.accent }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={persona.placeholder || '告诉我你的想法吧...'}
            placeholderTextColor={colors.subtext}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: colors.accent }, (!inputText.trim() || isLoading) && styles.disabled]}
            disabled={!inputText.trim() || isLoading}
            onPress={() => void handleSend()}
          >
            <Text style={styles.sendText}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.shell}>
        {renderContent()}
      </View>

      <View style={[styles.navWrap, { backgroundColor: hexToRgba(colors.bg, 0.94) }]}>
        <View style={[styles.nav, { backgroundColor: colors.card }, softShadow(colors.accent, 0.08)]}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable key={tab.key} style={styles.navItem} onPress={() => setActiveTab(tab.key)}>
                <Text style={[styles.navIcon, { color: active ? colors.accent : colors.subtext }]}>{tab.icon}</Text>
                <Text style={[styles.navText, { color: active ? colors.accent : colors.subtext }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
  chatWrap: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: UI.space.pageX,
    paddingTop: 18,
    paddingBottom: 28,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  chatAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: {
    fontSize: 26,
    fontWeight: '900',
  },
  chatTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  chatSub: {
    fontSize: 13,
    marginTop: 4,
    maxWidth: 270,
  },
  messageRow: {
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
  },
  chatWelcome: {
    borderWidth: 1,
    borderRadius: UI.radius.xl,
    padding: 18,
    marginBottom: 18,
  },
  chatWelcomeTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
  },
  chatWelcomeText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 14,
  },
  chatPrompt: {
    minHeight: 42,
    borderRadius: UI.radius.md,
    paddingHorizontal: 13,
    justifyContent: 'center',
    marginTop: 8,
  },
  chatPromptText: {
    fontSize: 14,
    fontWeight: '800',
  },
  messageCard: {
    width: '100%',
    marginTop: 10,
  },
  inputBar: {
    marginHorizontal: UI.space.pageX,
    marginBottom: 98,
    minHeight: 58,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 7,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  input: {
    flex: 1,
    maxHeight: 96,
    fontSize: 15,
    lineHeight: 21,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.48,
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
  navIcon: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 3,
  },
  navText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
