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
    try:
        res = client.post(
            "/api/chat",
            json={
                "user_profile": {
                    "user_id": f"chat_{uuid.uuid4()}",
                    "mbti": "INFP",
                    "preferences": {
                        "social_frequency": "独处",
                        "budget": "0-50元",
                        "commute_tolerance": "30分钟内",
                        "notes": "",
                    },
                    "feedback_summary": "",
                },
                "message": "想看个纪录片",
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
    print("ok chat_endpoint")


if __name__ == "__main__":
    main()
