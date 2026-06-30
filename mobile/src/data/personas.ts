/**
 * MBTI 人格设定映射（16 种）
 * 从前端 index.html mbtiPersonaMap 迁移
 * 每种类型的快捷操作、状态文字、输入框占位符
 */
import { MBTIType, MBTIPersona } from '@/types';

export const MBTI_PERSONAS: Record<MBTIType, MBTIPersona> = {
  INTJ: {
    quickActions: ['推荐活动', '安排今晚', '换方案', '查路线'],
    status: '待命中',
    placeholder: '直接说…',
  },
  INTP: {
    quickActions: ['推荐个活动', '换个推荐', '随便看看', '安静的'],
    status: '在线',
    placeholder: '说点什么…',
  },
  ENTJ: {
    quickActions: ['推荐活动', '安排今晚', '换方案', '查路线'],
    status: '待命中',
    placeholder: '直接说…',
  },
  ENTP: {
    quickActions: ['推荐活动', '有什么好玩的', '换一个', '来点新鲜的'],
    status: '在线',
    placeholder: '聊点什么…',
  },
  INFJ: {
    quickActions: ['推荐个活动', '不想出门', '换个推荐', '安静一点的'],
    status: '在线',
    placeholder: '跟搭子聊聊…',
  },
  INFP: {
    quickActions: ['推荐个活动', '不想出门', '换个推荐', '安静一点的'],
    status: '在线',
    placeholder: '跟搭子聊聊…',
  },
  ENFJ: {
    quickActions: ['推荐活动', '安排今晚', '换个推荐', '社交类的'],
    status: '在线',
    placeholder: '跟我说说…',
  },
  ENFP: {
    quickActions: ['推荐个活动', '有什么好玩的', '换一个', '来点新鲜的'],
    status: '在线',
    placeholder: '跟我聊聊…',
  },
  ISTJ: {
    quickActions: ['推荐活动', '安排今晚', '换方案', '查路线'],
    status: '待命中',
    placeholder: '直接说…',
  },
  ISFJ: {
    quickActions: ['推荐个活动', '不想出门', '换个推荐', '安静一点的'],
    status: '在线',
    placeholder: '跟我说说…',
  },
  ESTJ: {
    quickActions: ['推荐活动', '安排今晚', '换方案', '查路线'],
    status: '待命中',
    placeholder: '直接说…',
  },
  ESFJ: {
    quickActions: ['推荐活动', '有什么好玩的', '换个推荐', '社交类的'],
    status: '在线',
    placeholder: '跟我说说…',
  },
  ISTP: {
    quickActions: ['推荐个活动', '换个推荐', '随便看看', '安静的'],
    status: '在线',
    placeholder: '说点什么…',
  },
  ISFP: {
    quickActions: ['推荐个活动', '不想出门', '换个推荐', '安静一点的'],
    status: '在线',
    placeholder: '跟搭子聊聊…',
  },
  ESTP: {
    quickActions: ['推荐活动', '有什么好玩的', '换一个', '来点新鲜的'],
    status: '在线',
    placeholder: '聊点什么…',
  },
  ESFP: {
    quickActions: ['推荐个活动', '有什么好玩的', '换一个', '来点新鲜的'],
    status: '在线',
    placeholder: '跟我聊聊…',
  },
};
