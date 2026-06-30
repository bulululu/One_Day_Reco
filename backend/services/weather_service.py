"""Realtime weather lookup with a no-key Open-Meteo backend."""

import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen


GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


WEATHER_CODE_LABELS = {
    0: "晴",
    1: "多云",
    2: "多云",
    3: "阴",
    45: "雾",
    48: "雾",
    51: "小雨",
    53: "小雨",
    55: "小雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    80: "阵雨",
    81: "阵雨",
    82: "大雨",
    95: "雷雨",
    96: "雷雨",
    99: "雷雨",
}


def _get_json(url: str, params: dict) -> dict:
    request = Request(
        f"{url}?{urlencode(params)}",
        headers={"User-Agent": "OneDayReco/0.1"},
    )
    with urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


def _normalize_location(location: str) -> str:
    return (location or "").replace("·", " ").replace("，", " ").strip()


def get_realtime_weather(location: str) -> dict:
    """Return weather text for an app-entered location."""
    query = _normalize_location(location)
    if not query:
        query = "上海"

    geo = _get_json(
        GEOCODING_URL,
        {
            "name": query,
            "count": 1,
            "language": "zh",
            "format": "json",
        },
    )
    results = geo.get("results") or []
    if not results and " " in query:
        geo = _get_json(
            GEOCODING_URL,
            {
                "name": query.split()[0],
                "count": 1,
                "language": "zh",
                "format": "json",
            },
        )
        results = geo.get("results") or []

    if not results:
        raise ValueError(f"找不到地点：{location}")

    place = results[0]
    forecast = _get_json(
        FORECAST_URL,
        {
            "latitude": place["latitude"],
            "longitude": place["longitude"],
            "current": "temperature_2m,weather_code",
            "timezone": "auto",
        },
    )
    current = forecast.get("current") or {}
    code = int(current.get("weather_code", 3))
    temperature = current.get("temperature_2m")
    label = WEATHER_CODE_LABELS.get(code, "多云")
    temp_text = f"{round(float(temperature))}°C" if temperature is not None else ""
    display = f"{label} · {temp_text}" if temp_text else label

    return {
        "location": place.get("name") or location,
        "country": place.get("country") or "",
        "latitude": place.get("latitude"),
        "longitude": place.get("longitude"),
        "weather": label,
        "temperature": temperature,
        "display": display,
        "source": "Open-Meteo",
    }
