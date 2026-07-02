import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.place_service import get_amap_weather, get_route, search_nearby_places, search_places


def main():
    if not os.getenv("AMAP_API_KEY", "").strip():
        raise SystemExit("missing AMAP_API_KEY")

    text = search_places("咖啡馆", city="上海", limit=1)
    around = search_nearby_places("电影院", longitude=121.43676, latitude=31.18831, radius=5000, limit=1)
    weather = get_amap_weather("上海 徐汇")
    route = get_route("121.43676,31.18831", "121.462437,31.230429")

    assert text["is_realtime"] and text["places"], text
    assert around["is_realtime"] and around["places"], around
    assert weather["source"] == "AMap" and weather["weather"], weather
    assert route["is_realtime"] and route["distance_meters"], route
    print("ok amap_services", text["places"][0]["name"], around["places"][0]["name"], weather["display"])


if __name__ == "__main__":
    main()
