import json
import os
from typing import Optional
from urllib.error import URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from backend.services.place_service import search_places


TMDB_NOW_PLAYING_URL = "https://api.themoviedb.org/3/movie/now_playing"
TMDB_MOVIE_URL = "https://api.themoviedb.org/3/movie"

CURATED_MOVIES = [
    {
        "id": "curated-soul",
        "title": "《心灵奇旅》",
        "duration": "约 100 分钟",
        "rating": "豆瓣约 8.7",
        "source": "精选片单",
        "overview": "节奏温柔，适合一个人放松看完。",
    },
    {
        "id": "curated-perfect-days",
        "title": "《完美的日子》",
        "duration": "约 124 分钟",
        "rating": "豆瓣约 8.3",
        "source": "精选片单",
        "overview": "日常感很强，适合想慢下来的一天。",
    },
    {
        "id": "curated-boy-and-heron",
        "title": "《你想活出怎样的人生》",
        "duration": "约 124 分钟",
        "rating": "豆瓣约 7.6",
        "source": "精选片单",
        "overview": "适合需要一点想象力和情绪出口的时候。",
    },
]


def _tmdb_key() -> str:
    return os.getenv("TMDB_API_KEY", "").strip()


def _tmdb_request(url: str, params: dict) -> dict:
    key = _tmdb_key()
    if not key:
        return {}
    query = urlencode({**params, "api_key": key, "language": "zh-CN"})
    request = Request(
        f"{url}?{query}",
        headers={"Accept": "application/json", "User-Agent": "OneDayReco/0.1"},
    )
    try:
        with urlopen(request, timeout=4) as response:
            return json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, TimeoutError, json.JSONDecodeError):
        return {}


def _format_runtime(minutes: object) -> str:
    try:
        value = int(minutes)
    except (TypeError, ValueError):
        return "以平台信息为准"
    if value <= 0:
        return "以平台信息为准"
    return f"约 {value} 分钟"


def _normalize_movie(movie: dict, detail: Optional[dict] = None) -> dict:
    detail = detail or {}
    title = movie.get("title") or movie.get("name") or "未命名电影"
    rating = movie.get("vote_average")
    return {
        "id": str(movie.get("id") or title),
        "title": f"《{title}》" if not str(title).startswith("《") else str(title),
        "duration": _format_runtime(detail.get("runtime")),
        "rating": f"TMDb {float(rating):.1f}/10" if isinstance(rating, (int, float)) and rating > 0 else "以平台实时评分为准",
        "source": "TMDb",
        "overview": movie.get("overview") or detail.get("overview") or "",
        "release_date": movie.get("release_date") or detail.get("release_date") or "",
    }


def _fetch_now_playing(region: str, limit: int) -> list[dict]:
    payload = _tmdb_request(TMDB_NOW_PLAYING_URL, {"region": region or "CN", "page": 1})
    results = payload.get("results") if isinstance(payload, dict) else None
    if not isinstance(results, list):
        return []

    movies = []
    for movie in results[: max(1, min(limit, 10))]:
        detail = _tmdb_request(f"{TMDB_MOVIE_URL}/{movie.get('id')}", {}) if movie.get("id") else {}
        movies.append(_normalize_movie(movie, detail))
    return movies


def _booking_url(title: str, location: str) -> str:
    query = f"{location} {title}".strip()
    return f"https://m.maoyan.com/search?keyword={quote(query)}"


def _attach_booking_paths(movies: list[dict], location: str, cinema_result: dict) -> list[dict]:
    cinemas = cinema_result.get("places") or []
    fallback_url = cinema_result.get("search_url", "")
    enriched = []
    for movie in movies:
        title = movie["title"]
        enriched.append(
            {
                **movie,
                "booking_url": _booking_url(title, location),
                "booking_label": "猫眼确认场次",
                "showtime_status": "requires_ticket_platform_check",
                "cinema_candidates": cinemas[:3],
                "cinema_search_url": fallback_url,
            }
        )
    return enriched


def get_movie_candidates(location: str = "", region: str = "CN", limit: int = 5) -> dict:
    movies = _fetch_now_playing(region, limit)
    source = "TMDb" if movies else "curated_fallback"
    is_realtime = bool(movies)
    if not movies:
        movies = CURATED_MOVIES[: max(1, min(limit, len(CURATED_MOVIES)))]

    cinema_result = search_places("电影院", location=location, limit=3)
    return {
        "count": len(movies),
        "source": source,
        "is_realtime": is_realtime,
        "showtime_realtime": False,
        "showtime_note": "未接入猫眼/美团正式排片 API；场次和票价必须在票务平台实时确认。",
        "cinema_source": cinema_result.get("source", "search_fallback"),
        "cinema_is_realtime": bool(cinema_result.get("is_realtime")),
        "movies": _attach_booking_paths(movies, location, cinema_result),
    }
