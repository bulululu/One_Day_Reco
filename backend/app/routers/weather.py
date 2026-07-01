from fastapi import APIRouter

from backend.app.schemas import WeatherResponse
from backend.services.weather_service import get_realtime_weather


router = APIRouter(prefix="/api", tags=["weather"])


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(location: str):
    try:
        return get_realtime_weather(location)
    except Exception:
        return {
            "location": location,
            "country": "",
            "weather": "天气未获取",
            "temperature": None,
            "display": "天气未获取",
            "source": "weather_fallback",
        }
