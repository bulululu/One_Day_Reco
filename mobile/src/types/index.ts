/**
 * OneDayReco 类型定义
 */

// MBTI 类型
export type MBTIType =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

// 用户偏好
export interface UserPreferences {
  social_frequency: string;
  budget: string;
  commute_tolerance: string;
  notes: string;
}

// 用户画像
export interface UserProfile {
  user_id: string;
  mbti: MBTIType;
  preferences: UserPreferences;
  feedback_summary: string;
}

// 推荐上下文
export interface RecommendContext {
  weather?: string;
  location?: string;
}

// 活动推荐
export interface Recommendation {
  activity_id: string;
  activity_name: string;
  recommend_text: string;
  tips: string;
  safety_note: string;
  action_url?: string;
  action_label?: string;
  image_query?: string;
  category?: string;
  budget?: string;
  specific_info?: SpecificInfo;
}

// 具体信息（v1.0 新增：推荐具体化）
export interface SpecificInfo {
  name: string;
  location: string;
  duration: string;
  price: string;
  rating: string;
  source: string;
}

// 推荐响应
export interface RecommendResponse {
  recommendations: Recommendation[];
  agent_message: string;
  companion: { avatar: string; name: string };
  theme: MBTITheme;
}

// 聊天消息
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Recommendation[];
  timestamp?: number;
}

// 聊天响应
export interface ChatResponse {
  reply: string;
  recommendations: Recommendation[];
  companion: { avatar: string; name: string };
  theme: MBTITheme;
}

// MBTI 主题
export interface MBTITheme {
  colors: {
    bg: string;
    card: string;
    accent: string;
    text: string;
    subtext: string;
  };
  radius: string;
  avatar: string;
  name: string;
  accentGrad?: string;
}

// MBTI 人格设定
export interface MBTIPersona {
  quickActions: string[];
  status: string;
  placeholder: string;
  step1Title: string;
  step1Sub: string;
  step2Title: string;
  step2Sub: string;
  step3Title: string;
  step3Sub: string;
}

// 活动分类视觉
export interface CategoryVisual {
  gradient: string[];
  emoji: string;
}

// 保存的用户数据
export interface SavedUser {
  mbti: MBTIType;
  preferences: UserPreferences;
  createdAt: string;
}
