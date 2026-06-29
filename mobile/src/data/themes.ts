/**
 * MBTI 主题色映射（16 种）
 * 从前端 index.html themeMap 迁移
 */
import { MBTIType, MBTITheme } from '@/types';

export const MBTI_THEMES: Record<MBTIType, MBTITheme> = {
  INTJ: {
    colors: { bg: '#1a1a2e', card: '#16213e', accent: '#e94560', text: '#eee', subtext: '#999' },
    radius: '4px', avatar: '🦉', name: '小策略',
    accentGrad: 'linear-gradient(135deg, #e94560, #0f3460)',
  },
  INTP: {
    colors: { bg: '#1e1e2e', card: '#2a2a3e', accent: '#89b4fa', text: '#cdd6f4', subtext: '#888' },
    radius: '6px', avatar: '🤖', name: '小逻辑',
    accentGrad: 'linear-gradient(135deg, #89b4fa, #b4befe)',
  },
  ENTJ: {
    colors: { bg: '#0f0f1a', card: '#1a1a2e', accent: '#00d9ff', text: '#eee', subtext: '#999' },
    radius: '0px', avatar: '🐯', name: '小队长',
    accentGrad: 'linear-gradient(135deg, #00d9ff, #0096c7)',
  },
  ENTP: {
    colors: { bg: '#1a1520', card: '#241e30', accent: '#ff79c6', text: '#eee', subtext: '#999' },
    radius: '8px', avatar: '🦊', name: '小点子',
    accentGrad: 'linear-gradient(135deg, #ff79c6, #bd93f9)',
  },
  INFJ: {
    colors: { bg: '#1c1726', card: '#2a2339', accent: '#c4a7e7', text: '#e0def4', subtext: '#999' },
    radius: '16px', avatar: '🦌', name: '小洞察',
    accentGrad: 'linear-gradient(135deg, #c4a7e7, #e0def4)',
  },
  INFP: {
    colors: { bg: '#2a1f2e', card: '#352840', accent: '#f6c177', text: '#f0e6e6', subtext: '#b0a0a0' },
    radius: '20px', avatar: '🐰', name: '小暖',
    accentGrad: 'linear-gradient(135deg, #f6c177, #ea999c)',
  },
  ENFJ: {
    colors: { bg: '#2a1f1a', card: '#3a2a22', accent: '#ff9e64', text: '#fff5ee', subtext: '#c0a090' },
    radius: '16px', avatar: '🐶', name: '小暖阳',
    accentGrad: 'linear-gradient(135deg, #ff9e64, #e6c79c)',
  },
  ENFP: {
    colors: { bg: '#2a2418', card: '#353020', accent: '#ffe066', text: '#fffbe6', subtext: '#c0b860' },
    radius: '20px', avatar: '🌻', name: '小太阳',
    accentGrad: 'linear-gradient(135deg, #ffe066, #ffd43b)',
  },
  ISTJ: {
    colors: { bg: '#1a1e2a', card: '#242a3a', accent: '#6cace4', text: '#dde', subtext: '#889' },
    radius: '4px', avatar: '🦅', name: '小稳',
    accentGrad: 'linear-gradient(135deg, #6cace4, #4a90d9)',
  },
  ISFJ: {
    colors: { bg: '#241f2a', card: '#2e2839', accent: '#d4a5d4', text: '#f0e6f0', subtext: '#a090a0' },
    radius: '16px', avatar: '🕊️', name: '小护',
    accentGrad: 'linear-gradient(135deg, #d4a5d4, #c084c0)',
  },
  ESTJ: {
    colors: { bg: '#1a2a1f', card: '#243a2e', accent: '#5cd685', text: '#e0f0e0', subtext: '#90b090' },
    radius: '0px', avatar: '🦬', name: '小执行',
    accentGrad: 'linear-gradient(135deg, #5cd685, #37b24d)',
  },
  ESFJ: {
    colors: { bg: '#2a1f20', card: '#3a282a', accent: '#ff8a80', text: '#fff0ee', subtext: '#c0a0a0' },
    radius: '16px', avatar: '🐝', name: '小贴心',
    accentGrad: 'linear-gradient(135deg, #ff8a80, #e57373)',
  },
  ISTP: {
    colors: { bg: '#1e282e', card: '#283440', accent: '#73c991', text: '#dde8e0', subtext: '#889' },
    radius: '6px', avatar: '🐱', name: '小酷',
    accentGrad: 'linear-gradient(135deg, #73c991, #51cf66)',
  },
  ISFP: {
    colors: { bg: '#26201e', card: '#332a28', accent: '#ea8f8f', text: '#f0e8e6', subtext: '#a09898' },
    radius: '20px', avatar: '🦋', name: '小雅',
    accentGrad: 'linear-gradient(135deg, #ea8f8f, #f06595)',
  },
  ESTP: {
    colors: { bg: '#2a2018', card: '#3a2e22', accent: '#ffb74d', text: '#fff5e6', subtext: '#c0a878' },
    radius: '8px', avatar: '🐆', name: '小冲',
    accentGrad: 'linear-gradient(135deg, #ffb74d, #ffa726)',
  },
  ESFP: {
    colors: { bg: '#2a2518', card: '#353022', accent: '#ffd54f', text: '#fffce6', subtext: '#c0b870' },
    radius: '20px', avatar: '🦜', name: '小闪耀',
    accentGrad: 'linear-gradient(135deg, #ffd54f, #ffca28)',
  },
};

// 所有 MBTI 类型列表
export const MBTI_TYPES: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];
