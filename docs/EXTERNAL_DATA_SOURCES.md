# 外部数据源接入规划

## 目标

推荐必须具体到可以直接执行。外部数据源不是为了做点评平台，而是为了补齐“下一步去哪、几点、多少钱、评价如何”。

活动列表、游戏列表、灵感卡列表必须从后端 API 获取。后端可以在开发阶段使用本地精选库兜底，但响应必须标明 `source=local_fallback`，不能把它包装成实时事实。

## 0. 活动和游戏聚合 API

用途：

- 提供活动清单、游戏清单、灵感卡候选。
- 覆盖“任何地点、任何时间可以做什么”的基础候选池。
- 游戏活动必须包含游戏名称、平台、类型、单人/多人、预计时长。

当前接口：

- `GET /api/activities`
- `GET /api/activities/games`

后端环境变量：

```bash
ONEDAYRECO_ACTIVITY_API_URL=
ONEDAYRECO_GAME_API_URL=
```

约束：

- 有外部 API 时优先使用外部 API，返回 `source=external_api`、`is_realtime=true`。
- 没有外部 API 或接口失败时，才使用本地精选库，返回 `source=local_fallback`、`is_realtime=false`。
- 前端不能硬编码活动和游戏列表，只能展示接口返回的数据。

## 数据源优先级

### 1. 地图和地点详情

用途：

- 餐厅、咖啡馆、公园、展馆、运动场馆的名称、地址、距离、营业时间。
- 路线和预计通勤时间。

候选：

- 高德地图 Web Service API
- 百度地图 API

需要配置：

```bash
AMAP_API_KEY=
BAIDU_MAP_API_KEY=
```

MVP 策略：

- 没有 key 时，后端返回明确搜索 URL 和筛选建议。
- 有 key 后，推荐卡显示真实地点、距离、营业状态和路线入口。

当前已接入：

- `GET /api/places/search?q=咖啡馆&location=上海`
- 环境变量：`AMAP_API_KEY`
- 无 key 时返回 `source=search_fallback`，不返回伪造 POI。

### 2. 电影和演出

用途：

- 电影名称、影院、场次、片长、评分、票价入口。
- 演出名称、场馆、票价、时间。

候选：

- 猫眼 / 美团开放能力
- 大麦开放能力

需要配置：

```bash
MAOYAN_API_KEY=
MEITUAN_API_KEY=
DAMAI_API_KEY=
```

MVP 策略：

- 没有正式 API 时，不编造实时场次。
- 推荐给出片名、片长、评分参考和“打开猫眼搜片名，按最近影院和时间筛选”的路径。

当前已接入：

- `GET /api/movies/nearby?location=上海徐汇&limit=5`
- 环境变量：`TMDB_API_KEY`
- 有 `TMDB_API_KEY` 时返回 TMDb 热映电影候选；影院候选来自高德地点接口。
- 未接入猫眼/美团正式排片 API 前，`showtime_realtime=false`，只返回猫眼确认入口，不伪造场次和票价。

### 3. B 站内容搜索

用途：

- 纪录片、公开课、视频内容的标题、时长、搜索词。

候选：

- B 站开放平台或搜索接口能力

需要配置：

```bash
BILIBILI_API_KEY=
```

MVP 策略：

- 先用搜索 URL 和精选片单。
- 推荐必须包含具体片名、搜索词、预计时长。

当前已接入：

- `GET /api/content/search?q=纪录片&limit=5`
- 优先尝试 B 站公开搜索结果；失败时返回精选片单和 B 站搜索入口。
- 响应包含 `source/is_realtime`，前端可以显示“实时/精选”状态。

### 4. 天气

已接入：

- Open-Meteo，无需 key。

后续可替换：

- 和风天气
- 高德天气

需要配置：

```bash
QWEATHER_API_KEY=
```

## 后端接口目标

```text
backend/services/
  place_service.py      # 地点、餐厅、路线
  movie_service.py      # 电影、影院、场次
  content_service.py    # B站、纪录片、视频
  weather_service.py    # 天气
```

推荐 Agent 不直接调用第三方 API。它只接收聚合后的结构化候选信息，避免 prompt 里混入平台细节。

## 当前决策

在没有正式 API key 前，不做“伪实时”。可以给搜索路径，但不能把实时场次、排队情况、票价写死成事实。
