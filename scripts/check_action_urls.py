import sys
import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from backend.agents.recommendation_agent import RecommendationAgent


BLOCKED_ACTIVITY_TERMS = ["大众点评", "美团", "百度地图", "dianping.com", "meituan", "map.baidu.com"]


def check_activity_catalog_links():
    path = PROJECT_ROOT / "backend" / "data" / "activities.json"
    catalog = json.loads(path.read_text(encoding="utf-8"))
    for item in catalog:
        serialized = json.dumps(item, ensure_ascii=False)
        hits = [term for term in BLOCKED_ACTIVITY_TERMS if term in serialized]
        assert not hits, f"{item.get('id')} contains legacy platform terms: {hits}"


def main():
    check_activity_catalog_links()
    agent = RecommendationAgent()
    cases = [
        (
            {"name": "看一部纪录片", "subcategory": "纪录片", "action_url": "https://search.bilibili.com", "source_platform": "B站"},
            {"activity_name": "看一部纪录片", "specific_info": {"name": "《人生果实》", "source": "B站搜索"}},
            "https://search.bilibili.com/all?keyword=%E4%BA%BA%E7%94%9F%E6%9E%9C%E5%AE%9E",
        ),
        (
            {"name": "看一场电影", "subcategory": "电影", "action_url": "https://maoyan.com", "source_platform": "猫眼"},
            {"activity_name": "看一场电影", "specific_info": {"name": "《你想活出怎样的人生》", "location": "上海 徐汇"}},
            "https://m.maoyan.com/search?keyword=",
        ),
        (
            {"name": "看话剧", "subcategory": "演出", "action_url": "https://www.damai.cn", "source_platform": "大麦"},
            {"activity_name": "看话剧", "specific_info": {"name": "不眠之夜"}},
            "https://search.damai.cn/search.html?keyword=%E4%B8%8D%E7%9C%A0%E4%B9%8B%E5%A4%9C",
        ),
        (
            {"name": "玩游戏", "subcategory": "游戏", "action_url": "https://store.steampowered.com", "source_platform": "Steam"},
            {"activity_name": "玩游戏", "specific_info": {"name": "Stardew Valley"}},
            "https://store.steampowered.com/search/?term=Stardew%20Valley",
        ),
    ]
    for act, rec, expected_prefix in cases:
        agent._attach_activity_metadata(rec, act)
        assert rec["action_url"].startswith(expected_prefix), rec

    specific = {
        "name": "玩游戏",
        "subcategory": "游戏",
        "action_url": "https://store.steampowered.com/search/?term=Dorfromantik",
        "source_platform": "Steam",
    }
    rec = {"activity_name": "玩游戏", "specific_info": {"name": "Dorfromantik"}}
    agent._attach_activity_metadata(rec, specific)
    assert rec["action_url"] == specific["action_url"], rec
    print("ok action_urls")


if __name__ == "__main__":
    main()
