/**
 * API 服务层
 * 封装与后端 FastAPI 的所有交互
 * 内置 Mock 模式：后端不可用时自动返回模拟数据
 */
import { UserProfile, RecommendContext, RecommendResponse, ChatResponse, ChatMessage } from '@/types';
import { Platform } from 'react-native';

// 后端 API 地址
// Android 模拟器: 10.0.2.2 指向宿主机 localhost
// iOS 模拟器: localhost 即可
// 真机: 需设置为电脑局域网 IP（如 192.168.x.x）或生产域名
const DEV_API_BASE = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
const API_BASE = __DEV__
  ? (process.env.EXPO_PUBLIC_API_BASE || DEV_API_BASE)
  : 'https://api.onedayreco.com';

// ===== Mock 数据（覆盖全 8 分类） =====
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
    category: '文化娱乐',
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
    category: '户外自然',
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
  {
    activity_id: 'mock_004',
    activity_name: '在家做一顿饭',
    recommend_text: '打开一个美食视频，跟着做一道没尝试过的菜。买菜、切菜、烹饪，整个过程很治愈。',
    tips: '提前在盒马/叮咚买菜备好食材',
    safety_note: '注意用火安全',
    category: '居家休闲',
    budget: '20-60元',
    specific_info: {
      name: '下厨房 · 今日推荐菜谱',
      location: '在家',
      duration: '1-1.5 小时',
      price: '食材 ¥20-60',
      rating: '下厨房 4.8',
      source: '下厨房 App',
    },
  },
  {
    activity_id: 'mock_005',
    activity_name: '约朋友吃个饭',
    recommend_text: '好久没和朋友聚了，找个大家都方便的时间，约一顿火锅或烤肉，边吃边聊。',
    tips: '提前 2 天约，用群投票选餐厅',
    safety_note: '',
    category: '社交聚会',
    budget: '80-150元',
    specific_info: {
      name: '海底捞（三里屯店）',
      location: '朝阳区三里屯路 19 号',
      duration: '2-3 小时',
      price: '人均 ¥120',
      rating: '大众点评 4.6',
      source: '大众点评',
    },
  },
  {
    activity_id: 'mock_006',
    activity_name: '去健身房练一小时',
    recommend_text: '运动一下出出汗，心情会好很多。不想去健身房的话，在家跟着视频做 HIIT 也行。',
    tips: '记得带水和毛巾，运动后拉伸 5 分钟',
    safety_note: '运动前热身，量力而行',
    action_url: 'https://www.keep.cn',
    action_label: '打开 Keep',
    category: '运动健身',
    budget: '0-30元',
    specific_info: {
      name: '超级猩猩（朝阳大悦城店）',
      location: '朝阳区青年路朝阳大悦城',
      duration: '45-60 分钟',
      price: '团课 ¥39 / 自主训练 ¥0',
      rating: '大众点评 4.7',
      source: '大众点评',
    },
  },
  {
    activity_id: 'mock_007',
    activity_name: '学点新东西',
    recommend_text: '打开 B 站找个感兴趣的教程，花 30 分钟学个小技能。摄影、编程、画画，什么都行。',
    tips: '设个 30 分钟闹钟，专注学完一个小节',
    safety_note: '',
    action_url: 'https://www.bilibili.com',
    action_label: '打开 B 站',
    category: '学习提升',
    budget: '免费',
    specific_info: {
      name: 'B 站 · 知识区热门',
      location: '在家',
      duration: '30-60 分钟',
      price: '免费',
      rating: 'B 站 9.5',
      source: '哔哩哔哩',
    },
  },
  {
    activity_id: 'mock_008',
    activity_name: '画点什么',
    recommend_text: '拿支笔和纸，随便画点什么。不用画得好，就是让手和脑放松一下。也可以试试数字绘画。',
    tips: '不用橡皮，画错了就顺着画下去',
    safety_note: '',
    category: '创意手工',
    budget: '0-20元',
    specific_info: {
      name: '在家随手画',
      location: '在家',
      duration: '30-60 分钟',
      price: '纸笔 ¥0-20',
      rating: '—',
      source: '—',
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

  if (msg_lower.includes('安静') || msg_lower.includes('一个人') || msg_lower.includes('宅') || msg_lower.includes('咖啡') || msg_lower.includes('看书')) {
    recs = [MOCK_RECOMMENDATIONS[1]]; // 咖啡馆
  } else if (msg_lower.includes('电影') || msg_lower.includes('看')) {
    recs = [MOCK_RECOMMENDATIONS[0]]; // 电影
  } else if (msg_lower.includes('公园') || msg_lower.includes('散步') || msg_lower.includes('自然') || msg_lower.includes('户外')) {
    recs = [MOCK_RECOMMENDATIONS[2]]; // 公园
  } else if (msg_lower.includes('做饭') || msg_lower.includes('吃') || msg_lower.includes('厨')) {
    recs = [MOCK_RECOMMENDATIONS[3]]; // 做饭
  } else if (msg_lower.includes('朋友') || msg_lower.includes('聚') || msg_lower.includes('约')) {
    recs = [MOCK_RECOMMENDATIONS[4]]; // 社交
  } else if (msg_lower.includes('运动') || msg_lower.includes('健身') || msg_lower.includes('锻炼') || msg_lower.includes('跑')) {
    recs = [MOCK_RECOMMENDATIONS[5]]; // 运动
  } else if (msg_lower.includes('学') || msg_lower.includes('看视频') || msg_lower.includes('教程')) {
    recs = [MOCK_RECOMMENDATIONS[6]]; // 学习
  } else if (msg_lower.includes('画') || msg_lower.includes('手工') || msg_lower.includes('创作')) {
    recs = [MOCK_RECOMMENDATIONS[7]]; // 创意
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
const REQUEST_TIMEOUT = 10000; // 10s

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
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
