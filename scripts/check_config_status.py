import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient

from backend.app.main import app


def main():
    client = TestClient(app)
    res = client.get("/api/config/status")
    assert res.status_code == 200, res.text
    data = res.json()
    services = data["services"]
    for key in ["llm", "weather", "places", "activities", "games", "movies", "content", "database"]:
        assert key in services, services
        service = services[key]
        assert "configured" in service, service
        assert "is_realtime" in service, service
        assert "source" in service, service
        assert "detail" in service, service
        serialized = str(service).lower()
        assert "secret" not in serialized and "password" not in serialized and "token" not in serialized, service
    print("ok config_status")


if __name__ == "__main__":
    main()
