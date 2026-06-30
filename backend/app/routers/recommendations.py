from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.dependencies import agent
from backend.app.schemas import ActivityEventRequest, ChatRequest, RecommendRequest, TriggerRequest
from backend.services.database import get_db
from backend.services.feedback_service import hydrate_profile_feedback
from backend.services.recommendation_history_service import (
    hydrate_profile_behavior_memory,
    list_activity_events,
    list_recommendation_history,
    record_activity_event,
    record_recommendation,
)


router = APIRouter(prefix="/api", tags=["recommendations"])


def _hydrate_user_profile(db: Session, user_profile: dict) -> dict:
    hydrated = hydrate_profile_feedback(db, user_profile)
    return hydrate_profile_behavior_memory(db, hydrated)


@router.post("/recommend")
async def recommend(req: RecommendRequest, db: Session = Depends(get_db)):
    user_profile = _hydrate_user_profile(db, req.user_profile.model_dump())
    result = agent.recommend(user_profile, req.context)
    record_recommendation(db, user_profile.get("user_id", ""), result, req.context, "recommend")
    return result


@router.post("/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    history_list = None
    if req.history:
        history_list = [{"role": m.role, "content": m.content} for m in req.history]
    user_profile = _hydrate_user_profile(db, req.user_profile.model_dump())
    result = agent.chat(
        user_profile,
        req.message,
        req.context,
        history_list,
    )
    if result.get("recommendations"):
        record_recommendation(db, user_profile.get("user_id", ""), result, req.context, "chat")
    return result


@router.post("/trigger")
async def trigger(req: TriggerRequest, db: Session = Depends(get_db)):
    user_profile = _hydrate_user_profile(db, req.user_profile.model_dump())
    result = agent.trigger_recommend(
        user_profile,
        {
            "app_name": req.app_name,
            "app_category": req.app_category,
            "usage_minutes": req.usage_minutes,
            "continuous_minutes": req.continuous_minutes or req.usage_minutes,
        },
        req.context,
    )
    record_recommendation(db, user_profile.get("user_id", ""), result, req.context, "trigger")
    return result


@router.post("/activity-events")
async def activity_event(req: ActivityEventRequest, db: Session = Depends(get_db)):
    event = record_activity_event(
        db,
        req.user_id,
        req.activity_id,
        req.event_type,
        activity_name=req.activity_name,
        source=req.source,
        metadata=req.metadata,
    )
    return {"status": "ok", "event_id": event.id}


@router.get("/recommendations/history")
async def recommendation_history(user_id: str, limit: int = 20, db: Session = Depends(get_db)):
    return {"history": list_recommendation_history(db, user_id, limit)}


@router.get("/activity-events")
async def activity_events(user_id: str, limit: int = 50, db: Session = Depends(get_db)):
    return {"events": list_activity_events(db, user_id, limit)}
