import sys
import uuid
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient

from backend.app.dependencies import agent
from backend.app.main import app
from backend.services.database import init_db


def main():
    init_db()
    client = TestClient(app)
    original_client = agent.client
    agent.client = None
    user_id = f"chat_{uuid.uuid4()}"
    try:
        res = client.post(
            "/api/chat",
            json={
                "user_profile": {
                    "user_id": user_id,
                    "mbti": "INFP",
                    "preferences": {
                        "social_frequency": "独处",
                        "budget": "0-50元",
                        "commute_tolerance": "30分钟内",
                        "notes": "",
                    },
                    "feedback_summary": "",
                },
                "message": "想看个纪录片，但不想出门，也别太贵，人少安静一点",
                "context": {"weather": "晴", "location": "上海 徐汇", "mode": "个人"},
            },
        )
        game_res = client.post(
            "/api/chat",
            json={
                "user_profile": {
                    "user_id": user_id,
                    "mbti": "INFP",
                    "preferences": {
                        "social_frequency": "独处",
                        "budget": "0-50元",
                        "commute_tolerance": "30分钟内",
                        "notes": "",
                    },
                    "feedback_summary": "",
                },
                "message": "我想打会儿游戏，一个人也可以",
                "context": {"weather": "晴", "location": "上海 徐汇", "mode": "个人"},
            },
        )
    finally:
        agent.client = original_client

    assert res.status_code == 200, res.text
    data = res.json()
    assert "reply" in data, data
    assert "recommendations" in data, data
    assert "activity_source" in data, data

    events_res = client.get(f"/api/activity-events?user_id={user_id}&limit=10")
    assert events_res.status_code == 200, events_res.text
    events = events_res.json()["events"]
    preference_constraints = [
        event.get("metadata", {}).get("constraint")
        for event in events
        if event.get("event_type") == "preference"
    ]
    assert "indoor_first" in preference_constraints, events
    assert "low_budget_first" in preference_constraints, events
    assert "low_crowd_first" in preference_constraints, events
    assert game_res.status_code == 200, game_res.text
    game_data = game_res.json()
    game_rec = game_data["recommendations"][0]
    game_text = f"{game_rec.get('activity_name', '')} {game_rec.get('specific_info', {}).get('name', '')}"
    assert "游戏" in game_text or "星露谷" in game_text or "潜水员" in game_text, game_data
    print("ok chat_endpoint")


if __name__ == "__main__":
    main()
