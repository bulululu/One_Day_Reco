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

function hostFromUri(uri?: string) {
  if (!uri) return '';
  return uri.replace(/^https?:\/\//, '').replace(/^exp:\/\//, '').split('/')[0].split(':')[0];
}

// 后端 API 地址
function getDevApiBases() {
  const explicit = process.env.EXPO_PUBLIC_API_BASE;
  if (explicit) return [explicit.replace(/\/$/, '')];

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return [`http://${window.location.hostname}:8000`];
  }

  const manifest = Constants as typeof Constants & {
    linkingUri?: string;
    manifest?: { debuggerHost?: string; hostUri?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  };
  const hosts = [
    hostFromUri(Constants.expoConfig?.hostUri),
    hostFromUri(manifest.manifest2?.extra?.expoGo?.debuggerHost),
    hostFromUri(manifest.manifest?.debuggerHost),
    hostFromUri(manifest.manifest?.hostUri),
    hostFromUri(manifest.linkingUri),
  ].filter(Boolean);

  return Array.from(new Set([...hosts.map((host) => `http://${host}:8000`), 'http://localhost:8000']));
}

const API_BASES = getDevApiBases();
const REQUEST_TIMEOUT_MS = 25000;
let workingApiBase = API_BASES[0];

export function getApiBase() {
  return workingApiBase;
}

// ===== 请求封装 =====
async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let lastError: unknown;
  const bases = Array.from(new Set([workingApiBase, ...API_BASES]));

  for (const base of bases) {
    const controller = typeof AbortController !== 'undefined' && !options.signal ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;
    try {
      const response = await fetch(`${base}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
        signal: options.signal || controller?.signal,
      }).finally(() => {
        if (timeout) clearTimeout(timeout);
      });

      if (!response.ok) {
        const error = new Error(`API Error: ${response.status} ${response.statusText} (${base})`);
        error.name = 'ApiResponseError';
        throw error;
      }

      workingApiBase = base;
      return await response.json();
    } catch (error) {
      if (timeout) clearTimeout(timeout);
      if (error instanceof Error && error.name === 'ApiResponseError') throw error;
      lastError = error;
      if (options.signal) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('API request failed');
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
