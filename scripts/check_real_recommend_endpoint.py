import sys
import uuid
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient

from backend.app.dependencies import agent
from backend.app.main import app
from backend.services.database import init_db
from backend.services.recommendation_quality import is_executable_recommendation


def check_recommend(client: TestClient, context: dict, require_llm: bool) -> dict:
    res = client.post(
        "/api/recommend",
        json={
            "user_profile": {
                "user_id": f"real_reco_{uuid.uuid4()}",
                "mbti": "INFP",
                "preferences": {
                    "social_frequency": "偏独处，人少优先",
                    "budget": "50-150元",
                    "commute_tolerance": "30分钟内",
                    "notes": "周末可以看电影，但不想去人多的地方",
                },
                "feedback_summary": "",
            },
            "context": context,
        },
        timeout=90,
    )
    assert res.status_code == 200, res.text
    data = res.json()
    if require_llm:
        assert data.get("agent_source") == "llm", data
    recommendations = data.get("recommendations") or []
    assert recommendations, data
    assert all(is_executable_recommendation(item) for item in recommendations), recommendations
    return data


def main():
    require_llm = "--require-llm" in sys.argv
    with_coordinates = "--with-coordinates" in sys.argv
    assert agent.client is not None, "LLM client is not configured"
    init_db()
    client = TestClient(app)
    text_data = check_recommend(client, {
        "weather": "晴",
        "location": "上海 徐汇",
        "mode": "个人",
        "mode_note": "想要一个今天或周末能执行的具体活动",
    }, require_llm)
    output = {
        "text": {
            "agent_source": text_data.get("agent_source"),
            "recommendation_count": len(text_data.get("recommendations") or []),
            "activity_source": text_data.get("activity_source", {}).get("source"),
        },
    }
    if with_coordinates:
        coordinate_data = check_recommend(client, {
            "weather": "晴",
            "location": "上海市 徐汇区",
            "latitude": 31.18831,
            "longitude": 121.43676,
            "mode": "个人",
            "mode_note": "使用当前位置推荐一个附近现在能做的具体活动",
        }, require_llm)
        output["coordinate"] = {
            "agent_source": coordinate_data.get("agent_source"),
            "recommendation_count": len(coordinate_data.get("recommendations") or []),
            "activity_source": coordinate_data.get("activity_source", {}).get("source"),
        }
    print(output)
    print("ok real_recommend_endpoint")


if __name__ == "__main__":
    main()
