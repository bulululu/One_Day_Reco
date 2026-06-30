# 屏幕使用时间触发机制

## 产品目标

当用户连续刷短视频、小红书或玩游戏时间过长时，OneDayReco 主动给出一个“从屏幕里出来”的推荐。优先推荐短时、低门槛、低人群密度户外活动；如果天气、时间或安全条件不适合户外，则推荐室内离屏活动。

## 当前已实现

- 后端接口：`POST /api/trigger`
- Agent 已识别 `screen_overuse` 触发类型
- 天气和时间安全时，候选活动优先排序到户外、低能耗、低/中人群密度活动
- 前端 API：`triggerRecommendation(...)`
- 前端 MVP 入口：主屏“离开屏幕一会儿”面板，可手动选择短视频、小红书、游戏场景触发替代推荐
- 触发推荐会进入推荐历史，后续可继续用于偏好学习

请求示例：

```json
{
  "user_profile": {
    "user_id": "user_1",
    "mbti": "INFP",
    "preferences": {
      "social_frequency": "独处充电",
      "budget": "低预算",
      "commute_tolerance": "30分钟内",
      "notes": "喜欢安静小众的体验"
    },
    "feedback_summary": ""
  },
  "app_name": "抖音",
  "app_category": "short_video",
  "usage_minutes": 90,
  "continuous_minutes": 45,
  "context": {
    "weather": "晴 · 26°C",
    "location": "上海 · 徐汇区",
    "mode": "个人"
  }
}
```

## React Native 原生接入方案

### iOS

iOS 不能用普通 JS 直接读取全局屏幕使用时间。需要使用 Apple FamilyControls / DeviceActivity / ManagedSettings，并要求用户授权。

实现路线：

1. 增加原生 iOS module。
2. 请求 FamilyControls 授权。
3. 用户选择要监控的 App 类别或 App。
4. 用 DeviceActivityMonitor 监听阈值。
5. 阈值触发后通知 React Native，调用 `/api/trigger`。

限制：

- 需要真机。
- 需要 Apple Developer 能力和 entitlements。
- App Store 审核需要清楚解释用途。

### Android

Android 可用 UsageStatsManager，但需要用户手动开启 Usage Access 权限。

实现路线：

1. 增加原生 Android module。
2. 引导用户打开 Usage Access 设置页。
3. 定时读取 UsageStatsManager。
4. 计算连续使用时长和当天累计时长。
5. 超过阈值后调用 `/api/trigger`。

## MVP 阈值建议

- 短视频/社交媒体：连续 35 分钟或当天累计 90 分钟。
- 游戏：连续 60 分钟或当天累计 150 分钟。
- 夜间 20:00 后：不强推远途户外，优先推室内离屏活动或楼下短走。

## 下一步

1. 加一个 RN `screenTime` service 抽象层。
2. iOS/Android 分别实现原生模块。
3. 设置页增加“屏幕时间提醒”开关和阈值。
4. 真机验证权限流程和触发回调。
5. 把当前手动触发面板作为无权限兜底入口保留。
