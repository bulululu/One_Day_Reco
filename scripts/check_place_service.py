import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from backend.services import place_service
from backend.agents.recommendation_agent import RecommendationAgent
from backend.services.place_service import get_amap_weather, get_route, search_nearby_places, search_places


def fake_amap_get(url, params, timeout=4):
    if "weather" in url:
        return {
            "status": "1",
            "lives": [
                {
                    "city": "徐汇区",
                    "weather": "阴",
                    "temperature": "28",
                    "temperature_float": "28.0",
                    "reporttime": "2026-07-02 10:33:08",
                }
            ],
        }
    if "direction" in url:
        return {"status": "1", "route": {"paths": [{"distance": "650", "duration": "520", "steps": []}]}}
    return {
        "status": "1",
        "pois": [
            {
                "id": "B0TEST001",
                "name": "真实感测试咖啡馆",
                "address": "测试路 100 号",
                "type": "餐饮服务;咖啡厅;咖啡厅",
                "typecode": "050500",
                "location": "121.000000,31.000000",
                "distance": "650",
                "business_area": "徐汇",
                "pname": "上海市",
                "cityname": "上海市",
                "adname": "徐汇区",
            }
        ],
    }


def main():
    old_key = os.environ.pop("AMAP_API_KEY", None)
    fallback = search_places("咖啡馆", location="上海 徐汇", limit=3)
    assert fallback["source"] == "search_fallback", fallback
    assert fallback["configured"] is False, fallback
    assert fallback["is_realtime"] is False, fallback
    assert fallback["search_url"], fallback

    original_amap_get = place_service._amap_get
    os.environ["AMAP_API_KEY"] = "test-key"
    place_service._amap_get = fake_amap_get
    try:
        result = search_places("咖啡馆", location="上海 徐汇", limit=3)
        assert result["source"] == "AMap", result
        assert result["configured"] is True, result
        assert result["is_realtime"] is True, result
        assert result["places"][0]["name"] == "真实感测试咖啡馆", result
        assert result["places"][0]["distance"] == "650 m", result

        nearby = search_nearby_places("咖啡馆", longitude=121.0, latitude=31.0, limit=3)
        assert nearby["source"] == "AMap", nearby
        assert nearby["places"][0]["name"] == "真实感测试咖啡馆", nearby

        weather = get_amap_weather("上海 徐汇")
        assert weather["source"] == "AMap", weather
        assert weather["weather"] == "阴", weather

        route = get_route("121.0,31.0", "121.1,31.1")
        assert route["source"] == "AMap", route
        assert route["distance_meters"] == "650", route

        agent = RecommendationAgent()
        agent.client = None
        activity = {
            "id": "PLACE_TEST_001",
            "name": "找个咖啡馆坐一会儿",
            "category": "城市探索",
            "subcategory": "咖啡",
            "indoor_outdoor": "室内",
            "duration_hours": 1,
            "budget": "50-100元",
            "mood_effect": "放松",
            "adjustable_factors": "人多就换近处第二家。",
        }
        hints = agent._lookup_places_for_candidates([activity], {"location": "上海 徐汇"})
        copy = agent._build_fallback_recommendation_copy(activity, {"location": "上海 徐汇"}, hints)
        assert copy["specific_info"]["name"] == "真实感测试咖啡馆", copy
        assert copy["specific_info"]["source"] == "高德地图实时地点", copy
        rec = agent._attach_activity_metadata(
            {
                "activity_id": activity["id"],
                "activity_name": activity["name"],
                **copy,
            },
            activity,
        )
        assert rec["action_url"], rec
        assert "ditu.amap.com" in rec["action_url"], rec
        assert rec["action_label"] == "高德地图", rec
    finally:
        place_service._amap_get = original_amap_get
        if old_key is None:
            os.environ.pop("AMAP_API_KEY", None)
        else:
            os.environ["AMAP_API_KEY"] = old_key

    print("ok place_service")


if __name__ == "__main__":
    main()
