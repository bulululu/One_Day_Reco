"""Validate recommendation specificity fixtures and activity data."""

import json
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.recommendation_quality import is_executable_recommendation, quality_issues


def main() -> int:
    activities = json.loads((PROJECT_ROOT / "backend/data/activities.json").read_text(encoding="utf-8"))
    game_missing = []
    for act in activities:
        if act.get("subcategory") != "游戏":
            continue
        info = act.get("specific_info") or {}
        for field in ["name", "platform", "game_type", "player_mode", "duration"]:
            if not info.get(field):
                game_missing.append((act["id"], field))

    vague = {
        "activity_id": "bad",
        "activity_name": "去看场电影",
        "recommend_text": "去看场电影吧。",
        "tips": "随便看看。",
        "specific_info": {},
    }
    concrete_game = {
        "activity_id": "ok",
        "activity_name": "玩《星露谷物语》",
        "category": "居家休闲",
        "recommend_text": "可以玩《星露谷物语》，Steam/Switch/手机都能玩，单人休闲经营，开一局 45-90 分钟刚好。",
        "tips": "Steam 搜 Stardew Valley；给自己设 90 分钟上限，玩完就收。",
        "specific_info": {
            "name": "《星露谷物语》",
            "location": "Steam / Switch / iOS / Android",
            "duration": "45-90分钟",
            "price": "约20-50元",
            "rating": "Steam好评如潮",
            "source": "Steam搜索：Stardew Valley",
        },
    }
    placeholder_movie = {
        "activity_id": "bad_movie",
        "activity_name": "上海影城SHO 早场电影（示例：《你想活出怎样的人生》）",
        "category": "室内娱乐",
        "recommend_text": "你可以周末去上海影城SHO看一场早场电影，示例：《你想活出怎样的人生》，人会少一点。",
        "tips": "打开猫眼后自行选择一场。",
        "specific_info": {
            "name": "上海影城SHO 早场电影（示例：《你想活出怎样的人生》）",
            "location": "上海影城SHO",
            "duration": "约120分钟",
            "price": "50-150元",
            "rating": "猫眼",
            "source": "猫眼搜索",
        },
    }

    errors = []
    if game_missing:
        errors.append(f"game_missing={game_missing}")
    if is_executable_recommendation(vague):
        errors.append("vague recommendation passed quality gate")
    if is_executable_recommendation(placeholder_movie):
        errors.append("placeholder movie passed quality gate")
    if not is_executable_recommendation(concrete_game):
        errors.append(f"concrete game failed: {quality_issues(concrete_game)}")

    if errors:
        print("\n".join(errors))
        return 1
    print(f"ok activities={len(activities)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
