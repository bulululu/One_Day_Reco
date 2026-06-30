/**
 * 全局状态管理（Zustand + AsyncStorage 持久化）
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser, MBTIType, UserProfile, UserPreferences, ChatMessage, MBTITheme } from '@/types';
import { MBTI_THEMES } from '@/data/themes';

// 用户数据存储 key
const USER_KEY = 'onedayreco_user';

// 保存的用户数据结构
interface SavedUser {
  userId?: string;
  email?: string;
  authToken?: string;
  hasSkippedAuth?: boolean;
  mbti: MBTIType;
  preferences: UserPreferences;
  feedbackSummary?: string;
  createdAt: string;
}

// 从 AsyncStorage 同步加载（启动时阻塞读取）
// AsyncStorage 是异步的，所以这里用同步标志 + 延迟初始化
let savedUser: SavedUser | null = null;

// 同步加载函数（在 store 创建前执行）
// AsyncStorage 只有 async API，所以我们用 IIFE 预加载
// store 初始用 null，加载完成后更新
function loadSavedUserSync(): SavedUser | null {
  return savedUser;
}

async function loadSavedUser(): Promise<SavedUser | null> {
  try {
    const json = await AsyncStorage.getItem(USER_KEY);
    if (json) return JSON.parse(json);
  } catch (e) {
    console.error('[Store] 加载用户数据失败:', e);
  }
  return null;
}

async function saveSavedUser(data: SavedUser) {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Store] 保存用户数据失败:', e);
  }
}

async function clearSavedUser() {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('[Store] 清除用户数据失败:', e);
  }
}

// Store 状态接口
interface AppState {
  // 入职引导
  isOnboarding: boolean;
  isReturningUser: boolean;

  // 用户数据
  mbti: MBTIType | null;
  preferences: UserPreferences | null;
  feedbackSummary: string;
  userId: string;
  email: string | null;
  authToken: string | null;
  hasSkippedAuth: boolean;

  // 聊天
  messages: ChatMessage[];
  isLoading: boolean;

  // 主题
  currentTheme: MBTITheme;

  // Actions
  setMBTI: (mbti: MBTIType) => void;
  setPreferences: (prefs: UserPreferences) => void;
  setAuthSession: (token: string, user: AuthUser) => void;
  continueAsGuest: () => void;
  logout: () => void;
  redoOnboarding: () => void;
  completeOnboarding: () => void;
  startAppFromSaved: () => void;
  resetApp: () => void;

  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setLoading: (loading: boolean) => void;
  addActivityFeedback: (activityName: string, feedback: string) => void;
  setFeedbackSummary: (summary: string) => void;

  getUserProfile: () => UserProfile;
}

// 默认偏好
const DEFAULT_PREFS: UserPreferences = {
  social_frequency: '',
  budget: '',
  commute_tolerance: '',
  notes: '',
};

// 生成用户 ID
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildFeedbackSummary(current: string, activityName: string, feedback: string): string {
  const labelMap: Record<string, string> = {
    liked: '喜欢',
    completed: '完成过',
    skipped: '跳过',
  };
  const label = labelMap[feedback] || feedback;
  const entry = `${label}：${activityName}`;
  const items = current
    .split('；')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item !== entry);
  return [entry, ...items].slice(0, 8).join('；');
}

// 检查是否有已保存的用户 — 默认 null，异步加载后更新
const initialSavedUser = loadSavedUserSync();

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  isOnboarding: !initialSavedUser,
  isReturningUser: !!initialSavedUser,
  mbti: initialSavedUser?.mbti ?? null,
  preferences: initialSavedUser?.preferences ?? null,
  feedbackSummary: initialSavedUser?.feedbackSummary ?? '',
  userId: initialSavedUser?.userId ?? (initialSavedUser ? `user_${initialSavedUser.createdAt}` : generateUserId()),
  email: initialSavedUser?.email ?? null,
  authToken: initialSavedUser?.authToken ?? null,
  hasSkippedAuth: initialSavedUser?.hasSkippedAuth ?? false,
  messages: [],
  isLoading: false,
  currentTheme: MBTI_THEMES[initialSavedUser?.mbti ?? 'INTP'],

  // 设置 MBTI 类型
  setMBTI: (mbti) => {
    set({ mbti, currentTheme: MBTI_THEMES[mbti] });
  },

  // 设置偏好
  setPreferences: (prefs) => {
    const state = get();
    set({ preferences: prefs });
    if (state.mbti) {
      saveSavedUser({
        mbti: state.mbti,
        preferences: prefs,
        userId: state.userId,
        email: state.email ?? undefined,
        authToken: state.authToken ?? undefined,
        hasSkippedAuth: state.hasSkippedAuth,
        feedbackSummary: state.feedbackSummary,
        createdAt: state.userId.split('_')[1] || Date.now().toString(),
      });
    }
  },

  setAuthSession: (token, user) => {
    const mbti = user.mbti || 'INTP';
    set({
      userId: user.user_id,
      email: user.email,
      authToken: token,
      hasSkippedAuth: false,
      mbti,
      preferences: user.preferences,
      feedbackSummary: user.feedback_summary,
      currentTheme: MBTI_THEMES[mbti],
    });
    saveSavedUser({
      userId: user.user_id,
      email: user.email,
      authToken: token,
      hasSkippedAuth: false,
      mbti,
      preferences: user.preferences,
      feedbackSummary: user.feedback_summary,
      createdAt: user.user_id,
    });
  },

  continueAsGuest: () => {
    set({ hasSkippedAuth: true });
  },

  logout: () => {
    clearSavedUser();
    set({
      isOnboarding: true,
      isReturningUser: false,
      mbti: null,
      preferences: null,
      feedbackSummary: '',
      userId: generateUserId(),
      email: null,
      authToken: null,
      hasSkippedAuth: false,
      messages: [],
      currentTheme: MBTI_THEMES['INTP'],
    });
  },

  redoOnboarding: () => {
    set({
      isOnboarding: true,
      messages: [],
    });
  },

  // 完成入职引导，保存数据
  completeOnboarding: () => {
    const { mbti, preferences, userId, email, authToken, hasSkippedAuth } = get();
    if (mbti && preferences) {
      saveSavedUser({
        userId,
        email: email ?? undefined,
        authToken: authToken ?? undefined,
        hasSkippedAuth,
        mbti,
        preferences,
        feedbackSummary: get().feedbackSummary,
        createdAt: userId.split('_')[1] || Date.now().toString(),
      });
    }
    set({ isOnboarding: false });
  },

  // 从已保存数据直接进入
  startAppFromSaved: () => {
    if (savedUser) {
      set({
        mbti: savedUser.mbti,
        preferences: savedUser.preferences,
        currentTheme: MBTI_THEMES[savedUser.mbti],
        isOnboarding: false,
        isReturningUser: true,
      });
    } else {
      // 异步加载
      loadSavedUser().then((user) => {
        if (user) {
          savedUser = user;
          set({
            userId: user.userId ?? `user_${user.createdAt}`,
            email: user.email ?? null,
            authToken: user.authToken ?? null,
            hasSkippedAuth: user.hasSkippedAuth ?? false,
            mbti: user.mbti,
            preferences: user.preferences,
            feedbackSummary: user.feedbackSummary ?? '',
            currentTheme: MBTI_THEMES[user.mbti],
            isOnboarding: false,
            isReturningUser: true,
          });
        }
      });
    }
  },

  // 重置 App，清除数据
  resetApp: () => {
    clearSavedUser();
    set({
      isOnboarding: true,
      isReturningUser: false,
      mbti: null,
      preferences: null,
      feedbackSummary: '',
      userId: generateUserId(),
      email: null,
      authToken: null,
      hasSkippedAuth: false,
      messages: [],
      currentTheme: MBTI_THEMES['INTP'],
    });
  },

  // 聊天消息
  addMessage: (msg) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  setMessages: (msgs) => set({ messages: msgs }),

  setLoading: (loading) => set({ isLoading: loading }),

  addActivityFeedback: (activityName, feedback) => {
    const state = get();
    const nextSummary = buildFeedbackSummary(state.feedbackSummary, activityName, feedback);
    set({ feedbackSummary: nextSummary });
    if (state.mbti && state.preferences) {
      saveSavedUser({
        mbti: state.mbti,
        preferences: state.preferences,
        userId: state.userId,
        email: state.email ?? undefined,
        authToken: state.authToken ?? undefined,
        hasSkippedAuth: state.hasSkippedAuth,
        feedbackSummary: nextSummary,
        createdAt: state.userId.split('_')[1] || Date.now().toString(),
      });
    }
  },

  setFeedbackSummary: (summary) => {
    const state = get();
    set({ feedbackSummary: summary });
    if (state.mbti && state.preferences) {
      saveSavedUser({
        mbti: state.mbti,
        preferences: state.preferences,
        userId: state.userId,
        email: state.email ?? undefined,
        authToken: state.authToken ?? undefined,
        hasSkippedAuth: state.hasSkippedAuth,
        feedbackSummary: summary,
        createdAt: state.userId.split('_')[1] || Date.now().toString(),
      });
    }
  },

  // 获取当前用户画像（用于 API 调用）
  getUserProfile: (): UserProfile => {
    const { userId, mbti, preferences, feedbackSummary } = get();
    return {
      user_id: userId,
      mbti: mbti ?? 'INTP',
      preferences: preferences ?? DEFAULT_PREFS,
      feedback_summary: feedbackSummary,
    };
  },
}));

// 启动时异步加载已保存的用户数据
loadSavedUser().then((user) => {
  if (user) {
    savedUser = user;
    useAppStore.setState({
      isOnboarding: false,
      isReturningUser: true,
      mbti: user.mbti,
      preferences: user.preferences,
      feedbackSummary: user.feedbackSummary ?? '',
      userId: user.userId ?? `user_${user.createdAt}`,
      email: user.email ?? null,
      authToken: user.authToken ?? null,
      hasSkippedAuth: user.hasSkippedAuth ?? false,
      currentTheme: MBTI_THEMES[user.mbti],
    });
  }
});
