# OneDayReco

OneDayReco 是一个“任何地点、任何时间，帮你直接决定现在做什么”的个性化活动推荐 App。

核心原则：

- 推荐必须具体、可执行，不给泛泛建议。
- 活动、游戏、电影、地点、内容候选优先来自后端 API。
- 无实时数据时只显示明确兜底或搜索入口，不伪造排片、评分、排队和地点。
- 默认交互保持简单：一张推荐卡、一个行动按钮、反馈和聊天输入。

## 本地启动

### 1. 后端

```bash
pip install -r requirements.txt
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

使用真实接口时可配置：

```bash
export AMAP_API_KEY=...
export TMDB_API_KEY=...
export ONEDAYRECO_ACTIVITY_API_URL=...
export ONEDAYRECO_GAME_API_URL=...
```

### 2. 移动端 / Web 预览

```bash
cd mobile
npm install
npx expo start --web --port 8081
```

浏览器预览：

```text
http://localhost:8081
```

手机 Expo Go 预览：

1. 手机和电脑连同一个网络。
2. 后端必须用 `--host 0.0.0.0` 启动。
3. 扫 Expo 终端二维码。

前端开发环境会自动从 Expo 的 `hostUri` 推导 API 地址，例如：

```text
http://<电脑局域网 IP>:8000
```

如需手动指定：

```bash
cd mobile
EXPO_PUBLIC_API_BASE=http://192.168.1.10:8000 npx expo start
```

## 当前 API

- `POST /api/recommend`
- `POST /api/chat`
- `POST /api/trigger`
- `POST /api/feedback`
- `POST /api/activity-events`
- `GET /api/recommendations/history`
- `GET /api/activities`
- `GET /api/activities/games`
- `GET /api/places/search`
- `GET /api/movies/nearby`
- `GET /api/content/search`
- `GET /api/weather`
- `GET /api/config/status`

## 验证

```bash
cd mobile && npx tsc --noEmit
```

```bash
PYTHONPYCACHEPREFIX=/private/tmp/onedayreco_pycache python3 scripts/check_chat_endpoint.py
PYTHONPYCACHEPREFIX=/private/tmp/onedayreco_pycache python3 scripts/check_media_sources.py
PYTHONPYCACHEPREFIX=/private/tmp/onedayreco_pycache python3 scripts/check_config_status.py
PYTHONPYCACHEPREFIX=/private/tmp/onedayreco_pycache python3 scripts/check_recommendation_dedupe.py
```

## 目录

```text
backend/    FastAPI API、推荐 Agent、外部数据服务、SQLite/PostgreSQL 模型
mobile/     Expo React Native App
docs/       架构、外部数据源、屏幕触发、路线图
scripts/    回归检查脚本
```
