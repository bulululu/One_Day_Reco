import sys
import uuid
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.services.database import init_db


def main():
    init_db()
    client = TestClient(app)
    user_id = f"history_{uuid.uuid4()}"
    profile = {
        "user_id": user_id,
        "mbti": "INTP",
        "preferences": {
            "social_frequency": "独处",
            "budget": "50-150元",
            "commute_tolerance": "30分钟内",
            "notes": "",
        },
        "feedback_summary": "",
    }
    recommend_res = client.post(
        "/api/recommend",
        json={
            "user_profile": profile,
            "context": {"weather": "晴", "location": "上海 徐汇", "mode": "个人"},
        },
    )
    assert recommend_res.status_code == 200, recommend_res.text
    recommendation = recommend_res.json()["recommendations"][0]

    history_res = client.get(f"/api/recommendations/history?user_id={user_id}&limit=5")
    assert history_res.status_code == 200, history_res.text
    history = history_res.json()["history"]
    assert len(history) >= 1, history
    assert history[0]["recommendations"], history

    event_res = client.post(
        "/api/activity-events",
        json={
            "user_id": user_id,
            "activity_id": recommendation["activity_id"],
            "activity_name": recommendation["activity_name"],
            "event_type": "click",
            "source": "test",
            "metadata": {"action_label": recommendation.get("action_label", "")},
        },
    )
    assert event_res.status_code == 200, event_res.text

    events_res = client.get(f"/api/activity-events?user_id={user_id}&limit=5")
    assert events_res.status_code == 200, events_res.text
    events = events_res.json()["events"]
    assert events[0]["event_type"] == "click", events
    assert events[0]["activity_id"] == recommendation["activity_id"], events
    print("ok recommendation_history")


if __name__ == "__main__":
    main()
