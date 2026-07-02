import json
import os
from typing import Optional
from urllib.error import URLError
from urllib.parse import urlencode, quote
from urllib.request import urlopen

from backend.services.env import load_env_file


load_env_file()

AMAP_TEXT_URL = "https://restapi.amap.com/v3/place/text"
AMAP_AROUND_URL = "https://restapi.amap.com/v3/place/around"
AMAP_WEATHER_URL = "https://restapi.amap.com/v3/weather/weatherInfo"
AMAP_ROUTE_URLS = {
    "walking": "https://restapi.amap.com/v3/direction/walking",
    "driving": "https://restapi.amap.com/v3/direction/driving",
    "transit": "https://restapi.amap.com/v3/direction/transit/integrated",
}


def _amap_key() -> str:
    return os.getenv("AMAP_API_KEY", "").strip()


def _normalize_location(location: str) -> str:
    return (location or "").replace("·", " ").replace("，", " ").strip()


def _fallback_response(query: str, location: str, reason: str) -> dict:
    normalized_location = _normalize_location(location)
    search_text = f"{normalized_location} {query}".strip()
    return {
        "query": query,
        "location": normalized_location,
        "source": "search_fallback",
        "configured": False,
        "is_realtime": False,
        "reason": reason,
        "search_url": f"https://ditu.amap.com/search?query={quote(search_text)}",
        "places": [],
    }


def _amap_get(url: str, params: dict, timeout: int = 4) -> dict:
    with urlopen(f"{url}?{urlencode(params)}", timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _format_distance(value: object) -> str:
    if value in (None, "", []):
        return ""
    try:
        meters = int(float(value))
    except (TypeError, ValueError):
        return str(value)
    if meters >= 1000:
        return f"{meters / 1000:.1f} km"
    return f"{meters} m"


def _normalize_poi(poi: dict) -> dict:
    return {
        "id": str(poi.get("id") or ""),
        "name": str(poi.get("name") or ""),
        "address": str(poi.get("address") or ""),
        "type": str(poi.get("type") or ""),
        "typecode": str(poi.get("typecode") or ""),
        "location": str(poi.get("location") or ""),
        "distance": _format_distance(poi.get("distance")),
        "tel": str(poi.get("tel") or ""),
        "business_area": str(poi.get("business_area") or ""),
        "pname": str(poi.get("pname") or ""),
        "cityname": str(poi.get("cityname") or ""),
        "adname": str(poi.get("adname") or ""),
        "source": "AMap",
    }


def search_places(
    query: str,
    location: str = "",
    city: str = "",
    limit: int = 5,
    types: Optional[str] = None,
) -> dict:
    """Search real POIs through AMap when configured; otherwise return a non-fake search fallback."""
    clean_query = (query or "").strip()
    if not clean_query:
        return _fallback_response(query, location, "empty_query")

    key = _amap_key()
    if not key:
        return _fallback_response(clean_query, location, "missing_amap_api_key")

    params = {
        "key": key,
        "keywords": clean_query,
        "offset": max(1, min(limit, 20)),
        "page": 1,
        "extensions": "base",
        "citylimit": "false",
        "output": "json",
    }
    normalized_location = _normalize_location(location)
    if city or normalized_location:
        params["city"] = city or normalized_location.split()[0]
    if types:
        params["types"] = types

    try:
        payload = _amap_get(AMAP_TEXT_URL, params)
    except (OSError, URLError, TimeoutError, json.JSONDecodeError):
        fallback = _fallback_response(clean_query, location, "amap_request_failed")
        fallback["configured"] = True
        return fallback

    if payload.get("status") != "1":
        fallback = _fallback_response(clean_query, location, payload.get("info") or "amap_error")
        fallback["configured"] = True
        return fallback

    pois = payload.get("pois") or []
    places = [_normalize_poi(poi) for poi in pois if poi.get("id") and poi.get("name")]
    return {
        "query": clean_query,
        "location": normalized_location,
        "source": "AMap",
        "configured": True,
        "is_realtime": True,
        "count": len(places),
        "places": places,
    }


def search_nearby_places(
    query: str,
    longitude: float,
    latitude: float,
    radius: int = 3000,
    limit: int = 5,
    types: Optional[str] = None,
) -> dict:
    clean_query = (query or "").strip()
    key = _amap_key()
    if not key:
        return _fallback_response(clean_query, f"{longitude},{latitude}", "missing_amap_api_key")

    params = {
        "key": key,
        "location": f"{longitude},{latitude}",
        "keywords": clean_query,
        "radius": max(100, min(radius, 50000)),
        "offset": max(1, min(limit, 20)),
        "page": 1,
        "extensions": "base",
        "output": "json",
    }
    if types:
        params["types"] = types

    try:
        payload = _amap_get(AMAP_AROUND_URL, params)
    except (OSError, URLError, TimeoutError, json.JSONDecodeError):
        fallback = _fallback_response(clean_query, f"{longitude},{latitude}", "amap_request_failed")
        fallback["configured"] = True
        return fallback

    if payload.get("status") != "1":
        fallback = _fallback_response(clean_query, f"{longitude},{latitude}", payload.get("info") or "amap_error")
        fallback["configured"] = True
        return fallback

    places = [_normalize_poi(poi) for poi in (payload.get("pois") or []) if poi.get("id") and poi.get("name")]
    return {
        "query": clean_query,
        "location": f"{longitude},{latitude}",
        "source": "AMap",
        "configured": True,
        "is_realtime": True,
        "count": len(places),
        "places": places,
    }


def get_amap_weather(city: str) -> dict:
    key = _amap_key()
    clean_city = _normalize_location(city) or "上海"
    if not key:
        raise ValueError("missing_amap_api_key")

    # ponytail: AMap accepts city/adcode; caller can pass district adcode later if precision matters.
    query_city = clean_city.split()[-1]
    if query_city and query_city not in {"北京", "上海", "天津", "重庆"} and not query_city.endswith(("市", "区", "县")) and len(query_city) <= 3:
        query_city = f"{query_city}区"

    payload = _amap_get(
        AMAP_WEATHER_URL,
        {"key": key, "city": query_city, "extensions": "base", "output": "json"},
    )
    lives = payload.get("lives") or []
    if payload.get("status") != "1" or not lives:
        raise ValueError(payload.get("info") or "amap_weather_failed")

    live = lives[0]
    temp = live.get("temperature_float") or live.get("temperature")
    temperature = float(temp) if temp not in (None, "") else None
    weather = live.get("weather") or "天气未获取"
    display = f"{weather} · {round(temperature)}°C" if temperature is not None else weather
    return {
        "location": live.get("city") or clean_city,
        "country": "中国",
        "weather": weather,
        "temperature": temperature,
        "display": display,
        "source": "AMap",
        "reporttime": live.get("reporttime", ""),
        "humidity": live.get("humidity", ""),
        "winddirection": live.get("winddirection", ""),
        "windpower": live.get("windpower", ""),
    }


def get_route(origin: str, destination: str, mode: str = "walking", city: str = "") -> dict:
    key = _amap_key()
    clean_mode = mode if mode in AMAP_ROUTE_URLS else "walking"
    if not key:
        return {"source": "route_fallback", "configured": False, "is_realtime": False, "reason": "missing_amap_api_key"}

    params = {"key": key, "origin": origin, "destination": destination, "output": "json"}
    if clean_mode == "transit":
        params["city"] = city or "上海"

    try:
        payload = _amap_get(AMAP_ROUTE_URLS[clean_mode], params)
    except (OSError, URLError, TimeoutError, json.JSONDecodeError):
        return {"source": "AMap", "configured": True, "is_realtime": False, "reason": "amap_request_failed"}

    if payload.get("status") != "1":
        return {"source": "AMap", "configured": True, "is_realtime": False, "reason": payload.get("info") or "amap_error"}

    route = payload.get("route") or {}
    paths = route.get("paths") or route.get("transits") or []
    first = paths[0] if paths else {}
    return {
        "source": "AMap",
        "configured": True,
        "is_realtime": True,
        "mode": clean_mode,
        "origin": origin,
        "destination": destination,
        "distance_meters": first.get("distance", ""),
        "duration_seconds": first.get("duration", ""),
        "steps": first.get("steps", [])[:6],
    }
