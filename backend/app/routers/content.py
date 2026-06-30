from fastapi import APIRouter

from backend.services.content_service import search_content


router = APIRouter(prefix="/api", tags=["content"])


@router.get("/content/search")
async def content_search(q: str = "纪录片", limit: int = 5):
    return search_content(q=q, limit=limit)
