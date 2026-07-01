/**
 * MBTI 浅色主题映射
 * 背景保持温暖克制，accent 承担每种 MBTI 的性格差异。
 */
import { MBTIType, MBTITheme } from '@/types';

export const MBTI_THEMES: Record<MBTIType, MBTITheme> = {
  INTJ: {
    colors: { bg: '#f6f3ee', card: '#fffaf2', accent: '#415a77', text: '#2f2a24', subtext: '#7d756c' },
    radius: '8px', avatar: '◈', name: '小策略',
    accentGrad: 'linear-gradient(135deg, #415a77, #778da9)',
  },
  INTP: {
    colors: { bg: '#f5f7f2', card: '#fffdf8', accent: '#6381a8', text: '#2d2f32', subtext: '#788077' },
    radius: '10px', avatar: '◇', name: '小逻辑',
    accentGrad: 'linear-gradient(135deg, #6381a8, #9db4cf)',
  },
  ENTJ: {
    colors: { bg: '#f3f5ef', card: '#fffdf7', accent: '#2f6f73', text: '#282c2b', subtext: '#707b78' },
    radius: '6px', avatar: '↗', name: '小队长',
    accentGrad: 'linear-gradient(135deg, #2f6f73, #73a9a7)',
  },
  ENTP: {
    colors: { bg: '#fbf4ef', card: '#fffaf5', accent: '#b56576', text: '#322926', subtext: '#84736d' },
    radius: '12px', avatar: '⌕', name: '小点子',
    accentGrad: 'linear-gradient(135deg, #b56576, #e6a4b4)',
  },
  INFJ: {
    colors: { bg: '#f7f3f7', card: '#fffafd', accent: '#8b6f9f', text: '#302a35', subtext: '#7d7283' },
    radius: '18px', avatar: '✦', name: '小洞察',
    accentGrad: 'linear-gradient(135deg, #8b6f9f, #c8b6d8)',
  },
  INFP: {
    colors: { bg: '#fbf4ee', card: '#fffaf5', accent: '#d88c6d', text: '#342b26', subtext: '#8a766d' },
    radius: '22px', avatar: '☾', name: '小暖',
    accentGrad: 'linear-gradient(135deg, #d88c6d, #f0c3a8)',
  },
  ENFJ: {
    colors: { bg: '#faf4ea', card: '#fffaf1', accent: '#c47f39', text: '#302820', subtext: '#837467' },
    radius: '18px', avatar: '✿', name: '小暖阳',
    accentGrad: 'linear-gradient(135deg, #c47f39, #e7b777)',
  },
  ENFP: {
    colors: { bg: '#fff7e8', card: '#fffdf5', accent: '#f0a426', text: '#31291c', subtext: '#867761' },
    radius: '22px', avatar: '☀', name: '小太阳',
    accentGrad: 'linear-gradient(135deg, #f0a426, #f7cf77)',
  },
  ISTJ: {
    colors: { bg: '#f3f5f0', card: '#fffdf8', accent: '#64748b', text: '#2a2d2f', subtext: '#747b7a' },
    radius: '8px', avatar: '▣', name: '小稳',
    accentGrad: 'linear-gradient(135deg, #64748b, #a7b2bd)',
  },
  ISFJ: {
    colors: { bg: '#f8f3f1', card: '#fffaf6', accent: '#a8798c', text: '#332b2c', subtext: '#847477' },
    radius: '18px', avatar: '◌', name: '小护',
    accentGrad: 'linear-gradient(135deg, #a8798c, #d8b5c1)',
  },
  ESTJ: {
    colors: { bg: '#f3f6ef', card: '#fffdf7', accent: '#5f7f44', text: '#2b3027', subtext: '#737b69' },
    radius: '6px', avatar: '✓', name: '小执行',
    accentGrad: 'linear-gradient(135deg, #5f7f44, #9eb47d)',
  },
  ESFJ: {
    colors: { bg: '#fff3ef', card: '#fffaf6', accent: '#cf7770', text: '#332826', subtext: '#86716c' },
    radius: '18px', avatar: '♡', name: '小贴心',
    accentGrad: 'linear-gradient(135deg, #cf7770, #efb1a8)',
  },
  ISTP: {
    colors: { bg: '#f1f6f2', card: '#fbfff9', accent: '#4f8a6b', text: '#25302b', subtext: '#6f7c73' },
    radius: '10px', avatar: '⌘', name: '小酷',
    accentGrad: 'linear-gradient(135deg, #4f8a6b, #95c2a8)',
  },
  ISFP: {
    colors: { bg: '#fff4ef', card: '#fffaf6', accent: '#d27d75', text: '#332a26', subtext: '#88746c' },
    radius: '22px', avatar: '◐', name: '小雅',
    accentGrad: 'linear-gradient(135deg, #d27d75, #f0b8ad)',
  },
  ESTP: {
    colors: { bg: '#fff6e9', card: '#fffdf7', accent: '#d89032', text: '#30291f', subtext: '#837668' },
    radius: '12px', avatar: '▶', name: '小冲',
    accentGrad: 'linear-gradient(135deg, #d89032, #efbf72)',
  },
  ESFP: {
    colors: { bg: '#fff8e8', card: '#fffdf4', accent: '#e8aa2d', text: '#30291c', subtext: '#857861' },
    radius: '22px', avatar: '✺', name: '小闪耀',
    accentGrad: 'linear-gradient(135deg, #e8aa2d, #f5d06f)',
  },
};

export const MBTI_TYPES: MBTIType[] = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];
