from typing import Optional

from fastapi import APIRouter

from backend.app.dependencies import agent
from backend.services.activity_service import get_activity_catalog, get_game_catalog


router = APIRouter(prefix="/api", tags=["activities"])


@router.get("/activities")
async def get_activities(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    q: Optional[str] = None,
    limit: Optional[int] = None,
):
    return get_activity_catalog(agent.activities, category, subcategory, q, limit)


@router.get("/activities/games")
async def get_game_activities(limit: Optional[int] = None):
    return get_game_catalog(agent.activities, limit)


@router.get("/categories")
async def get_categories():
    categories = list(set(a["category"] for a in agent.activities))
    return {"categories": categories}
