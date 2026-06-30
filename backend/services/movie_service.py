import json
import os
from typing import Optional
from urllib.error import URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from backend.services.env import load_env_file
from backend.services.place_service import search_places


load_env_file()

MAOYAN_MOVIE_LIST_URL = "https://m.maoyan.com/ajax/movieList"
MAOYAN_MOVIE_ON_INFO_URL = "https://m.maoyan.com/ajax/movieOnInfoList"
MAOYAN_DETAIL_URL = "https://m.maoyan.com/ajax/detailmovie"
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


def _request_json(url: str, params: dict, timeout: int = 4) -> dict:
    query = urlencode(params)
    request = Request(
        f"{url}?{query}" if query else url,
        headers={
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://m.maoyan.com/",
            "User-Agent": "Mozilla/5.0 OneDayReco/0.2",
        },
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, TimeoutError, json.JSONDecodeError):
        return {}


def _tmdb_request(url: str, params: dict) -> dict:
    key = _tmdb_key()
    if not key:
        return {}
    return _request_json(url, {**params, "api_key": key, "language": "zh-CN"})


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


def _format_maoyan_duration(value: object) -> str:
    try:
        minutes = int(value)
    except (TypeError, ValueError):
        return "以猫眼信息为准"
    return f"约 {minutes} 分钟" if minutes > 0 else "以猫眼信息为准"


def _format_maoyan_rating(value: object) -> str:
    try:
        score = float(value)
    except (TypeError, ValueError):
        return "猫眼评分待更新"
    return f"猫眼 {score:.1f}" if score > 0 else "猫眼评分待更新"


def _maoyan_movies_from_payload(payload: dict) -> list[dict]:
    if not isinstance(payload, dict):
        return []
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    items = payload.get("movieList") or payload.get("movies") or data.get("movieList") or data.get("movies") or []
    return items if isinstance(items, list) else []


def _fetch_maoyan_detail(movie_id: object) -> dict:
    if not movie_id:
        return {}
    payload = _request_json(MAOYAN_DETAIL_URL, {"movieId": movie_id})
    data = payload.get("detailMovie") or (payload.get("data") or {}).get("detailMovie")
    return data if isinstance(data, dict) else {}


def _normalize_maoyan_movie(movie: dict, detail: Optional[dict] = None) -> dict:
    detail = detail or {}
    title = movie.get("nm") or movie.get("name") or detail.get("nm") or "未命名电影"
    movie_id = movie.get("id") or movie.get("movieId") or detail.get("id") or title
    category = movie.get("cat") or detail.get("cat") or ""
    pub_desc = movie.get("showInfo") or movie.get("pubDesc") or detail.get("pubDesc") or ""
    overview_parts = [part for part in [category, pub_desc] if part]
    return {
        "id": f"maoyan-{movie_id}",
        "title": f"《{title}》" if not str(title).startswith("《") else str(title),
        "duration": _format_maoyan_duration(movie.get("dur") or detail.get("dur")),
        "rating": _format_maoyan_rating(movie.get("sc") or detail.get("sc")),
        "source": "Maoyan unofficial",
        "overview": " · ".join(overview_parts),
        "release_date": detail.get("rt") or movie.get("rt") or "",
        "actors": movie.get("star") or detail.get("star") or "",
    }


def _fetch_maoyan_now_playing(location: str, limit: int) -> list[dict]:
    city_parts = (location or "").replace("·", " ").replace("，", " ").split()
    params = {
        "limit": max(1, min(limit, 10)),
        "offset": 0,
    }
    if city_parts:
        params["cityName"] = city_parts[0]

    payload = _request_json(MAOYAN_MOVIE_LIST_URL, params)
    movies = _maoyan_movies_from_payload(payload)
    if not movies:
        movies = _maoyan_movies_from_payload(_request_json(MAOYAN_MOVIE_ON_INFO_URL, params))

    normalized = []
    for movie in movies[: max(1, min(limit, 10))]:
        detail = _fetch_maoyan_detail(movie.get("id") or movie.get("movieId"))
        normalized.append(_normalize_maoyan_movie(movie, detail))
    return normalized


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
                "estimated_price": "以猫眼实时票价为准",
                "recommended_cinema": cinemas[0] if cinemas else None,
                "cinema_candidates": cinemas[:3],
                "cinema_search_url": fallback_url,
            }
        )
    return enriched


def get_movie_candidates(location: str = "", region: str = "CN", limit: int = 5) -> dict:
    movies = _fetch_maoyan_now_playing(location, limit)
    source = "Maoyan unofficial" if movies else "curated_fallback"
    is_realtime = bool(movies)
    if not movies:
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
        "showtime_note": "电影片单优先尝试猫眼实时数据；具体场次和票价必须在猫眼或影院页面确认。",
        "cinema_source": cinema_result.get("source", "search_fallback"),
        "cinema_is_realtime": bool(cinema_result.get("is_realtime")),
        "movies": _attach_booking_paths(movies, location, cinema_result),
    }
