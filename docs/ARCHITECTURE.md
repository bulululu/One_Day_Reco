# OneDayReco 架构规划

> 目标：把 OneDayReco 做成一个可直接使用的移动 App，而不是功能 Demo。

## 1. 产品边界

OneDayReco 的核心是“今天适合我做什么”的决策助手。

它不是点评平台、票务平台、团购平台，也不是 MBTI 测试工具。外部平台只负责提供可执行入口，例如地图、B 站、猫眼、美团；OneDayReco 负责理解用户状态、选择方向、组织计划和持续学习偏好。

## 2. 前后端分层

### 前端：React Native App

职责：

- 完成 onboarding、MBTI/偏好确认、未知 MBTI 轻问答。
- 呈现 MBTI 主题化 UI、推荐卡片、聊天、反馈、设置。
- 获取用户输入的地点、预算、通勤、模式等上下文。
- 调用后端 API，不直接持有推荐规则和外部服务密钥。
- 本地缓存登录态、用户画像、最近消息和最近推荐。
- 活动列表、游戏列表、灵感卡列表必须通过后端 API 获取；前端不维护活动/游戏清单。

不做：

- 不在前端写推荐排序规则。
- 不在前端直连需要密钥的第三方服务。
- 不把活动库、游戏库、电影列表、餐厅列表硬编码成主要数据源。

### 后端：FastAPI API

职责：

- 用户认证、用户画像、反馈、推荐历史的持久化。
- 推荐 Agent 编排：用户画像 + 行为记忆 + 天气 + 时间 + 活动库 + LLM。
- 天气、活动数据、推送等外部服务代理。
- 活动库管理和候选活动预筛选。
- 对前端提供稳定 API contract。
- 活动/游戏列表优先来自外部 API；本地 JSON 只能作为无 key、断网或开发环境兜底，并且接口必须返回 `source` / `is_realtime` 让前端知道真实性等级。

### 数据库：SQLite/PostgreSQL

本地开发默认 SQLite，部署环境使用 PostgreSQL。

数据库承载：

- 用户账号和认证信息。
- MBTI、偏好、上下文设置。
- 反馈摘要、活动反馈明细。
- 推荐历史、点击行为、跳过行为、完成行为，并生成下一次推荐可用的行为记忆。
- 推送 token 和提醒配置。

## 3. 模块结构目标

```text
backend/
  app/
    main.py              # FastAPI app wiring
    routers/
      auth.py
      users.py
      recommendations.py
      weather.py
      feedback.py
      push.py
  agents/
    recommendation_agent.py
  services/
    auth_service.py
    database.py
    models.py
    weather_service.py
    activity_service.py
    feedback_service.py
    push_service.py
  data/
    activities.json

mobile/
  src/
    components/
      recommendation/
      chat/
      onboarding/
      controls/
    screens/
      OnboardingScreen.tsx
      ChatScreen.tsx
      AuthScreen.tsx
      SettingsScreen.tsx
    services/
      api.ts
      authStorage.ts
    store/
      appStore.ts
    data/
      themes.ts
      personas.ts
```

当前后端已开始按 router/service 拆分：认证、活动、推荐、天气、反馈已独立 router；用户设置、推送、推荐历史仍待继续拆分和补齐。

## 4. API Contract

### 认证

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### 推荐

- `POST /api/recommend`
- `POST /api/chat`
- `POST /api/feedback`
- `POST /api/activity-events`
- `GET /api/recommendations/history`
- `GET /api/activity-events`
- `GET /api/config/status`
- `GET /api/activities`
- `GET /api/activities/games`
- `GET /api/places/search?q=咖啡馆&location=上海`
- `GET /api/movies/nearby?location=上海徐汇`
- `GET /api/content/search?q=纪录片`

响应包含：

```json
{
  "count": 12,
  "source": "external_api",
  "is_realtime": true,
  "activities": []
}
```

`source=local_fallback` 只能说明当前是精选兜底，不代表实时数据。

`POST /api/recommend` 和 `POST /api/chat` 同样会返回 `activity_source`，用于标记本次推荐实际使用的候选来源：

```json
{
  "activity_source": {
    "source": "external_api",
    "is_realtime": true,
    "total_count": 20,
    "candidate_count": 8
  }
}
```

后端会在调用 Agent 前读取最近的推荐历史和活动事件，形成 `behavior_memory` 注入用户画像。规则层会避开近期明确跳过的活动、延后刚曝光但没有正反馈的活动；Prompt 层会让模型自然利用近期喜欢/完成/点击记录，不需要前端写推荐排序逻辑。

### 上下文

- `GET /api/weather?location=上海`

### 地点

`GET /api/places/search` 通过高德 Web Service 返回真实 POI。未配置 `AMAP_API_KEY` 时返回 `source=search_fallback` 和高德搜索 URL，不返回假地点。

### 电影和视频内容

`GET /api/movies/nearby` 通过 TMDb 获取热映电影候选，并通过高德补附近影院候选。未配置 `TMDB_API_KEY` 时返回精选兜底片单；未接入猫眼/美团正式排片 API 前，接口必须返回 `showtime_realtime=false`，只提供票务平台确认入口。

`GET /api/content/search` 优先尝试 B 站搜索公开结果，失败时返回精选内容和 B 站搜索入口。前端只展示接口返回结果，不硬编码视频清单。

### 配置状态

`GET /api/config/status` 返回 LLM、天气、地点、活动、游戏、电影、视频内容、数据库的配置状态。接口只返回 `configured/is_realtime/source/detail`，不泄露任何 key。

### 后续

- `GET /api/users/me/profile`
- `PUT /api/users/me/profile`
- `POST /api/push/register`
- `POST /api/push/test`

## 5. 第三方服务策略

### 已接入

- Open-Meteo：实时天气，无需 key，适合作为 MVP 默认天气源。
- Azure OpenAI：推荐和聊天 Agent。
- 高德地图 Web Service：通过 `AMAP_API_KEY` 获取 POI；未配置时只提供搜索入口，不伪造地点。

### 待接入

- PostgreSQL：通过 `DATABASE_URL` 切换。
- Expo Push Notifications：移动端推送。
- 票务/内容平台：先用深链和搜索 URL，不在 MVP 阶段强依赖正式商业 API。
- 活动/游戏聚合 API：通过 `ONEDAYRECO_ACTIVITY_API_URL`、`ONEDAYRECO_GAME_API_URL` 接入；正式上线前必须替换本地 JSON 主数据源。

## 6. 设计原则

- UI 优先，但 UI 必须服务“少做决策”的核心目标。
- 推荐结果必须具体可执行。
- MBTI 影响主题、语气和排序，但不显性分析用户。
- 家庭、情侣、朋友是模式入口，不是默认产品定位。
- 反馈必须进入下一次推荐，而不是只作为按钮状态。
