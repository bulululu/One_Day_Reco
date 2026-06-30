import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from backend.agents.recommendation_agent import RecommendationAgent


def main():
    agent = RecommendationAgent()
    result = {
        "recommendations": [
            {
                "activity_id": "A043",
                "activity_name": "看一部纪录片",
                "specific_info": {"name": "《地球脉动》"},
            },
            {
                "activity_id": "A043",
                "activity_name": "看一部纪录片",
                "specific_info": {"name": "《地球脉动》"},
            },
            {
                "activity_id": "A043",
                "activity_name": "看一部纪录片",
                "specific_info": {"name": "《人生果实》"},
            },
        ]
    }
    deduped = agent._dedupe_recommendations(result)
    recommendations = deduped["recommendations"]
    assert len(recommendations) == 2, recommendations
    assert deduped["dedupe_notice"] == "removed_1_duplicate_recommendations", deduped
    assert recommendations[0]["specific_info"]["name"] == "《地球脉动》", recommendations
    assert recommendations[1]["specific_info"]["name"] == "《人生果实》", recommendations
    print("ok recommendation_dedupe")


if __name__ == "__main__":
    main()
