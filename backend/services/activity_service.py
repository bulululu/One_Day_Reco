import json
import os
from typing import Optional
from urllib.error import URLError
from urllib.request import Request, urlopen


DEFAULT_ACTIVITY_FIELDS = {
    "category": "外部活动",
    "subcategory": "即时推荐",
    "description": "",
    "crowd_density": "中",
    "indoor_outdoor": "室内",
    "social_intensity": "中",
    "energy_cost": "低",
    "duration_hours": 1,
    "budget": "按平台实时信息",
    "time_window": "全天",
    "weather_suitable": ["晴", "阴", "小雨"],
    "convenience": "中",
    "min_prep_time": "10分钟",
    "safety_note": "",
    "adjustable_factors": "以平台实时信息为准，开始前确认营业时间、距离和价格。",
    "mood_effect": "减少决策成本",
    "action_url": "",
    "action_label": "查看详情",
    "image_query": "",
    "source_platform": "外部活动API",
}


def _activity_api_url() -> str:
    return os.getenv("ONEDAYRECO_ACTIVITY_API_URL", "").strip()


def _game_api_url() -> str:
    return os.getenv("ONEDAYRECO_GAME_API_URL", "").strip()


def _fetch_remote_catalog(url: str) -> list[dict]:
    if not url:
        return []
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "OneDayReco/0.1",
        },
    )
    try:
        with urlopen(request, timeout=3) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, TimeoutError, json.JSONDecodeError):
        return []

    items = payload.get("activities") if isinstance(payload, dict) else payload
    if not isinstance(items, list):
        return []
    return [_normalize_activity(item, "external_api") for item in items if _is_valid_activity(item)]


def _is_valid_activity(item: object) -> bool:
    return isinstance(item, dict) and bool(item.get("id")) and bool(item.get("name"))


def _normalize_activity(item: dict, source_platform: str) -> dict:
    normalized = {**DEFAULT_ACTIVITY_FIELDS, **item}
    normalized["id"] = str(item["id"])
    normalized["name"] = str(item["name"])
    normalized["source_platform"] = item.get("source_platform") or source_platform
    normalized["image_query"] = item.get("image_query") or normalized["name"]
    try:
        normalized["duration_hours"] = float(normalized.get("duration_hours") or 1)
    except (TypeError, ValueError):
        normalized["duration_hours"] = 1
    if not isinstance(normalized.get("weather_suitable"), list):
        normalized["weather_suitable"] = ["晴", "阴", "小雨"]
    return normalized


def _normalize_catalog(items: list[dict], source_platform: str) -> list[dict]:
    return [_normalize_activity(item, source_platform) for item in items if _is_valid_activity(item)]


def _matches_query(activity: dict, q: str) -> bool:
    return q in json.dumps(activity, ensure_ascii=False).lower()


def _filter_activities(
    activities: list[dict],
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    q: Optional[str] = None,
    limit: Optional[int] = None,
) -> list[dict]:
    filtered = activities
    if category:
        filtered = [a for a in filtered if a.get("category") == category]
    if subcategory:
        filtered = [a for a in filtered if a.get("subcategory") == subcategory]
    if q:
        query = q.strip().lower()
        filtered = [a for a in filtered if _matches_query(a, query)]
    if limit:
        filtered = filtered[: max(0, min(limit, 50))]
    return filtered


def get_activity_catalog(
    local_activities: list[dict],
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    q: Optional[str] = None,
    limit: Optional[int] = None,
) -> dict:
    remote_activities = _fetch_remote_catalog(_activity_api_url())
    source = "external_api" if remote_activities else "local_fallback"
    activities = remote_activities or _normalize_catalog(local_activities, "local_fallback")
    filtered = _filter_activities(activities, category, subcategory, q, limit)
    return {
        "count": len(filtered),
        "source": source,
        "is_realtime": source == "external_api",
        "activities": filtered,
    }


def get_game_catalog(local_activities: list[dict], limit: Optional[int] = None) -> dict:
    remote_games = _fetch_remote_catalog(_game_api_url())
    source = "external_api" if remote_games else "local_fallback"
    games = remote_games or _normalize_catalog(
        [a for a in local_activities if a.get("subcategory") == "游戏"],
        "local_fallback",
    )
    filtered = _filter_activities(games, limit=limit)
    return {
        "count": len(filtered),
        "source": source,
        "is_realtime": source == "external_api",
        "activities": filtered,
    }
