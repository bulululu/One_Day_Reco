import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.services import content_service, movie_service


def main():
    client = TestClient(app)

    original_movies = movie_service._fetch_now_playing
    original_maoyan = movie_service._fetch_maoyan_now_playing
    original_content = content_service._search_bilibili
    movie_service._fetch_maoyan_now_playing = lambda location, limit: [
        {
            "id": "maoyan-1",
            "title": "《猫眼测试电影》",
            "duration": "约 101 分钟",
            "rating": "猫眼 9.1",
            "source": "Maoyan unofficial",
            "availability": "今天12家影院放映35场",
            "overview": "喜剧 · 今天放映",
        }
    ]
    movie_service._fetch_now_playing = lambda region, limit: [
        {
            "id": "tmdb-1",
            "title": "《测试电影》",
            "duration": "约 108 分钟",
            "rating": "TMDb 8.1/10",
            "source": "TMDb",
            "overview": "测试电影简介",
        }
    ]
    content_service._search_bilibili = lambda keyword, limit: [
        {
            "id": "BV_TEST",
            "title": "测试纪录片",
            "duration": "48:00",
            "rating": "播放 12345",
            "source": "Bilibili",
            "description": "测试内容简介",
            "action_url": "https://www.bilibili.com/video/BV_TEST",
            "action_label": "B站观看",
        }
    ]
    try:
        movies_res = client.get("/api/movies/nearby?location=上海徐汇&limit=1")
        assert movies_res.status_code == 200, movies_res.text
        movies = movies_res.json()
        assert movies["source"] == "Maoyan unofficial", movies
        assert movies["is_realtime"] is True, movies
        assert movies["showtime_realtime"] is False, movies
        assert "确认" in movies["showtime_note"], movies
        assert movies["movies"][0]["title"] == "《猫眼测试电影》", movies
        assert movies["movies"][0]["booking_url"], movies
        assert movies["movies"][0]["availability"] == "今天12家影院放映35场", movies
        assert movies["movies"][0]["showtime_status"] == "requires_ticket_platform_check", movies
        assert movies["movies"][0]["estimated_price"], movies

        content_res = client.get("/api/content/search?q=纪录片&limit=1")
        assert content_res.status_code == 200, content_res.text
        content = content_res.json()
        assert content["source"] == "Bilibili", content
        assert content["is_realtime"] is True, content
        assert content["items"][0]["title"] == "测试纪录片", content
        assert content["items"][0]["action_url"], content
    finally:
        movie_service._fetch_maoyan_now_playing = original_maoyan
        movie_service._fetch_now_playing = original_movies
        content_service._search_bilibili = original_content

    print("ok media_sources")


if __name__ == "__main__":
    main()
