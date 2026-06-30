import { ImageSourcePropType } from 'react-native';
import { MBTIType } from '@/types';

export interface LifestyleProfile {
  styleName: string;
  subtitle: string;
  keywords: string[];
}

export interface HomeIdeaCard {
  key: string;
  title: string;
  subtitle: string;
  tag: string;
  distance: string;
  prompt: string;
  image: ImageSourcePropType;
}

export const HOME_ASSETS = {
  hero: require('../assets/generated/home-hero.png'),
  feature: require('../assets/generated/daily-feature.png'),
};

export const HOME_IDEAS: HomeIdeaCard[] = [
  {
    key: 'craft',
    title: '向日葵手作坊',
    subtitle: '一起动手，收获快乐',
    tag: '亲手制作',
    distance: '1.2 km',
    prompt: '帮我安排一个今天可以做的手作活动，要具体到地点、时间、价格和下一步',
    image: require('../assets/generated/idea-craft.png'),
  },
  {
    key: 'bike',
    title: '城市绿道骑行',
    subtitle: '运动一下，拥抱自然',
    tag: '户外运动',
    distance: '3.5 km',
    prompt: '帮我安排一个附近的绿道骑行计划，要有路线、时长、天气建议',
    image: require('../assets/generated/idea-bike.png'),
  },
  {
    key: 'movie',
    title: '家庭电影之夜',
    subtitle: '窝在沙发里看一部好电影',
    tag: '室内娱乐',
    distance: '-',
    prompt: '推荐一个今晚适合看的电影或纪录片，要给出片名、平台、时长和理由',
    image: require('../assets/generated/idea-movie.png'),
  },
];

export const LIFESTYLE_PROFILES: Record<MBTIType, LifestyleProfile> = {
  ISTJ: { styleName: '极简实用风', subtitle: '整洁有序，高效实用', keywords: ['秩序', '可靠', '低调'] },
  ISFJ: { styleName: '温馨田园风', subtitle: '温暖舒适，细节用心', keywords: ['照顾', '安全', '柔和'] },
  INFJ: { styleName: '治愈森系风', subtitle: '自然宁静，心灵疗愈', keywords: ['安静', '意义', '自然'] },
  INTJ: { styleName: '未来极简风', subtitle: '理性克制，结构清晰', keywords: ['规划', '清晰', '高级'] },
  ISTP: { styleName: '工业机能风', subtitle: '自由硬核，功能优先', keywords: ['自由', '质感', '效率'] },
  ISFP: { styleName: '自然原木风', subtitle: '亲近自然，随性舒适', keywords: ['手作', '自然', '灵动'] },
  INFP: { styleName: '文艺复古风', subtitle: '浪漫理想，氛围感强', keywords: ['故事', '温柔', '慢生活'] },
  INTP: { styleName: '理性学者风', subtitle: '知识导向，留白思考', keywords: ['思考', '书房', '逻辑'] },
  ESTP: { styleName: '活力街头风', subtitle: '行动感强，敢于尝试', keywords: ['行动', '节奏', '有趣'] },
  ESFP: { styleName: '多巴胺色彩风', subtitle: '色彩丰富，快乐能量', keywords: ['表达', '快乐', '当下'] },
  ENFP: { styleName: '创意混搭风', subtitle: '天马行空，多元融合', keywords: ['灵感', '探索', '松弛'] },
  ENTP: { styleName: '未来实验风', subtitle: '开放多变，激发灵感', keywords: ['实验', '好奇', '变化'] },
  ESTJ: { styleName: '经典商务风', subtitle: '结构清晰，稳重可靠', keywords: ['效率', '目标', '执行'] },
  ESFJ: { styleName: '温馨社交风', subtitle: '舒适明亮，照顾他人', keywords: ['分享', '明亮', '亲和'] },
  ENFJ: { styleName: '轻奢优雅风', subtitle: '有品位，注重氛围', keywords: ['优雅', '温暖', '组织'] },
  ENTJ: { styleName: '现代极简风', subtitle: '目标导向，掌控全局', keywords: ['掌控', '高级', '利落'] },
};

export function getLifestyleProfile(mbti: MBTIType): LifestyleProfile {
  return LIFESTYLE_PROFILES[mbti];
}
