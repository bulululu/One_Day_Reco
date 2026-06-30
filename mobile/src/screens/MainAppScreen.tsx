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

const DEFAULT_RECOMMENDATION: Recommendation = {
  activity_id: 'slow_evening',
  activity_name: '给今晚留一段慢下来的小时间',
  recommend_text: '不用把今天安排得很满。泡一杯热饮，挑一部轻松的纪录片，或者把一直没翻开的书读两章，让自己从屏幕里退出来一会儿。',
  tips: '建议先把手机放到看不见的地方。只准备一杯喝的和一个舒服的位置，启动门槛越低越好。',
  safety_note: '',
  action_url: 'https://www.bilibili.com',
  action_label: '开始安排',
  category: '居家休闲',
  budget: '低预算',
  specific_info: {
    name: '慢夜纪录片',
    location: '家里',
    duration: '约 90 分钟',
    price: '低预算',
    rating: '',
    source: '本地兜底',
  },
};

const TABS = [
  { key: 'recommend', label: '推荐', icon: '⌁' },
  { key: 'companion', label: '陪伴', icon: '◌' },
  { key: 'chat', label: '聊天', icon: '✦' },
  { key: 'profile', label: '我的', icon: '♡' },
] as const;

type TabKey = typeof TABS[number]['key'];

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${opacity})`;
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
  const [inputText, setInputText] = useState('');
  const [location] = useState('上海 · 徐汇区');
  const [weather] = useState('晴');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([DEFAULT_RECOMMENDATION]);
  const [source, setSource] = useState<ActivitySourceMeta | undefined>(undefined);
  const [detail, setDetail] = useState<Recommendation | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [preferenceVisible, setPreferenceVisible] = useState(false);
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
    return [{
      role: 'assistant',
      content: '今天想做点什么？你可以直接说状态，我会尽量给到具体地点、时长、价格和下一步。',
      timestamp: Date.now(),
    }];
  }, [messages]);

  useEffect(() => {
    if (!messages.length) {
      addMessage({
        role: 'assistant',
        content: '我会先给你一组现在能执行的推荐。不喜欢就点换一个，或者直接告诉我你的状态。',
        timestamp: Date.now(),
      });
    }
  }, []);

  useEffect(() => {
    void refreshRecommendation(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(timer);
  }, [messages.length, isLoading]);

  const refreshRecommendation = async (appendMessage = true) => {
    if (isLoading) return;
    setLoading(true);
    try {
      const res = await recommend(getUserProfile(), context);
      if (res.recommendations?.length) {
        setRecommendations(res.recommendations);
        setSource(res.activity_source);
        setHistoryRefreshKey((value) => value + 1);
      }
      if (appendMessage) {
        addMessage({
          role: 'assistant',
          content: res.agent_message || '我换了一批更贴合当前状态的推荐。',
          recommendations: res.recommendations,
          timestamp: Date.now(),
        });
      }
    } catch {
      if (appendMessage) {
        addMessage({
          role: 'assistant',
          content: '推荐服务暂时没有连上。我会保留本地兜底推荐，并明确标记来源，不伪造实时地点或场次。',
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
        <View style={[styles.nav, { backgroundColor: colors.card, shadowColor: colors.accent }]}>
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
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
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
    fontSize: 23,
    fontWeight: '900',
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
    fontWeight: '700',
  },
  messageCard: {
    width: '100%',
    marginTop: 10,
  },
  inputBar: {
    marginHorizontal: 16,
    marginBottom: 106,
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
  },
  nav: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    minHeight: 70,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  navItem: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
