/**
 * 主界面
 * 打开即推荐：主行动卡 + 备选灵感 + 轻聊天。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  ImageBackground,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { MBTI_PERSONAS } from '@/data/personas';
import { getLifestyleHero, getLifestyleProfile, HOME_ASSETS, HOME_IDEAS } from '@/data/lifestyleDesign';
import { chat, getWeather, recommend, recordActivityEvent, submitFeedback, triggerRecommendation } from '@/services/api';
import { ActivitySourceMeta, ChatMessage, Recommendation } from '@/types';
import { BreathingLoader } from '@/components/BreathingLoader';
import { ActivityInspirationPanel } from '@/components/ActivityInspirationPanel';
import { ContextEditor } from '@/components/ContextEditor';
import { LearningMemoryPanel } from '@/components/LearningMemoryPanel';
import { ProfilePanel } from '@/components/ProfilePanel';
import { ScreenBreakPanel } from '@/components/ScreenBreakPanel';

const DEFAULT_RECOMMENDATION: Recommendation = {
  activity_id: 'slow_evening',
  activity_name: '给今晚留一段慢下来的小时间',
  recommend_text: '不用把今天安排得很满。泡一杯热饮，挑一部轻松的纪录片，或者把一直没翻开的书读两章，让自己从屏幕里退出来一会儿。',
  tips: '建议 20:30 开始，先把手机放到看不见的地方。只准备一杯喝的和一个舒服的位置，启动门槛越低越好。',
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
    source: '今日小计划',
  },
};

const MODES = [
  {
    key: 'personal',
    label: '个人',
    title: '为你安排',
    subtitle: '按你现在的状态推荐',
    prompt: '按个人模式推荐一个现在能做的活动',
  },
  {
    key: 'couple',
    label: '情侣',
    title: '两个人的计划',
    subtitle: '后续会加入约会和纪念日场景',
    prompt: '按情侣模式推荐一个轻松约会活动',
  },
  {
    key: 'friends',
    label: '朋友',
    title: '一起出去玩',
    subtitle: '后续会加入多人偏好协调',
    prompt: '按朋友模式推荐一个多人活动',
  },
  {
    key: 'family',
    label: '家庭',
    title: '家人一起做',
    subtitle: '后续会加入家庭成员和日程',
    prompt: '按家庭模式推荐一个温和活动',
  },
] as const;

type ModeKey = typeof MODES[number]['key'];
type RecoMode = typeof MODES[number];

const WEATHER_OPTIONS = ['晴', '阴', '小雨', '大风', '热', '冷', '适合室内'] as const;

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

export function ChatScreen() {
  const {
    mbti,
    currentTheme,
    messages,
    isLoading,
    addMessage,
    setLoading,
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
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [featured, setFeatured] = useState<Recommendation>(DEFAULT_RECOMMENDATION);
  const [featuredSource, setFeaturedSource] = useState<ActivitySourceMeta | undefined>(undefined);
  const [mode, setMode] = useState<ModeKey>('personal');
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [location, setLocation] = useState('上海 · 徐汇区');
  const [weather, setWeather] = useState('晴');
  const [isWeatherLoading, setWeatherLoading] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [profileVisible, setProfileVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const shouldAutoScrollRef = useRef(false);
  const persona = mbti ? MBTI_PERSONAS[mbti] : MBTI_PERSONAS.INTP;
  const colors = currentTheme.colors;
  const activeMode = MODES.find((item) => item.key === mode) || MODES[0];
  const lifestyle = getLifestyleProfile(mbti || 'INTP');
  const lifestyleHero = getLifestyleHero(mbti || 'INTP');
  const todayLabel = useMemo(() => {
    const now = new Date();
    return `${now.getMonth() + 1}.${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const buildContext = (targetMode: RecoMode = activeMode) => ({
    weather,
    location: location.trim() || '当前位置',
    mode: targetMode.label,
    mode_note: targetMode.subtitle,
  });

  const displayMessages = useMemo<ChatMessage[]>(() => {
    if (messages.length > 0) return messages.slice(-2);
    return [
      {
        role: 'assistant',
        content: '今天想做点什么呢？我猜你可能需要放松一下，或者找点灵感。',
        timestamp: Date.now(),
      },
    ];
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: '我先帮你看一个现在能直接开始的小计划。你不喜欢的话，直接说换一个就行。',
        timestamp: Date.now(),
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRecommendation = async () => {
      setLoading(true);
      try {
        const res = await recommend(getUserProfile(), buildContext(MODES[0]));
        if (cancelled) return;
        if (res.recommendations?.[0]) {
          setFeatured(res.recommendations[0]);
          setFeaturedSource(res.activity_source);
          setHistoryRefreshKey((value) => value + 1);
        }
        if (messages.length <= 1 && res.agent_message) {
          addMessage({
            role: 'assistant',
            content: res.agent_message,
            recommendations: res.recommendations,
            timestamp: Date.now(),
          });
        }
      } catch {
        if (!cancelled) {
          addMessage({
            role: 'assistant',
            content: '推荐服务暂时没有连上。我不会用假地点或假场次糊弄你，等服务恢复后再给你具体安排。',
            timestamp: Date.now(),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadRecommendation();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
      shouldAutoScrollRef.current = false;
    }, 120);
    return () => clearTimeout(timer);
  }, [messages.length, isLoading]);

  const refreshRecommendation = async (targetMode: RecoMode = activeMode) => {
    if (isLoading) return;
    setLoading(true);
    try {
      const res = await recommend(getUserProfile(), buildContext(targetMode));
      if (res.recommendations?.[0]) {
        setFeatured(res.recommendations[0]);
        setFeaturedSource(res.activity_source);
        setHistoryRefreshKey((value) => value + 1);
      }
      addMessage({
        role: 'assistant',
        content: res.agent_message || `我按「${location || '当前位置'} · ${weather}」重新安排了一张推荐卡。`,
        recommendations: res.recommendations,
        timestamp: Date.now(),
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: '当前情况我先记下了，但刚才没连上推荐服务。你可以继续聊天，我会按这个地点和天气来想。',
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchWeather = async () => {
    if (isWeatherLoading) return;
    setWeatherLoading(true);
    try {
      const result = await getWeather(location || '上海');
      const nextLocation = result.location || location;
      const nextWeather = result.display || result.weather;
      setLocation(nextLocation);
      setWeather(nextWeather);
      setLoading(true);
      const res = await recommend(getUserProfile(), {
        weather: nextWeather,
        location: nextLocation || '当前位置',
        mode: activeMode.label,
        mode_note: activeMode.subtitle,
      });
      if (res.recommendations?.[0]) {
        setFeatured(res.recommendations[0]);
        setFeaturedSource(res.activity_source);
        setHistoryRefreshKey((value) => value + 1);
      }
      addMessage({
        role: 'assistant',
        content: res.agent_message || `我按「${nextLocation || '当前位置'} · ${nextWeather}」重新安排了一张推荐卡。`,
        recommendations: res.recommendations,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
      setWeatherLoading(false);
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text || inputText).trim();
    if (!content || isLoading) return;

    shouldAutoScrollRef.current = true;
    addMessage({
      role: 'user',
      content,
      timestamp: Date.now(),
    });
    setInputText('');
    Keyboard.dismiss();
    setLoading(true);

    try {
      const profile = getUserProfile();
      const history = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await chat(profile, content, buildContext(), history);
      if (res.recommendations?.[0]) {
        setFeatured(res.recommendations[0]);
        setFeaturedSource(res.activity_source);
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
        content: '我刚才没连上，不过可以先试试这张推荐卡。想换方向就直接告诉我。',
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (feedback: 'liked' | 'completed' | 'skipped') => {
    shouldAutoScrollRef.current = true;
    setFeedbackStatus('');
    addActivityFeedback(featured.activity_name, feedback);
    void recordActivityEvent({
      userId,
      activityId: featured.activity_id,
      activityName: featured.activity_name,
      eventType: feedback,
      source: 'feedback',
      metadata: {
        category: featured.category,
        specific_name: featured.specific_info?.name,
      },
    }).catch(() => undefined);
    const saved = await submitFeedback(userId, featured.activity_id, feedback, featured.activity_name);
    if (saved.feedback_summary) {
      setFeedbackSummary(saved.feedback_summary);
    }
    const feedbackText = {
      liked: '记下了：这个方向你喜欢。之后我会多给类似但不重复的选择。',
      completed: '完成了，真不错。我先记下这个活动，下次会按这个节奏推荐。',
      skipped: '好，那这个先跳过。我换一个更合适的方向。',
    }[feedback];
    setFeedbackStatus(feedbackText);
    setHistoryRefreshKey((value) => value + 1);
    addMessage({
      role: 'assistant',
      content: feedbackText,
      timestamp: Date.now(),
    });
    if (feedback === 'skipped') {
      handleSend('换一个推荐');
    }
  };

  const handleRecommendationAction = (recommendation: Recommendation) => {
    void recordActivityEvent({
      userId,
      activityId: recommendation.activity_id,
      activityName: recommendation.activity_name,
      eventType: 'click',
      source: 'recommendation_card',
      metadata: {
        action_label: recommendation.action_label,
        action_url: recommendation.action_url,
        specific_name: recommendation.specific_info?.name,
      },
    }).catch(() => undefined);
  };

  const handleStartPlan = () => {
    handleRecommendationAction(featured);
    if (featured.action_url) {
      void Linking.openURL(featured.action_url).catch(() => undefined);
    } else {
      void handleSend('把这个计划展开成具体步骤');
    }
  };

  const handleScreenBreakTrigger = async (trigger: {
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
        buildContext(),
      );
      if (res.recommendations?.[0]) {
        setFeatured(res.recommendations[0]);
        setFeaturedSource(res.activity_source);
        setHistoryRefreshKey((value) => value + 1);
      }
      addMessage({
        role: 'assistant',
        content: res.agent_message || '我按你刚才的屏幕使用状态，换了一个更适合离屏的小计划。',
        recommendations: res.recommendations,
        timestamp: Date.now(),
      });
      void recordActivityEvent({
        userId,
        activityId: res.recommendations?.[0]?.activity_id || 'screen_break',
        activityName: res.recommendations?.[0]?.activity_name || '离屏替代推荐',
        eventType: 'triggered',
        source: 'screen_break_panel',
        metadata: {
          app_name: trigger.appName,
          app_category: trigger.appCategory,
          usage_minutes: trigger.usageMinutes,
          continuous_minutes: trigger.continuousMinutes,
        },
      }).catch(() => undefined);
    } catch {
      addMessage({
        role: 'assistant',
        content: '离屏推荐服务刚才没有连上。我先建议你站起来喝口水，或者到窗边待两分钟，等服务恢复后我再给你具体地点。',
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.brandRow}>
          <View>
            <Text style={[styles.wordmark, { color: colors.accent }]}>OneDayReco</Text>
            <Text style={[styles.brandSub, { color: colors.subtext }]}>每一天，都值得被好好安排。</Text>
          </View>
          <Pressable
            style={[styles.settingsPill, { borderColor: hexToRgba(colors.accent, 0.22) }]}
            onPress={() => setProfileVisible(true)}
          >
            <Text style={[styles.settingsText, { color: colors.accent }]}>我的</Text>
          </Pressable>
        </View>

        <ImageBackground
          source={lifestyleHero}
          resizeMode="cover"
          imageStyle={styles.greetingImage}
          style={[styles.greetingCard, { backgroundColor: colors.card, shadowColor: colors.accent }]}
        >
          <LinearGradient
            colors={[
              hexToRgba(colors.card, 0.88),
              hexToRgba(colors.card, 0.5),
              hexToRgba(colors.card, 0.04),
            ]}
            start={{ x: 0, y: 0.45 }}
            end={{ x: 0.7, y: 0.5 }}
            style={styles.greetingOverlay}
          >
            <View style={styles.greetingCopy}>
              <Text style={[styles.styleLabel, { color: colors.accent }]}>{lifestyle.styleName}</Text>
              <Text style={[styles.greetingTitle, { color: colors.text }]}>早安，{currentTheme.name}</Text>
              <Text style={[styles.greetingSub, { color: colors.text }]}>今天想一起做点什么呢？</Text>
              <Pressable
                style={[styles.contextPill, { backgroundColor: hexToRgba(colors.accent, 0.11) }]}
                onPress={() => setContextExpanded((value) => !value)}
              >
                <Text style={[styles.contextPillText, { color: colors.accent }]} numberOfLines={1}>
                  {weather} · {location || '当前位置'}
                </Text>
              </Pressable>
            </View>
          </LinearGradient>
        </ImageBackground>

        <ContextEditor
          theme={currentTheme}
          location={location}
          weather={weather}
          expanded={contextExpanded}
          isWeatherLoading={isWeatherLoading}
          weatherOptions={WEATHER_OPTIONS}
          onToggle={() => setContextExpanded((value) => !value)}
          onLocationChange={setLocation}
          onWeatherChange={setWeather}
          onRefresh={() => refreshRecommendation()}
          onFetchWeather={handleFetchWeather}
        />

        <ImageBackground
          source={HOME_ASSETS.feature}
          resizeMode="cover"
          imageStyle={styles.featureImage}
          style={[styles.featureCard, { backgroundColor: colors.card, shadowColor: colors.accent }]}
        >
          <LinearGradient
            colors={[
              hexToRgba(colors.card, 0.5),
              hexToRgba(colors.card, 0.18),
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0.45 }}
            end={{ x: 0.75, y: 0.55 }}
            style={styles.featureOverlay}
          >
            <View style={[styles.featurePill, { backgroundColor: hexToRgba(colors.accent, 0.82) }]}>
              <Text style={styles.featurePillText}>
                {featuredSource?.is_realtime ? '实时候选' : '今日灵感'}
              </Text>
            </View>
            <Text style={[styles.featureTitle, { color: colors.text }]}>给自己的温柔时光。</Text>
            <Text style={[styles.featureText, { color: colors.text }]} numberOfLines={2}>
              {featured.recommend_text}
            </Text>
            <Pressable
              style={[styles.featureAction, { backgroundColor: colors.accent }]}
              onPress={handleStartPlan}
            >
              <Text style={styles.featureActionText}>{featured.action_label || '开始今日计划'} →</Text>
            </Pressable>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.feedbackRow}>
          <Pressable
            style={[styles.feedbackBtn, { borderColor: hexToRgba(colors.accent, 0.18) }]}
            onPress={() => handleFeedback('liked')}
          >
            <Text style={[styles.feedbackText, { color: colors.accent }]}>喜欢</Text>
          </Pressable>
          <Pressable
            style={[styles.feedbackBtn, { borderColor: hexToRgba(colors.accent, 0.18) }]}
            onPress={() => handleFeedback('completed')}
          >
            <Text style={[styles.feedbackText, { color: colors.accent }]}>完成</Text>
          </Pressable>
          <Pressable
            style={[styles.feedbackBtn, { borderColor: hexToRgba(colors.accent, 0.18) }]}
            onPress={() => handleFeedback('skipped')}
          >
            <Text style={[styles.feedbackText, { color: colors.accent }]}>换一个</Text>
          </Pressable>
        </View>

        {feedbackStatus ? (
          <Text style={[styles.feedbackStatus, { color: colors.subtext }]}>
            {feedbackStatus}
          </Text>
        ) : null}

        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.accent }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionIcon, { color: colors.accent }]}>⌁</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>今日灵感卡片</Text>
            </View>
            <Pressable onPress={() => refreshRecommendation()}>
              <Text style={[styles.sectionAction, { color: colors.subtext }]}>换一批 ↻</Text>
            </Pressable>
          </View>
          <View style={styles.ideaGrid}>
            {HOME_IDEAS.map((idea) => (
              <Pressable
                key={idea.key}
                style={[styles.ideaCard, { borderColor: hexToRgba(colors.accent, 0.13) }]}
                onPress={() => handleSend(idea.prompt)}
              >
                <ImageBackground
                  source={idea.image}
                  resizeMode="cover"
                  imageStyle={styles.ideaImage}
                  style={styles.ideaImageWrap}
                />
                <View style={styles.ideaCopy}>
                  <Text style={[styles.ideaTitle, { color: colors.text }]} numberOfLines={1}>
                    {idea.title}
                  </Text>
                  <Text style={[styles.ideaSub, { color: colors.subtext }]} numberOfLines={1}>
                    {idea.subtitle}
                  </Text>
                  <View style={styles.ideaMeta}>
                    <Text style={[styles.ideaTag, { color: colors.accent, backgroundColor: hexToRgba(colors.accent, 0.1) }]}>
                      {idea.tag}
                    </Text>
                    <Text style={[styles.ideaDistance, { color: colors.subtext }]}>{idea.distance}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.scheduleCard, { backgroundColor: colors.card, shadowColor: colors.accent }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionIcon, { color: colors.accent }]}>▣</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>今日日程</Text>
          </View>
          <View style={[styles.scheduleItem, { borderColor: hexToRgba(colors.accent, 0.12) }]}>
            <View style={styles.dateBlock}>
              <Text style={[styles.dateWeek, { color: colors.subtext }]}>今天</Text>
              <Text style={[styles.dateText, { color: colors.text }]}>{todayLabel}</Text>
            </View>
            <View style={[styles.checkDot, { backgroundColor: hexToRgba(colors.accent, 0.14) }]}>
              <Text style={[styles.checkText, { color: colors.accent }]}>✓</Text>
            </View>
            <View style={styles.scheduleCopy}>
              <Text style={[styles.scheduleTitle, { color: colors.text }]} numberOfLines={1}>
                {featured.specific_info?.name || featured.activity_name}
              </Text>
              <Text style={[styles.scheduleTime, { color: colors.subtext }]}>
                {featured.specific_info?.duration || '约 90 分钟'} · {featured.specific_info?.price || featured.budget || '按需'}
              </Text>
            </View>
            <Pressable
              style={[styles.donePill, { borderColor: hexToRgba(colors.accent, 0.2) }]}
              onPress={() => handleFeedback('completed')}
            >
              <Text style={[styles.doneText, { color: colors.accent }]}>完成</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.memoryBanner, { backgroundColor: colors.accent }]}>
          <View style={styles.memoryMascot}>
            <Text style={styles.memoryMascotText}>{currentTheme.avatar}</Text>
          </View>
          <View style={styles.memoryCopy}>
            <Text style={styles.memoryTitle}>记录我们的美好瞬间</Text>
            <Text style={styles.memorySub}>珍藏每一个值得回忆的时刻</Text>
          </View>
          <Pressable
            style={styles.memoryButton}
            onPress={() => handleSend('我想记录今天这个计划')}
          >
            <Text style={[styles.memoryButtonText, { color: colors.accent }]}>去记录</Text>
          </Pressable>
        </View>

        <View style={styles.chatArea}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionIcon, { color: colors.accent }]}>◌</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>消息</Text>
            </View>
            <Text style={[styles.sectionAction, { color: colors.subtext }]}>{lifestyle.subtitle}</Text>
          </View>
          {displayMessages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <View key={`${message.timestamp || index}-${index}`} style={styles.messageRow}>
                {!isUser ? (
                <View style={[styles.miniAvatar, { backgroundColor: hexToRgba(colors.accent, 0.14) }]}>
                  <Text style={styles.miniAvatarText}>{currentTheme.avatar}</Text>
                </View>
              ) : null}
                <View
                  style={[
                    styles.bubble,
                    { backgroundColor: colors.card, shadowColor: colors.accent },
                    isUser && { backgroundColor: colors.accent },
                    isUser && styles.userBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      { color: isUser ? '#fff' : colors.text },
                    ]}
                  >
                    {message.content}
                  </Text>
                  <Text style={[styles.bubbleTime, { color: colors.subtext }, isUser && styles.userBubbleTime]}>9:41 AM</Text>
                </View>
              </View>
            );
          })}

          {isLoading ? (
            <View style={styles.loaderWrap}>
              <BreathingLoader theme={currentTheme} />
            </View>
          ) : null}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
            style={styles.inlineComposerWrap}
          >
            <View style={[styles.inputBar, { backgroundColor: colors.card, shadowColor: colors.accent }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={persona.placeholder || '告诉我你的想法吧…'}
                placeholderTextColor={colors.subtext}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              <Pressable
                style={[
                  styles.sendBtn,
                  { backgroundColor: colors.accent },
                  (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
                ]}
                onPress={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
              >
                <Text style={styles.sendText}>➤</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>

        <Pressable
          style={[
            styles.moreToggle,
            {
              borderColor: hexToRgba(colors.accent, 0.16),
              backgroundColor: hexToRgba(colors.accent, 0.06),
            },
          ]}
          onPress={() => setToolsExpanded((value) => !value)}
        >
          <Text style={[styles.moreToggleText, { color: colors.accent }]}>
            {toolsExpanded ? '收起更多选项' : '更多选项'}
          </Text>
        </Pressable>

        {toolsExpanded ? (
          <View style={styles.advancedBlock}>
            <View style={styles.modeBlock}>
              <Text style={[styles.modeTitle, { color: colors.text }]}>模式</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modeList}
              >
                {MODES.map((item) => {
                  const selected = mode === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      style={[
                        styles.modeChip,
                        {
                          backgroundColor: selected ? colors.accent : hexToRgba(colors.accent, 0.08),
                          borderColor: selected ? colors.accent : hexToRgba(colors.accent, 0.18),
                        },
                      ]}
                      onPress={() => {
                        setMode(item.key);
                        setFeedbackStatus('');
                        void refreshRecommendation(item);
                      }}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          { color: selected ? '#fff' : colors.accent },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickList}
            >
              {persona.quickActions.slice(0, 3).map((action) => (
                <Pressable
                  key={action}
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: hexToRgba(colors.accent, 0.08),
                      borderColor: hexToRgba(colors.accent, 0.18),
                    },
                  ]}
                  onPress={() => handleSend(action)}
                >
                  <Text style={[styles.quickText, { color: colors.accent }]}>{action}</Text>
                </Pressable>
              ))}
              {mode !== 'personal' ? (
                <Pressable
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: hexToRgba(colors.accent, 0.12),
                      borderColor: hexToRgba(colors.accent, 0.28),
                    },
                  ]}
                  onPress={() => handleSend(activeMode.prompt)}
                >
                  <Text style={[styles.quickText, { color: colors.accent }]}>
                    {activeMode.label}模式推荐
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>

            <ScreenBreakPanel
              theme={currentTheme}
              isLoading={isLoading}
              onTrigger={handleScreenBreakTrigger}
            />

            <LearningMemoryPanel
              userId={userId}
              theme={currentTheme}
              refreshKey={historyRefreshKey}
              onPrompt={handleSend}
            />

            <ActivityInspirationPanel theme={currentTheme} location={location} onPrompt={handleSend} />
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomNavWrap, { backgroundColor: hexToRgba(colors.bg, 0.92) }]}>
        <View style={[styles.bottomNav, { backgroundColor: colors.card, shadowColor: colors.accent }]}>
          <Pressable style={styles.navItem} onPress={() => refreshRecommendation()}>
            <Text style={[styles.navIcon, { color: colors.accent }]}>⌁</Text>
            <Text style={[styles.navText, { color: colors.subtext }]}>推荐</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => handleSend('把今天的计划整理成日程')}>
            <Text style={[styles.navIcon, { color: colors.accent }]}>▣</Text>
            <Text style={[styles.navText, { color: colors.accent }]}>计划</Text>
          </Pressable>
          <Pressable
            style={[styles.navAdd, { backgroundColor: colors.accent }]}
            onPress={() => handleSend('随便推荐一个现在能做的具体活动')}
          >
            <Text style={styles.navAddText}>＋</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => handleFeedback('liked')}>
            <Text style={[styles.navIcon, { color: colors.subtext }]}>♡</Text>
            <Text style={[styles.navText, { color: colors.subtext }]}>收藏</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => handleSend('我想聊聊今天可以做什么')}>
            <Text style={[styles.navIcon, { color: colors.subtext }]}>◌</Text>
            <Text style={[styles.navText, { color: colors.subtext }]}>消息</Text>
          </Pressable>
        </View>
      </View>

      <ProfilePanel
        visible={profileVisible}
        theme={currentTheme}
        mbti={mbti}
        email={email}
        hasSkippedAuth={hasSkippedAuth}
        userId={userId}
        preferences={preferences}
        feedbackSummary={feedbackSummary}
        onClose={() => setProfileVisible(false)}
        onRedoOnboarding={() => {
          setProfileVisible(false);
          redoOnboarding();
        }}
        onLogout={() => {
          setProfileVisible(false);
          logout();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 132,
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
    letterSpacing: 0,
  },
  brandSub: {
    fontSize: 15,
    marginTop: 3,
  },
  settingsPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  settingsText: {
    fontSize: 15,
    fontWeight: '700',
  },
  greetingCard: {
    height: 170,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  greetingImage: {
    borderRadius: 24,
  },
  greetingOverlay: {
    flex: 1,
    padding: 22,
    justifyContent: 'center',
  },
  greetingCopy: {
    width: '68%',
  },
  styleLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
  },
  greetingTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 8,
  },
  greetingSub: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  },
  contextPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 14,
  },
  contextPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  featureCard: {
    height: 214,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 14,
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  featureImage: {
    borderRadius: 24,
  },
  featureOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  featurePill: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginBottom: 18,
  },
  featurePillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  featureTitle: {
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 8,
    maxWidth: '72%',
  },
  featureText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    maxWidth: '72%',
  },
  featureAction: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  featureActionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
  },
  feedbackBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '800',
  },
  feedbackStatus: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 14,
    marginTop: 22,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 22,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '800',
  },
  ideaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  ideaCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fffaf5',
  },
  ideaImageWrap: {
    height: 92,
  },
  ideaImage: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  ideaCopy: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  ideaTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  ideaSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    fontWeight: '600',
  },
  ideaMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
  },
  ideaTag: {
    maxWidth: 72,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  ideaDistance: {
    fontSize: 12,
    fontWeight: '800',
  },
  scheduleCard: {
    borderRadius: 24,
    padding: 16,
    marginTop: 22,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  scheduleItem: {
    minHeight: 82,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBlock: {
    width: 50,
    alignItems: 'center',
  },
  dateWeek: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  checkDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 24,
    fontWeight: '900',
  },
  scheduleCopy: {
    flex: 1,
    minWidth: 0,
  },
  scheduleTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  scheduleTime: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '700',
  },
  donePill: {
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneText: {
    fontSize: 13,
    fontWeight: '900',
  },
  memoryBanner: {
    minHeight: 72,
    borderRadius: 24,
    marginTop: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  memoryMascot: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryMascotText: {
    fontSize: 27,
  },
  memoryCopy: {
    flex: 1,
    minWidth: 0,
  },
  memoryTitle: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  memorySub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '700',
  },
  memoryButton: {
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  memoryButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  chatArea: {
    marginTop: 22,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  miniAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  miniAvatarText: {
    fontSize: 19,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  userBubble: {
    marginLeft: 'auto',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  bubbleTime: {
    fontSize: 11,
    marginTop: 7,
  },
  userBubbleTime: {
    color: 'rgba(255,255,255,0.75)',
  },
  loaderWrap: {
    marginLeft: 48,
    paddingVertical: 6,
  },
  inlineComposerWrap: {
    marginTop: 4,
  },
  inputBar: {
    width: '100%',
    minHeight: 58,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 18,
    paddingRight: 7,
    paddingVertical: 7,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    minHeight: 40,
    maxHeight: 88,
    paddingVertical: 9,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.55,
  },
  sendText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '800',
  },
  moreToggle: {
    minHeight: 42,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  moreToggleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  advancedBlock: {
    marginTop: 12,
  },
  modeBlock: {
    marginBottom: 14,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  modeList: {
    gap: 9,
    paddingBottom: 2,
  },
  modeChip: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  modeChipText: {
    fontSize: 15,
    fontWeight: '800',
  },
  quickList: {
    gap: 10,
    paddingBottom: 12,
  },
  quickChip: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 17,
    paddingVertical: 11,
  },
  quickText: {
    fontSize: 15,
    fontWeight: '700',
  },
  bottomNavWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  bottomNav: {
    width: '100%',
    maxWidth: 430,
    minHeight: 74,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  navItem: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navIcon: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '900',
  },
  navText: {
    fontSize: 12,
    fontWeight: '800',
  },
  navAdd: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  navAddText: {
    color: '#fff',
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '700',
  },
});
