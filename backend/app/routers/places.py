from typing import Optional

from fastapi import APIRouter

from backend.services.place_service import get_route, search_nearby_places, search_places


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


@router.get("/places/nearby")
async def search_nearby_place_candidates(
    q: str,
    longitude: float,
    latitude: float,
    radius: int = 3000,
    limit: int = 5,
    types: Optional[str] = None,
):
    return search_nearby_places(q, longitude=longitude, latitude=latitude, radius=radius, limit=limit, types=types)


@router.get("/places/route")
async def route_between_places(origin: str, destination: str, mode: str = "walking", city: str = ""):
    return get_route(origin=origin, destination=destination, mode=mode, city=city)
