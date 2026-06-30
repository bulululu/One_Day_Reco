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
    assert agent.client is not None, "LLM client is not configured"
    init_db()
    client = TestClient(app)
    res = client.post(
        "/api/chat",
        json={
            "user_profile": {
                "user_id": f"real_chat_{uuid.uuid4()}",
                "mbti": "INFP",
                "preferences": {
                    "social_frequency": "偏独处",
                    "budget": "50-150元",
                    "commute_tolerance": "30分钟内，人少优先",
                    "notes": "内测检查：想看电影但不想去人多的地方",
                },
                "feedback_summary": "",
            },
            "message": "我想周末去人少一点的地方看电影，给我一个具体建议",
            "context": {"weather": "晴", "location": "上海 徐汇", "mode": "个人"},
        },
        timeout=90,
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data.get("reply"), data
    assert isinstance(data.get("recommendations"), list), data
    print(
        {
            "reply_len": len(data["reply"]),
            "recommendation_count": len(data["recommendations"]),
            "activity_source": data.get("activity_source", {}).get("source"),
        }
    )
    print("ok real_chat_endpoint")


if __name__ == "__main__":
    main()
