from typing import Optional

from fastapi import APIRouter

from backend.services.place_service import search_places


router = APIRouter(prefix="/api", tags=["places"])


@router.get("/places/search")
async def search_place_candidates(
    q: str,
    location: str = "",
    city: str = "",
    limit: int = 5,
    types: Optional[str] = None,
):
    return search_places(q, location=location, city=city, limit=limit, types=types)
