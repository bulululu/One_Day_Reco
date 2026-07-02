import os

from backend.services.database import DATABASE_URL
from backend.services.env import load_env_file


load_env_file()


def _configured(name: str) -> bool:
    return bool(os.getenv(name, "").strip())


def get_config_status(llm_available: bool) -> dict:
    return {
        "services": {
            "llm": {
                "label": "推荐和聊天 Agent",
                "configured": llm_available,
                "is_realtime": llm_available,
                "source": "Azure OpenAI" if llm_available else "fallback_rules",
                "detail": "用于生成个性化推荐和对话。",
            },
            "weather": {
                "label": "实时天气",
                "configured": True,
                "is_realtime": True,
                "source": "AMap/Open-Meteo",
                "detail": "优先使用高德天气；未配置或失败时回退 Open-Meteo。",
            },
            "places": {
                "label": "真实地点",
                "configured": _configured("AMAP_API_KEY"),
                "is_realtime": _configured("AMAP_API_KEY"),
                "source": "AMap" if _configured("AMAP_API_KEY") else "search_fallback",
                "detail": "配置 AMAP_API_KEY 后返回 POI、周边地点和路线；未配置时只返回搜索入口。",
            },
            "activities": {
                "label": "活动聚合",
                "configured": _configured("ONEDAYRECO_ACTIVITY_API_URL"),
                "is_realtime": _configured("ONEDAYRECO_ACTIVITY_API_URL"),
                "source": "external_api" if _configured("ONEDAYRECO_ACTIVITY_API_URL") else "local_fallback",
                "detail": "配置外部活动 API 后使用实时活动候选；否则使用精选兜底库。",
            },
            "games": {
                "label": "游戏活动",
                "configured": _configured("ONEDAYRECO_GAME_API_URL"),
                "is_realtime": _configured("ONEDAYRECO_GAME_API_URL"),
                "source": "external_api" if _configured("ONEDAYRECO_GAME_API_URL") else "local_fallback",
                "detail": "配置外部游戏 API 后使用实时游戏候选；否则使用精选兜底库。",
            },
            "movies": {
                "label": "电影候选",
                "configured": True,
                "is_realtime": True,
                "source": "Maoyan unofficial + TMDb fallback",
                "detail": "优先尝试猫眼 M 站热映片单；失败后使用 TMDb 或精选兜底，场次和票价仍跳转票务平台确认。",
            },
            "content": {
                "label": "视频内容",
                "configured": True,
                "is_realtime": True,
                "source": "Bilibili/search_fallback",
                "detail": "优先尝试 B 站搜索；失败时返回明确搜索入口和精选兜底。",
            },
            "database": {
                "label": "用户和历史数据",
                "configured": True,
                "is_realtime": True,
                "source": "PostgreSQL" if DATABASE_URL.startswith("postgresql") else "SQLite",
                "detail": "保存账号、画像、反馈、推荐历史和行为事件。",
            },
        }
    }
