import sys
import uuid
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient

from backend.app.dependencies import agent
from backend.app.main import app
from backend.services.database import SessionLocal, init_db
from backend.services.recommendation_history_service import (
    build_behavior_memory,
    record_activity_event,
    record_recommendation,
)


def main():
    init_db()
    user_id = f"behavior_{uuid.uuid4()}"

    with SessionLocal() as db:
        record_activity_event(db, user_id, "A001", "skipped", "看一场电影", source="test")
        record_activity_event(db, user_id, "A004", "completed", "独立书店看书+咖啡", source="test")
        record_recommendation(
            db,
            user_id,
            {
                "recommendations": [
                    {"activity_id": "A002", "activity_name": "逛美术馆/博物馆"},
                    {"activity_id": "A003", "activity_name": "看话剧/音乐剧"},
                ],
                "activity_source": {"source": "test", "is_realtime": False},
            },
            context={"location": "上海 徐汇"},
            source="test",
        )
        memory = build_behavior_memory(db, user_id)

    assert "近期喜欢/完成" in memory["summary"], memory
    assert "近期跳过" in memory["summary"], memory
    assert "最近已推荐" in memory["summary"], memory
    assert "A004" in memory["positive_activity_ids"], memory
    assert "A001" in memory["negative_activity_ids"], memory
    assert "A002" in memory["recent_activity_ids"], memory

    activities = [
        {
            "id": "A001",
            "name": "看一场电影",
            "indoor_outdoor": "室内",
            "weather_suitable": ["晴", "雨"],
            "time_window": "全天",
            "crowd_density": "中",
            "adjustable_factors": "",
            "safety_note": "",
        },
        {
            "id": "A002",
            "name": "逛美术馆/博物馆",
            "indoor_outdoor": "室内",
            "weather_suitable": ["晴", "雨"],
            "time_window": "全天",
            "crowd_density": "低",
            "adjustable_factors": "",
            "safety_note": "",
        },
        {
            "id": "A004",
            "name": "独立书店看书+咖啡",
            "indoor_outdoor": "室内",
            "weather_suitable": ["晴", "雨"],
            "time_window": "全天",
            "crowd_density": "低",
            "adjustable_factors": "",
            "safety_note": "",
        },
        {
            "id": "A005",
            "name": "附近散步",
            "indoor_outdoor": "室外",
            "weather_suitable": ["晴"],
            "time_window": "全天",
            "crowd_density": "低",
            "adjustable_factors": "",
            "safety_note": "",
        },
    ]
    filtered = agent._pre_filter_activities(
        {"user_id": user_id, "mbti": "ENFP", "behavior_memory": memory},
        {"weather": "晴"},
        activities,
    )
    filtered_ids = [activity["id"] for activity in filtered]
    assert "A001" not in filtered_ids, filtered_ids
    assert filtered_ids[0] == "A004", filtered_ids
    assert filtered_ids.index("A002") > filtered_ids.index("A005"), filtered_ids

    client = TestClient(app)
    res = client.post(
        "/api/recommend",
        json={
            "user_profile": {
                "user_id": user_id,
                "mbti": "ENFP",
                "preferences": {
                    "social_frequency": "小范围社交",
                    "budget": "50-150元",
                    "commute_tolerance": "30分钟内",
                },
                "feedback_summary": "",
            },
            "context": {"weather": "晴", "location": "上海 徐汇", "mode": "个人"},
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data.get("activity_source"), data
    assert all(rec["activity_id"] != "A001" for rec in data.get("recommendations", [])), data
    print("ok behavior_memory")


if __name__ == "__main__":
    main()
