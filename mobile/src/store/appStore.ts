/**
 * 全局状态管理（Zustand + AsyncStorage 持久化）
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MBTIType, UserProfile, UserPreferences, ChatMessage, MBTITheme } from '@/types';
import { MBTI_THEMES } from '@/data/themes';

// 用户数据存储 key
const USER_KEY = 'onedayreco_user';

// 保存的用户数据结构
interface SavedUser {
  mbti: MBTIType;
  preferences: UserPreferences;
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
  isHydrated: boolean; // AsyncStorage 加载完成标志

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

// 检查是否有已保存的用户 — 默认 null，异步加载后更新
const initialSavedUser = savedUser;

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  isOnboarding: !initialSavedUser,
  isReturningUser: !!initialSavedUser,
  isHydrated: false, // 初始未加载完成
  mbti: initialSavedUser?.mbti ?? null,
  preferences: initialSavedUser?.preferences ?? null,
  userId: initialSavedUser ? `user_${initialSavedUser.createdAt}` : generateUserId(),
  messages: [],
  isLoading: false,
  currentTheme: MBTI_THEMES[initialSavedUser?.mbti ?? 'INTP'],

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

  // 从已保存数据直接进入（保留用于外部调用）
  startAppFromSaved: () => {
    loadSavedUser().then((user) => {
      if (user) {
        savedUser = user;
        set({
          mbti: user.mbti,
          preferences: user.preferences,
          currentTheme: MBTI_THEMES[user.mbti],
          isOnboarding: false,
          isReturningUser: true,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    });
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

// 启动时异步加载已保存的用户数据
loadSavedUser().then((user) => {
  if (user) {
    savedUser = user;
    useAppStore.setState({
      isOnboarding: false,
      isReturningUser: true,
      isHydrated: true,
      mbti: user.mbti,
      preferences: user.preferences,
      userId: `user_${user.createdAt}`,
      currentTheme: MBTI_THEMES[user.mbti],
    });
  } else {
    useAppStore.setState({ isHydrated: true });
  }
});
