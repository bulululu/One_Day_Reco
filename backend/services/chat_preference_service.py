"""Extract durable preference signals from natural chat messages."""

from __future__ import annotations


def _contains_any(text: str, words: list[str]) -> bool:
    return any(word in text for word in words)


def extract_chat_preferences(message: str) -> list[dict]:
    text = (message or "").strip().lower()
    if not text:
        return []

    preferences: list[dict] = []

    if _contains_any(text, ["太远", "远了", "不想跑", "近一点", "附近", "30分钟", "半小时"]):
        preferences.append({
            "key": "nearby",
            "label": "偏好近一点，降低通勤成本",
            "constraint": "nearby_first",
        })
    if _contains_any(text, ["太贵", "贵了", "便宜", "低预算", "省钱", "不花钱", "免费"]):
        preferences.append({
            "key": "low_budget",
            "label": "偏好低预算或免费活动",
            "constraint": "low_budget_first",
        })
    if _contains_any(text, ["人多", "太吵", "拥挤", "排队", "热闹", "人少", "安静"]):
        preferences.append({
            "key": "low_crowd",
            "label": "偏好人少安静，降低社交和排队压力",
            "constraint": "low_crowd_first",
        })
    wants_indoor = _contains_any(text, ["不想出门", "在家", "宅", "懒得出去", "居家", "室内"])
    if wants_indoor:
        preferences.append({
            "key": "indoor",
            "label": "偏好室内或居家可做",
            "constraint": "indoor_first",
        })
    if not wants_indoor and _contains_any(text, ["想出门", "出去走", "户外", "晒太阳", "透气"]):
        preferences.append({
            "key": "outdoor",
            "label": "偏好出门透气和轻户外",
            "constraint": "outdoor_first",
        })
    if _contains_any(text, ["电影", "影院", "观影", "看一场"]):
        preferences.append({
            "key": "movie",
            "label": "近期想看电影",
            "constraint": "movie_interest",
        })
    if _contains_any(text, ["游戏", "打游戏", "steam", "switch", "手游"]):
        preferences.append({
            "key": "game",
            "label": "近期想玩游戏",
            "constraint": "game_interest",
        })

    seen = set()
    unique = []
    for preference in preferences:
        key = preference["key"]
        if key in seen:
            continue
        seen.add(key)
        unique.append(preference)
    return unique
