"""Recommendation quality checks for executable, non-generic plans."""

from typing import Iterable


GENERIC_PHRASES = [
    "去看场电影",
    "看场电影",
    "去公园走走",
    "附近走走",
    "出去走走",
    "找个纪录片",
    "看看纪录片",
    "做做运动",
    "出去吃点",
    "找家餐厅",
    "打会儿游戏",
    "玩会儿游戏",
]

REQUIRED_SPECIFIC_FIELDS = ["name", "location", "duration", "price", "source"]


def _text(rec: dict) -> str:
    info = rec.get("specific_info") or {}
    return " ".join(
        str(value or "")
        for value in [
            rec.get("activity_name"),
            rec.get("recommend_text"),
            rec.get("tips"),
            info.get("name"),
            info.get("location"),
            info.get("duration"),
            info.get("price"),
            info.get("rating"),
            info.get("source"),
        ]
    )


def _has_any(text: str, terms: Iterable[str]) -> bool:
    return any(term in text for term in terms)


def quality_issues(rec: dict) -> list[str]:
    """Return issue codes for a recommendation that is too vague to execute."""
    issues: list[str] = []
    text = _text(rec)
    info = rec.get("specific_info") or {}

    for field in REQUIRED_SPECIFIC_FIELDS:
        if not str(info.get(field, "")).strip():
            issues.append(f"missing_specific_info.{field}")

    if len(str(rec.get("recommend_text", "")).strip()) < 45:
        issues.append("recommend_text.too_short")

    if len(str(rec.get("tips", "")).strip()) < 12:
        issues.append("tips.too_short")

    if _has_any(text, GENERIC_PHRASES):
        missing_specific_markers = not _has_any(
            text,
            [
                "搜",
                "搜索",
                "打开",
                "分钟",
                "小时",
                "元",
                "评分",
                "豆瓣",
                "猫眼",
                "Steam",
                "B站",
                "地图",
            ],
        )
        if missing_specific_markers:
            issues.append("generic_phrase_without_execution_path")

    category = str(rec.get("category", ""))
    activity_name = str(rec.get("activity_name", ""))
    combined = f"{category} {activity_name} {text}"

    if ("游戏" in combined) and not _has_any(
        combined,
        ["Steam", "Switch", "iOS", "Android", "PlayStation", "Xbox", "单人", "多人", "平台"],
    ):
        issues.append("game.missing_platform_or_mode")

    if ("电影" in combined) and not _has_any(
        combined,
        ["猫眼", "影院", "片长", "场次", "豆瓣", "分钟"],
    ):
        issues.append("movie.missing_showtime_or_rating")

    if ("美食" in combined or "餐厅" in combined or "吃饭" in combined) and not _has_any(
        combined,
        ["人均", "评分", "营业", "排队", "菜系", "地图", "高德"],
    ):
        issues.append("restaurant.missing_price_or_reputation")

    return issues


def is_executable_recommendation(rec: dict) -> bool:
    return not quality_issues(rec)
