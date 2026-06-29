"""
FastAPI 后端主应用
提供活动推荐 API 接口 + 对话接口
v0.2: 新增 /api/chat 对话端点
"""

import os
import sys
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 添加项目根目录到路径
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)

from backend.agents.recommendation_agent import RecommendationAgent

app = FastAPI(
    title="OneDayReco API",
    description="基于 MBTI 的每日活动推荐服务",
    version="0.2.0",
)

# CORS 配置（允许前端跨域）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化 Agent
agent = RecommendationAgent()


# ==================== 数据模型 ====================

class UserProfile(BaseModel):
    user_id: str
    mbti: str
    preferences: dict = {}
    feedback_summary: str = ""


class RecommendRequest(BaseModel):
    user_profile: UserProfile
    context: Optional[dict] = None


class ChatMessage(BaseModel):
    role: str  # "user" / "assistant"
    content: str


class ChatRequest(BaseModel):
    user_profile: UserProfile
    message: str
    context: Optional[dict] = None
    history: Optional[List[ChatMessage]] = None


class FeedbackRequest(BaseModel):
    user_id: str
    activity_id: str
    feedback: str  # liked / disliked / completed / skipped


# ==================== API 接口 ====================

@app.get("/")
async def root():
    return {"message": "OneDayReco API is running", "version": "0.2.0"}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "activities_count": len(agent.activities),
        "llm_available": agent.client is not None,
    }


@app.get("/api/activities")
async def get_activities(category: Optional[str] = None):
    """获取活动列表，可按类别筛选"""
    activities = agent.activities
    if category:
        activities = [a for a in activities if a["category"] == category]
    return {"count": len(activities), "activities": activities}


@app.get("/api/categories")
async def get_categories():
    """获取所有活动类别"""
    categories = list(set(a["category"] for a in agent.activities))
    return {"categories": categories}


@app.post("/api/recommend")
async def recommend(req: RecommendRequest):
    """生成每日活动推荐"""
    result = agent.recommend(req.user_profile.model_dump(), req.context)
    return result


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """与互动仔对话"""
    history_list = None
    if req.history:
        history_list = [{"role": m.role, "content": m.content} for m in req.history]
    result = agent.chat(
        req.user_profile.model_dump(),
        req.message,
        req.context,
        history_list,
    )
    return result


@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    """提交活动反馈"""
    agent.update_feedback(req.user_id, req.activity_id, req.feedback)
    return {"status": "ok", "message": "反馈已记录"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
