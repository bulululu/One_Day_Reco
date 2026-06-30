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
    user_id = f"trigger_{uuid.uuid4()}"
    profile = {
        "user_id": user_id,
        "mbti": "INFP",
        "preferences": {
            "social_frequency": "独处",
            "budget": "0-50元",
            "commute_tolerance": "30分钟内",
            "notes": "想少看手机",
        },
        "feedback_summary": "",
    }
    res = client.post(
        "/api/trigger",
        json={
            "user_profile": profile,
            "app_name": "抖音",
            "app_category": "short_video",
            "usage_minutes": 95,
            "continuous_minutes": 42,
            "context": {"weather": "晴", "location": "上海 徐汇", "mode": "个人"},
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["recommendations"], data
    assert data["activity_source"], data

    history = client.get(f"/api/recommendations/history?user_id={user_id}&limit=3")
    assert history.status_code == 200, history.text
    records = history.json()["history"]
    assert records, records
    assert records[0]["source"] == "trigger", records
    print("ok screen_trigger")


if __name__ == "__main__":
    main()
