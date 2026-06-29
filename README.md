# OneDayReco - 基于 MBTI 的每日活动推荐

> 基于大模型 Agent 能力，结合 MBTI 人格画像，为每个人推荐"适合今天"的活动，并到点提醒。

## 快速开始

### 1. 安装依赖

```bash
pip install fastapi uvicorn pydantic openai pyyaml
```

### 2. 启动后端

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### 3. 打开前端

用浏览器打开 `frontend/src/pages/index.html`

### 4. 使用流程

1. 选择你的 MBTI 类型
2. 填写社交偏好、预算等
3. 点击"获取今日推荐"
4. 查看推荐结果，点"喜欢/去完成/跳过"给反馈

## 项目结构

```
One_Day_Reco/
├── backend/
│   ├── agents/
│   │   └── recommendation_agent.py   # 推荐Agent核心
│   ├── app/
│   │   └── main.py                    # FastAPI 后端
│   └── data/
│       └── activities.json            # 活动种子数据(40条)
├── config/
│   ├── settings.yaml                  # 应用配置
│   └── mbti_mapping.yaml              # MBTI维度映射
├── frontend/
│   └── src/pages/
│       └── index.html                 # Web前端
├── docs/
│   └── PROJECT_GOALS.md               # 项目目标文档
└── README.md
```

## 技术栈

- **后端**: Python + FastAPI
- **LLM**: Azure OpenAI (GPT-5.3)
- **前端**: 原生 HTML/CSS/JS（后续可迁移 React/React Native）
- **数据**: JSON 文件存储（MVP阶段，后续可迁移数据库）

## GPT API 配置

配置文件在 `config/settings.yaml`。

- **办公网络**: 使用 `tiktok-row.net` 域名
- **非办公网络**: 使用 `byteintl.net` 域名

## 活动数据说明

当前 40 条种子数据覆盖 8 大类：
- 文化娱乐（电影、展览、演出、阅读）
- 户外自然（公园、徒步、骑行、观星）
- 居家休闲（烹饪、观影、手工、冥想）
- 社交聚会（桌游、下午茶、密室）
- 运动健身（瑜伽、游泳、攀岩、跑步）
- 学习提升（在线课程、写作、读书）
- 创意手工（陶艺、绘画、摄影）
- 城市探索（City Walk、老街、市集）

每条活动标注：人群密度、社交强度、能耗、室内外、时长、预算、计划性、MBTI友好度、可调节因素、情绪效果。

## 后续迭代

- [ ] 接入实时天气 API
- [ ] 活动库扩展 + 外部数据源（美团/大众点评）
- [ ] 定时提醒服务
- [ ] 用户偏好记忆持久化
- [ ] 迁移 React Native 原生 App
