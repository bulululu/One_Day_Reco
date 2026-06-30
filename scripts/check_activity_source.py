import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from backend.agents.recommendation_agent import RecommendationAgent
from backend.services import activity_service
from backend.services.activity_service import get_activity_catalog


EXTERNAL_ACTIVITY = {
    "id": "EXT_GAME_001",
    "name": "API 实时游戏推荐",
    "category": "居家休闲",
    "subcategory": "游戏",
    "indoor_outdoor": "室内",
    "duration_hours": 1,
    "budget": "0-50元",
    "mbti_friendly": {"I": 0.9, "N": 0.7, "T": 0.7, "P": 0.8},
    "specific_info": {
        "name": "Dorfromantik",
        "location": "Steam / Switch",
        "duration": "45-90 分钟",
        "price": "Steam 约 50 元，已有则 0 元",
        "rating": "Steam 好评如潮",
        "source": "外部游戏 API",
        "platform": "Steam / Switch",
        "game_type": "治愈拼图策略",
        "player_mode": "单人",
        "setup": "打开 Steam 搜索 Dorfromantik，完成一局短目标即可退出。",
    },
}


def main():
    original_fetch = activity_service._fetch_remote_catalog
    activity_service._fetch_remote_catalog = lambda url: [activity_service._normalize_activity(EXTERNAL_ACTIVITY, "external_api")]
    os.environ["ONEDAYRECO_ACTIVITY_API_URL"] = "https://activity-api.example.test/activities"

    try:
        catalog = get_activity_catalog([])
        assert catalog["source"] == "external_api", catalog
        assert catalog["is_realtime"] is True, catalog
        assert catalog["activities"][0]["id"] == EXTERNAL_ACTIVITY["id"], catalog

        agent = RecommendationAgent()
        agent.client = None
        result = agent.recommend(
            {
                "user_id": "check_user",
                "mbti": "INTP",
                "preferences": {
                    "social_frequency": "独处",
                    "budget": "0-50元",
                    "commute_tolerance": "15分钟内",
                    "notes": "",
                },
                "feedback_summary": "",
            },
            {"weather": "晴", "location": "上海", "mode": "个人"},
        )
        assert result["activity_source"]["source"] == "external_api", result
        assert result["activity_source"]["is_realtime"] is True, result
        assert result["recommendations"][0]["activity_id"] == EXTERNAL_ACTIVITY["id"], result
        print("ok activity_source=external_api")
    finally:
        activity_service._fetch_remote_catalog = original_fetch


if __name__ == "__main__":
    main()
