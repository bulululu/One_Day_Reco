/**
 * 全局状态管理（Zustand + MMKV 持久化）
 */
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { MBTIType, UserProfile, UserPreferences, ChatMessage, Recommendation, MBTITheme } from '@/types';
import { MBTI_THEMES } from '@/data/themes';

// MMKV 存储实例
const storage = new MMKV();

// 用户数据存储 key
const USER_KEY = 'onedayreco_user';

// 保存的用户数据结构
interface SavedUser {
  mbti: MBTIType;
  preferences: UserPreferences;
  createdAt: string;
}

// 从 MMKV 加载已保存的用户
function loadSavedUser(): SavedUser | null {
  try {
    const json = storage.getString(USER_KEY);
    if (json) return JSON.parse(json);
  } catch (e) {
    console.error('[Store] 加载用户数据失败:', e);
  }
  return null;
}

// 保存用户到 MMKV
function saveSavedUser(data: SavedUser) {
  try {
    storage.set(USER_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Store] 保存用户数据失败:', e);
  }
}

// 清除用户数据
function clearSavedUser() {
  storage.delete(USER_KEY);
}

// Store 状态接口
interface AppState {
  // 入职引导
  isOnboarding: boolean;
  isReturningUser: boolean;

  // 用户数据
  mbti: MBTIType | null;
  preferences: UserPreferences | null;
  userId: string;

  // 聊天
  messages: ChatMessage[];
  isLoading: boolean;

  // 主题
  currentTheme: MBTITheme;

  // Actions
  setMBTI: (mbti: MBTIType) => void;
  setPreferences: (prefs: UserPreferences) => void;
  completeOnboarding: () => void;
  startAppFromSaved: () => void;
  resetApp: () => void;

  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setLoading: (loading: boolean) => void;

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

// 检查是否有已保存的用户
const savedUser = loadSavedUser();

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  isOnboarding: !savedUser,
  isReturningUser: !!savedUser,
  mbti: savedUser?.mbti ?? null,
  preferences: savedUser?.preferences ?? null,
  userId: savedUser ? `user_${savedUser.createdAt}` : generateUserId(),
  messages: [],
  isLoading: false,
  currentTheme: MBTI_THEMES[savedUser?.mbti ?? 'INTP'],

  // 设置 MBTI 类型
  setMBTI: (mbti) => {
    set({ mbti, currentTheme: MBTI_THEMES[mbti] });
  },

  // 设置偏好
  setPreferences: (prefs) => {
    set({ preferences: prefs });
  },

  // 完成入职引导，保存数据
  completeOnboarding: () => {
    const { mbti, preferences, userId } = get();
    if (mbti && preferences) {
      saveSavedUser({
        mbti,
        preferences,
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
      userId: generateUserId(),
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

  // 获取当前用户画像（用于 API 调用）
  getUserProfile: (): UserProfile => {
    const { userId, mbti, preferences } = get();
    return {
      user_id: userId,
      mbti: mbti ?? 'INTP',
      preferences: preferences ?? DEFAULT_PREFS,
      feedback_summary: '',
    };
  },
}));
