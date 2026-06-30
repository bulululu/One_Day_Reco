import json
import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from backend.services import place_service
from backend.agents.recommendation_agent import RecommendationAgent
from backend.services.place_service import search_places


class FakeResponse:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return json.dumps(
            {
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
            },
            ensure_ascii=False,
        ).encode("utf-8")


def main():
    old_key = os.environ.pop("AMAP_API_KEY", None)
    fallback = search_places("咖啡馆", location="上海 徐汇", limit=3)
    assert fallback["source"] == "search_fallback", fallback
    assert fallback["configured"] is False, fallback
    assert fallback["is_realtime"] is False, fallback
    assert fallback["search_url"], fallback

    original_urlopen = place_service.urlopen
    os.environ["AMAP_API_KEY"] = "test-key"
    place_service.urlopen = lambda url, timeout=4: FakeResponse()
    try:
        result = search_places("咖啡馆", location="上海 徐汇", limit=3)
        assert result["source"] == "AMap", result
        assert result["configured"] is True, result
        assert result["is_realtime"] is True, result
        assert result["places"][0]["name"] == "真实感测试咖啡馆", result
        assert result["places"][0]["distance"] == "650 m", result

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
        place_service.urlopen = original_urlopen
        if old_key is None:
            os.environ.pop("AMAP_API_KEY", None)
        else:
            os.environ["AMAP_API_KEY"] = old_key

    print("ok place_service")


if __name__ == "__main__":
    main()
