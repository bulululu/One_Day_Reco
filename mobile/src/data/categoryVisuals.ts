/**
 * 活动分类视觉映射
 * 从前端 index.html categoryVisuals 迁移
 */
import { CategoryVisual } from '@/types';

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  '文化娱乐': { gradient: ['#667eea', '#764ba2'], emoji: '🎬' },
  '户外自然': { gradient: ['#11998e', '#38ef7d'], emoji: '🌿' },
  '居家休闲': { gradient: ['#f6d365', '#fda085'], emoji: '🏠' },
  '社交聚会': { gradient: ['#ff6e7f', '#bfe9ff'], emoji: '🎉' },
  '运动健身': { gradient: ['#fa709a', '#fee140'], emoji: '💪' },
  '学习提升': { gradient: ['#a18cd1', '#fbc2eb'], emoji: '📚' },
  '创意手工': { gradient: ['#ff9a9e', '#fecfef'], emoji: '🎨' },
  '城市探索': { gradient: ['#f093fb', '#f5576c'], emoji: '🗺️' },
};
