from fastapi import APIRouter, HTTPException

from backend.app.schemas import WeatherResponse
from backend.services.weather_service import get_realtime_weather


router = APIRouter(prefix="/api", tags=["weather"])


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(location: str):
    try:
        return get_realtime_weather(location)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
