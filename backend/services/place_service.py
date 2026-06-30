import json
import os
from typing import Optional
from urllib.error import URLError
from urllib.parse import urlencode, quote
from urllib.request import urlopen


AMAP_TEXT_URL = "https://restapi.amap.com/v3/place/text"


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

    url = f"{AMAP_TEXT_URL}?{urlencode(params)}"
    try:
        with urlopen(url, timeout=4) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, TimeoutError, json.JSONDecodeError):
        return _fallback_response(clean_query, location, "amap_request_failed")

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
