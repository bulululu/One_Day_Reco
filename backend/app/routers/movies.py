from fastapi import APIRouter

from backend.services.movie_service import get_movie_candidates


router = APIRouter(prefix="/api", tags=["movies"])


@router.get("/movies/nearby")
async def nearby_movies(location: str = "", region: str = "CN", limit: int = 5):
    return get_movie_candidates(location=location, region=region, limit=limit)
