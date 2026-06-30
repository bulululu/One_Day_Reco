/**
 * API 服务层
 * 封装与后端 FastAPI 的所有交互
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  ActivityCatalogResponse,
  AuthResponse,
  AuthUser,
  UserProfile,
  UserPreferences,
  RecommendContext,
  RecommendResponse,
  ChatResponse,
  ChatMessage,
  ContentSearchResponse,
  PlaceSearchResponse,
  ConfigStatusResponse,
  MovieCatalogResponse,
  RecommendationHistoryRecord,
} from '@/types';

// 后端 API 地址
function getDevApiBase() {
  const explicit = process.env.EXPO_PUBLIC_API_BASE;
  if (explicit) return explicit.replace(/\/$/, '');

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8000`;
  }

  const manifest = Constants as typeof Constants & {
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  };
  const hostUri = Constants.expoConfig?.hostUri || manifest.manifest2?.extra?.expoGo?.debuggerHost;
  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : '';
  if (host) return `http://${host}:8000`;

  return 'http://localhost:8000';
}

const API_BASE = __DEV__ ? getDevApiBase() : 'https://api.onedayreco.com';

// ===== 请求封装 =====
async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export function register(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(token: string): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/me', {}, token);
}

export function updateProfile(
  token: string,
  profile: {
    mbti?: string;
    preferences?: UserPreferences;
    feedback_summary?: string;
  }
): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/me/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  }, token);
}

/**
 * 健康检查
 */
export async function checkHealth(): Promise<boolean> {
  try {
    await request('/api/health');
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取活动列表
 */
export function getActivities(params?: {
  category?: string;
  subcategory?: string;
  q?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.category) search.set('category', params.category);
  if (params?.subcategory) search.set('subcategory', params.subcategory);
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString() ? `?${search.toString()}` : '';
  return request<ActivityCatalogResponse>(`/api/activities${query}`);
}

export function getGameActivities(limit?: number) {
  const query = limit ? `?limit=${encodeURIComponent(String(limit))}` : '';
  return request<ActivityCatalogResponse>(`/api/activities/games${query}`);
}

/**
 * 获取活动分类
 */
export function getCategories() {
  return request<{ categories: string[] }>('/api/categories');
}

export function getConfigStatus() {
  return request<ConfigStatusResponse>('/api/config/status');
}

export function searchPlaces(params: {
  q: string;
  location?: string;
  city?: string;
  limit?: number;
  types?: string;
}) {
  const search = new URLSearchParams();
  search.set('q', params.q);
  if (params.location) search.set('location', params.location);
  if (params.city) search.set('city', params.city);
  if (params.limit) search.set('limit', String(params.limit));
  if (params.types) search.set('types', params.types);
  return request<PlaceSearchResponse>(`/api/places/search?${search.toString()}`);
}

export function getNearbyMovies(params?: {
  location?: string;
  region?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.location) search.set('location', params.location);
  if (params?.region) search.set('region', params.region);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString() ? `?${search.toString()}` : '';
  return request<MovieCatalogResponse>(`/api/movies/nearby${query}`);
}

export function searchContent(params?: {
  q?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString() ? `?${search.toString()}` : '';
  return request<ContentSearchResponse>(`/api/content/search${query}`);
}

/**
 * 获取实时天气
 */
export async function getWeather(location: string) {
  try {
    return await request<{
      location: string;
      country: string;
      latitude?: number;
      longitude?: number;
      weather: string;
      temperature?: number;
      display: string;
      source: string;
    }>(`/api/weather?location=${encodeURIComponent(location)}`);
  } catch {
    return {
      location,
      country: '',
      weather: '天气未获取',
      display: '天气未获取',
      source: 'unavailable',
    };
  }
}

/**
 * 生成活动推荐
 */
export async function recommend(
  userProfile: UserProfile,
  context?: RecommendContext
): Promise<RecommendResponse> {
  return request<RecommendResponse>('/api/recommend', {
    method: 'POST',
    body: JSON.stringify({ user_profile: userProfile, context }),
  });
}

/**
 * 与搭子对话
 */
export async function chat(
  userProfile: UserProfile,
  message: string,
  context?: RecommendContext,
  history?: ChatMessage[]
): Promise<ChatResponse> {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      user_profile: userProfile,
      message,
      context,
      history,
    }),
  });
}

/**
 * 屏幕使用时间触发推荐
 */
export async function triggerRecommendation(
  userProfile: UserProfile,
  trigger: {
    app_name: string;
    app_category?: string;
    usage_minutes: number;
    continuous_minutes?: number;
  },
  context?: RecommendContext
): Promise<RecommendResponse> {
  try {
    return await request<RecommendResponse>('/api/trigger', {
      method: 'POST',
      body: JSON.stringify({
        user_profile: userProfile,
        app_name: trigger.app_name,
        app_category: trigger.app_category || 'screen',
        usage_minutes: trigger.usage_minutes,
        continuous_minutes: trigger.continuous_minutes,
        context,
      }),
    });
  } catch {
    return recommend(userProfile, {
      ...context,
      mode_note: '屏幕使用时间触发的本地降级推荐',
    });
  }
}

export function recordActivityEvent(params: {
  userId: string;
  activityId: string;
  eventType: 'shown' | 'click' | 'completed' | 'skipped' | 'liked' | 'triggered';
  activityName?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}) {
  return request<{ status: string; event_id: string }>('/api/activity-events', {
    method: 'POST',
    body: JSON.stringify({
      user_id: params.userId,
      activity_id: params.activityId,
      event_type: params.eventType,
      activity_name: params.activityName || '',
      source: params.source || 'mobile',
      metadata: params.metadata || {},
    }),
  });
}

export function getRecommendationHistory(userId: string, limit = 20) {
  const query = new URLSearchParams({ user_id: userId, limit: String(limit) });
  return request<{ history: RecommendationHistoryRecord[] }>(`/api/recommendations/history?${query.toString()}`);
}

/**
 * 提交反馈
 */
export async function submitFeedback(
  userId: string,
  activityId: string,
  feedback: string,
  activityName?: string
) {
  try {
    return await request<{ status: string; message: string; feedback_summary?: string }>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        activity_id: activityId,
        feedback,
        activity_name: activityName,
      }),
    });
  } catch {
    return { status: 'local', message: '已先在本地记下' };
  }
}
