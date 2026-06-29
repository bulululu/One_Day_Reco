/**
 * API 服务层
 * 封装与后端 FastAPI 的所有交互
 * 内置 Mock 模式：后端不可用时自动返回模拟数据
 */
import { UserProfile, RecommendContext, RecommendResponse, ChatResponse, ChatMessage } from '@/types';

// 后端 API 地址
const API_BASE = __DEV__
  ? 'http://localhost:8000'
  : 'https://api.onedayreco.com';

// ===== Mock 数据 =====
const MOCK_RECOMMENDATIONS = [
  {
    activity_id: 'mock_001',
    activity_name: '去看一场电影',
    recommend_text: '最近《沙丘2》评分很高，IMAX 版本沉浸感超强，适合一个人安静地享受两小时。',
    tips: '建议提前 15 分钟到，选后排中间位置',
    safety_note: '',
    action_url: 'https://m.maoyan.com',
    action_label: '查看排片',
    image_query: 'cinema',
    category: '休闲娱乐',
    budget: '30-80元',
    specific_info: {
      name: '万达影城（朝阳大悦城店）',
      location: '朝阳区青年路朝阳大悦城 8F',
      duration: '约 2 小时 46 分钟',
      price: 'IMAX ¥79.9 / 普通 ¥45.9',
      rating: '豆瓣 8.3 / 猫眼 9.2',
      source: '猫眼电影',
    },
  },
  {
    activity_id: 'mock_002',
    activity_name: '找个咖啡馆看书',
    recommend_text: '带上一本一直想读的书，找家安静的咖啡馆坐下来。星巴克臻选环境不错，人少的时候很舒服。',
    tips: '工作日下午人最少，可以坐很久',
    safety_note: '',
    category: '城市探索',
    budget: '30-50元',
    specific_info: {
      name: '星巴克臻选（北京坊店）',
      location: '西城区前门北京坊',
      duration: '随意',
      price: '人均 ¥35-60',
      rating: '大众点评 4.7',
      source: '大众点评',
    },
  },
  {
    activity_id: 'mock_003',
    activity_name: '去公园散步',
    recommend_text: '今天天气不错，去附近公园走走吧。带个耳机，放点喜欢的音乐，走走停停，放松一下。',
    tips: '傍晚 5-6 点光线最好，适合拍照',
    safety_note: '天黑前回来就好',
    category: '户外运动',
    budget: '免费',
    specific_info: {
      name: '朝阳公园',
      location: '朝阳区朝阳公园南路 1 号',
      duration: '1-2 小时',
      price: '免费',
      rating: '大众点评 4.5',
      source: '大众点评',
    },
  },
];

const MOCK_REPLIES = [
  '这个不错，我觉得挺适合你现在的状态的。要不试试？',
  '嗯嗯，我懂你。要不先看看这个？',
  '好嘞，我帮你想想…你看这个怎么样？',
  '收到！我挑了一个觉得你会喜欢的，看看卡片～',
];

function getMockChatResponse(message: string): ChatResponse {
  const msg_lower = message.toLowerCase();
  let recs;

  if (msg_lower.includes('安静') || msg_lower.includes('一个人') || msg_lower.includes('宅')) {
    recs = [MOCK_RECOMMENDATIONS[1]];
  } else if (msg_lower.includes('电影') || msg_lower.includes('看')) {
    recs = [MOCK_RECOMMENDATIONS[0]];
  } else if (msg_lower.includes('公园') || msg_lower.includes('散步') || msg_lower.includes('运动')) {
    recs = [MOCK_RECOMMENDATIONS[2]];
  } else {
    recs = [MOCK_RECOMMENDATIONS[Math.floor(Math.random() * MOCK_RECOMMENDATIONS.length)]];
  }

  return {
    reply: MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)],
    recommendations: recs,
    companion: { avatar: '🤖', name: '小逻辑' },
    theme: {
      colors: { bg: '#1e1e2e', card: '#2a2a3e', accent: '#89b4fa', text: '#cdd6f4', subtext: '#888' },
      radius: '6px',
      avatar: '🤖',
      name: '小逻辑',
    },
  };
}

// ===== 请求封装 =====
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
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
export async function recommend(
  userProfile: UserProfile,
  context?: RecommendContext
): Promise<RecommendResponse> {
  try {
    return await request<RecommendResponse>('/api/recommend', {
      method: 'POST',
      body: JSON.stringify({ user_profile: userProfile, context }),
    });
  } catch {
    return {
      recommendations: [MOCK_RECOMMENDATIONS[Math.floor(Math.random() * MOCK_RECOMMENDATIONS.length)]],
      agent_message: MOCK_REPLIES[0],
      companion: { avatar: '🤖', name: '小逻辑' },
      theme: {
        colors: { bg: '#1e1e2e', card: '#2a2a3e', accent: '#89b4fa', text: '#cdd6f4', subtext: '#888' },
        radius: '6px',
        avatar: '🤖',
        name: '小逻辑',
      },
    };
  }
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
  try {
    return await request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        user_profile: userProfile,
        message,
        context,
        history,
      }),
    });
  } catch {
    return getMockChatResponse(message);
  }
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
