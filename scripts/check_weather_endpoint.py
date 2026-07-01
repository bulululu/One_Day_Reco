import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.routers import weather


def main():
    client = TestClient(app)
    original = weather.get_realtime_weather
    weather.get_realtime_weather = lambda location: (_ for _ in ()).throw(RuntimeError("offline"))
    try:
        res = client.get("/api/weather?location=上海%20徐汇")
    finally:
        weather.get_realtime_weather = original

    assert res.status_code == 200, res.text
    data = res.json()
    assert data["weather"] == "天气未获取", data
    assert data["source"] == "weather_fallback", data
    print("ok weather_endpoint")


if __name__ == "__main__":
    main()
