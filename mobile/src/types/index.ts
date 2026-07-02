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

export interface AuthUser {
  user_id: string;
  email: string;
  mbti: MBTIType;
  preferences: UserPreferences;
  feedback_summary: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// 推荐上下文
export interface RecommendContext {
  weather?: string;
  location?: string;
  mode?: string;
  mode_note?: string;
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
  platform?: string;
  route?: string;
  game_type?: string;
  player_mode?: string;
  setup?: string;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  crowd_density?: string;
  indoor_outdoor?: string;
  social_intensity?: string;
  energy_cost?: string;
  duration_hours?: number;
  budget?: string;
  mood_effect?: string;
  action_url?: string;
  action_label?: string;
  image_query?: string;
  specific_info?: SpecificInfo;
}

export interface ActivityCatalogResponse {
  count: number;
  source: 'external_api' | 'local_fallback';
  is_realtime: boolean;
  activities: Activity[];
}

export interface ActivitySourceMeta {
  source: 'external_api' | 'local_fallback';
  is_realtime: boolean;
  total_count: number;
  candidate_count: number;
}

export interface PlaceCandidate {
  id: string;
  name: string;
  address: string;
  type: string;
  typecode: string;
  location: string;
  distance: string;
  amap_url?: string;
  route_distance?: string;
  route_duration?: string;
  route_mode?: string;
  tel: string;
  business_area: string;
  pname: string;
  cityname: string;
  adname: string;
  source: string;
}

export interface PlaceSearchResponse {
  query: string;
  location: string;
  source: 'AMap' | 'search_fallback';
  configured: boolean;
  is_realtime: boolean;
  reason?: string;
  search_url?: string;
  count?: number;
  places: PlaceCandidate[];
}

export interface MovieCandidate {
  id: string;
  title: string;
  duration: string;
  rating: string;
  source: string;
  availability?: string;
  overview: string;
  release_date?: string;
  actors?: string;
  booking_url: string;
  booking_label: string;
  showtime_status: string;
  estimated_price?: string;
  recommended_cinema?: PlaceCandidate | null;
  cinema_candidates: PlaceCandidate[];
  cinema_search_url?: string;
}

export interface MovieCatalogResponse {
  count: number;
  source: 'Maoyan unofficial' | 'TMDb' | 'curated_fallback';
  is_realtime: boolean;
  showtime_realtime: boolean;
  showtime_note: string;
  cinema_source: 'AMap' | 'search_fallback';
  cinema_is_realtime: boolean;
  movies: MovieCandidate[];
}

export interface ContentItem {
  id: string;
  title: string;
  duration: string;
  rating: string;
  source: string;
  description: string;
  action_url: string;
  action_label: string;
}

export interface ContentSearchResponse {
  query: string;
  count: number;
  source: 'Bilibili' | 'curated_fallback';
  is_realtime: boolean;
  items: ContentItem[];
}

export interface RecommendationHistoryItem {
  activity_id: string;
  activity_name: string;
  category: string;
  budget: string;
  specific_info: {
    name: string;
    location: string;
    duration: string;
    price: string;
    source: string;
  };
}

export interface RecommendationHistoryRecord {
  id: string;
  source: string;
  context: RecommendContext;
  activity_source: ActivitySourceMeta;
  recommendations: RecommendationHistoryItem[];
  created_at: string;
}

export interface ServiceStatus {
  label: string;
  configured: boolean;
  is_realtime: boolean;
  source: string;
  detail: string;
}

export interface ConfigStatusResponse {
  services: Record<string, ServiceStatus>;
}

// 推荐响应
export interface RecommendResponse {
  recommendations: Recommendation[];
  agent_message: string;
  agent_source?: 'llm' | 'fallback';
  companion: { avatar: string; name: string };
  theme: MBTITheme;
  activity_source?: ActivitySourceMeta;
}

// 聊天消息
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  reply_source?: 'llm' | 'fallback';
  recommendations?: Recommendation[];
  timestamp?: number;
}

// 聊天响应
export interface ChatResponse {
  reply: string;
  reply_source?: 'llm' | 'fallback';
  recommendations: Recommendation[];
  companion: { avatar: string; name: string };
  theme: MBTITheme;
  activity_source?: ActivitySourceMeta;
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
  feedbackSummary?: string;
  createdAt: string;
}
