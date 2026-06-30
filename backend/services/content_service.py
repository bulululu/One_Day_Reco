import json
import time
from urllib.error import URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


BILIBILI_SEARCH_URL = "https://api.bilibili.com/x/web-interface/search/type"
_CACHE_TTL_SECONDS = 120
_SEARCH_CACHE: dict[str, tuple[float, list[dict]]] = {}

CURATED_CONTENT = [
    {
        "id": "curated-life-is-fruity",
        "title": "《人生果实》",
        "duration": "约 91 分钟",
        "rating": "豆瓣 9.5",
        "source": "精选片单",
        "description": "慢节奏生活纪录片，适合想安静放松的时候。",
    },
    {
        "id": "curated-aerial-china",
        "title": "《航拍中国》",
        "duration": "单集约 50 分钟",
        "rating": "豆瓣 9.2",
        "source": "精选片单",
        "description": "画面舒展，适合当作轻旅行替代方案。",
    },
    {
        "id": "curated-planet-earth",
        "title": "《地球脉动》",
        "duration": "单集约 50 分钟",
        "rating": "豆瓣 9.7",
        "source": "精选片单",
        "description": "自然纪录片，适合低能量但想获得一点开阔感的时候。",
    },
]


def _strip_html(text: str) -> str:
    return (text or "").replace("<em class=\"keyword\">", "").replace("</em>", "")


def _search_bilibili(keyword: str, limit: int) -> list[dict]:
    cache_key = f"{keyword}:{limit}"
    cached = _SEARCH_CACHE.get(cache_key)
    now = time.time()
    if cached and now - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    params = urlencode(
        {
            "search_type": "video",
            "keyword": keyword,
            "page": 1,
        }
    )
    request = Request(
        f"{BILIBILI_SEARCH_URL}?{params}",
        headers={
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 OneDayReco/0.1",
        },
    )
    try:
        with urlopen(request, timeout=4) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, TimeoutError, json.JSONDecodeError):
        return []

    results = ((payload.get("data") or {}).get("result") or []) if isinstance(payload, dict) else []
    if not isinstance(results, list):
        return []

    videos = []
    for item in results[: max(1, min(limit, 10))]:
        title = _strip_html(str(item.get("title") or ""))
        if not title:
            continue
        videos.append(
            {
                "id": str(item.get("bvid") or item.get("aid") or title),
                "title": title,
                "duration": str(item.get("duration") or "以 B 站信息为准"),
                "rating": f"播放 {item.get('play')}" if item.get("play") not in (None, "") else "以 B 站信息为准",
                "source": "Bilibili",
                "description": _strip_html(str(item.get("description") or "")),
                "action_url": item.get("arcurl") or f"https://search.bilibili.com/all?keyword={quote(title)}",
                "action_label": "B站观看",
            }
        )
    _SEARCH_CACHE[cache_key] = (now, videos)
    return videos


def _fallback_content(keyword: str, limit: int) -> list[dict]:
    selected = CURATED_CONTENT[: max(1, min(limit, len(CURATED_CONTENT)))]
    return [
        {
            **item,
            "action_url": f"https://search.bilibili.com/all?keyword={quote(item['title'])}",
            "action_label": "B站搜索",
        }
        for item in selected
        if not keyword or keyword in item["title"] or keyword in item["description"]
    ] or [
        {
            "id": f"search-{keyword}",
            "title": keyword,
            "duration": "以 B 站信息为准",
            "rating": "以 B 站信息为准",
            "source": "search_fallback",
            "description": "未获取到实时视频结果，使用 B 站搜索入口确认。",
            "action_url": f"https://search.bilibili.com/all?keyword={quote(keyword)}",
            "action_label": "B站搜索",
        }
    ]


def search_content(q: str = "纪录片", limit: int = 5) -> dict:
    keyword = (q or "纪录片").strip()
    videos = _search_bilibili(keyword, limit)
    source = "Bilibili" if videos else "curated_fallback"
    return {
        "query": keyword,
        "count": len(videos) if videos else min(limit, len(CURATED_CONTENT)),
        "source": source,
        "is_realtime": source == "Bilibili",
        "items": videos or _fallback_content(keyword, limit),
    }
