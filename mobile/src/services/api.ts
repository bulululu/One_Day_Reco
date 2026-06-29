/**
 * API 服务层
 * 封装与后端 FastAPI 的所有交互
 */
import { UserProfile, RecommendContext, RecommendResponse, ChatResponse, ChatMessage } from '@/types';

// 后端 API 地址
// 开发环境：本地 8000 端口
// 生产环境：需要替换为实际服务器地址
const API_BASE = __DEV__
  ? 'http://localhost:8000'
  : 'https://api.onedayreco.com'; // TODO: 替换为生产地址

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API] ${path} 请求失败:`, error);
    throw error;
  }
}

/**
 * 健康检查
 */
export function checkHealth() {
  return request<{ status: string; timestamp: string; activities_count: number; llm_available: boolean }>('/api/health');
}

/**
 * 获取活动列表
 */
export function getActivities(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<{ count: number; activities: any[] }>(`/api/activities${query}`);
}

/**
 * 获取活动分类
 */
export function getCategories() {
  return request<{ categories: string[] }>('/api/categories');
}

/**
 * 生成活动推荐
 */
export function recommend(
  userProfile: UserProfile,
  context?: RecommendContext
): Promise<RecommendResponse> {
  return request<RecommendResponse>('/api/recommend', {
    method: 'POST',
    body: JSON.stringify({
      user_profile: userProfile,
      context,
    }),
  });
}

/**
 * 与互动仔对话
 */
export function chat(
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
 * 提交反馈
 */
export function submitFeedback(userId: string, activityId: string, feedback: string) {
  return request<{ status: string; message: string }>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      activity_id: activityId,
      feedback,
    }),
  });
}
