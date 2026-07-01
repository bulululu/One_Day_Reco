"""
推荐 Agent 核心模块
基于 MBTI 画像 + 活动库 + 上下文，用 LLM 生成个性化活动推荐
v0.2: 朋友对话式语气 + 互动仔人格 + 可行性约束 + 聊天接口
"""

import json
import os
from datetime import datetime
from typing import Optional
from urllib.parse import quote
from openai import AzureOpenAI
from backend.services.activity_service import get_activity_catalog
from backend.services.content_service import search_content
from backend.services.movie_service import get_movie_candidates
from backend.services.place_service import search_places
from backend.services.recommendation_quality import quality_issues

# 项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_config() -> dict:
    """加载配置"""
    config_path = os.path.join(PROJECT_ROOT, "config", "settings.yaml")
    with open(config_path, "r", encoding="utf-8") as f:
        try:
            import yaml
            return yaml.safe_load(f)
        except ModuleNotFoundError:
            f.seek(0)
            return _load_simple_yaml(f.read())


def _load_simple_yaml(text: str) -> dict:
    """解析当前 settings.yaml 使用到的简单二级 YAML，避免本地缺 PyYAML 时无法启动。"""
    config: dict = {}
    current_section: Optional[str] = None
    for raw_line in text.splitlines():
        line = raw_line.split("#", 1)[0].rstrip()
        if not line.strip():
            continue
        if not line.startswith(" ") and line.endswith(":"):
            current_section = line[:-1].strip()
            config[current_section] = {}
            continue
        if current_section and ":" in line:
            key, value = line.strip().split(":", 1)
            value = value.strip().strip('"').strip("'")
            if value.isdigit():
                parsed_value: object = int(value)
            else:
                try:
                    parsed_value = float(value)
                except ValueError:
                    parsed_value = value
            config[current_section][key.strip()] = parsed_value
    return config


def load_activities() -> list:
    """加载活动库"""
    config = load_config()
    activities_path = os.path.join(PROJECT_ROOT, config["DATA"]["activities_path"])
    with open(activities_path, "r", encoding="utf-8") as f:
        return json.load(f)


# ==================== MBTI 语气映射 ====================

MBTI_TONE_MAP = {
    # 维度组合 -> 语气风格描述
    "F": "温柔、有情感共鸣、关心对方感受。像一个贴心的朋友，先关心再说事。",
    "T": "直接、简洁、给理由。不废话，给出关键信息让对方自己判断。",
    "E": "热情、活泼、有感染力。语气上扬，用感叹号，像在拉对方出门。",
    "I": "平和、不催促、留空间。不施压，给对方选择的自由，'不想动也没事'。",
    "P": "灵活、随意、不施压。'随便看看''你挑'，没有时间表。",
    "J": "有计划性、给出明确安排。时间、路线、预计时长都帮对方想好。",
}

MBTI_PERSONALITY_MAP = {
    "INTJ": "冷静理性，话少但到位。像一个靠谱的军师，帮对方规划好一切。语气：直接+平和+有计划。",
    "INTP": "理性但随性，不施压。像一个聪明的朋友，给出信息让对方自己选。语气：直接+平和+灵活。",
    "ENTJ": "强势热情但有计划。像一个行动派队长，直接说安排。语气：直接+热情+有计划。",
    "ENTP": "好奇活泼，点子多。像一个有趣的损友，用好奇心勾引对方。语气：热情+灵活+给理由。",
    "INFJ": "温柔但有洞察力。像一个懂对方的朋友，先共情再建议。语气：温柔+平和+关心感受。",
    "INFP": "温柔、灵活、关心感受。像一个治愈系朋友，不强求，'不想动也没事'。语气：温柔+平和+灵活+关心感受。",
    "ENFJ": "热情温柔有感染力。像一个暖心的社交达人朋友，热情地拉对方出去。语气：温柔+热情+有计划。",
    "ENFP": "热情活泼有感染力。像一个永远充满能量的朋友，用兴奋感感染对方。语气：热情+灵活+关心感受。",
    "ISTJ": "稳重务实，有计划。像一个靠谱的老友，直接说安排和细节。语气：直接+平和+有计划。",
    "ISFJ": "温柔细心，先关心再建议。像一个体贴的朋友，注意到对方的疲惫。语气：温柔+平和+有计划。",
    "ESTJ": "直接高效有计划。像一个利落的朋友，不废话直接安排。语气：直接+热情+有计划。",
    "ESFJ": "热情温柔关心人。像一个热心肠的朋友，热情地照顾对方。语气：温柔+热情+有计划。",
    "ISTP": "冷静随性，不废话。像一个酷酷的朋友，给信息让对方自己决定。语气：直接+平和+灵活。",
    "ISFP": "温柔随性，不施压。像一个安静的艺术家朋友，轻声细语地建议。语气：温柔+平和+灵活。",
    "ESTP": "热情直接行动派。像一个爱冒险的朋友，直接喊对方出去。语气：直接+热情+灵活。",
    "ESFP": "热情活泼有感染力。像一个派对动物朋友，用兴奋感拉对方出门。语气：热情+灵活+关心感受。",
}

MBTI_THEME_MAP = {
    "INTJ": {"colors": {"bg": "#1a1a2e", "card": "#16213e", "accent": "#e94560", "text": "#eee", "subtext": "#999"}, "radius": "4px", "avatar": "🦉", "name": "小策略"},
    "INTP": {"colors": {"bg": "#1e1e2e", "card": "#2a2a3e", "accent": "#89b4fa", "text": "#cdd6f4", "subtext": "#888"}, "radius": "6px", "avatar": "🤖", "name": "小逻辑"},
    "ENTJ": {"colors": {"bg": "#0f0f1a", "card": "#1a1a2e", "accent": "#00d9ff", "text": "#eee", "subtext": "#999"}, "radius": "0px", "avatar": "🐯", "name": "小队长"},
    "ENTP": {"colors": {"bg": "#1a1520", "card": "#241e30", "accent": "#ff79c6", "text": "#eee", "subtext": "#999"}, "radius": "8px", "avatar": "🦊", "name": "小点子"},
    "INFJ": {"colors": {"bg": "#1c1726", "card": "#2a2339", "accent": "#c4a7e7", "text": "#e0def4", "subtext": "#999"}, "radius": "16px", "avatar": "🦌", "name": "小洞察"},
    "INFP": {"colors": {"bg": "#2a1f2e", "card": "#352840", "accent": "#f6c177", "text": "#f0e6e6", "subtext": "#b0a0a0"}, "radius": "20px", "avatar": "🐰", "name": "小暖"},
    "ENFJ": {"colors": {"bg": "#2a1f1a", "card": "#3a2a22", "accent": "#ff9e64", "text": "#fff5ee", "subtext": "#c0a090"}, "radius": "16px", "avatar": "🐶", "name": "小暖阳"},
    "ENFP": {"colors": {"bg": "#2a2418", "card": "#353020", "accent": "#ffe066", "text": "#fffbe6", "subtext": "#c0b860"}, "radius": "20px", "avatar": "🌻", "name": "小太阳"},
    "ISTJ": {"colors": {"bg": "#1a1e2a", "card": "#242a3a", "accent": "#6cace4", "text": "#dde", "subtext": "#889"}, "radius": "4px", "avatar": "🦅", "name": "小稳"},
    "ISFJ": {"colors": {"bg": "#241f2a", "card": "#2e2839", "accent": "#d4a5d4", "text": "#f0e6f0", "subtext": "#a090a0"}, "radius": "16px", "avatar": "🕊️", "name": "小护"},
    "ESTJ": {"colors": {"bg": "#1a2a1f", "card": "#243a2e", "accent": "#5cd685", "text": "#e0f0e0", "subtext": "#90b090"}, "radius": "0px", "avatar": "🦬", "name": "小执行"},
    "ESFJ": {"colors": {"bg": "#2a1f20", "card": "#3a282a", "accent": "#ff8a80", "text": "#fff0ee", "subtext": "#c0a0a0"}, "radius": "16px", "avatar": "🐝", "name": "小贴心"},
    "ISTP": {"colors": {"bg": "#1e282e", "card": "#283440", "accent": "#73c991", "text": "#dde8e0", "subtext": "#889"}, "radius": "6px", "avatar": "🐱", "name": "小酷"},
    "ISFP": {"colors": {"bg": "#26201e", "card": "#332a28", "accent": "#ea8f8f", "text": "#f0e8e6", "subtext": "#a09898"}, "radius": "20px", "avatar": "🦋", "name": "小雅"},
    "ESTP": {"colors": {"bg": "#2a2018", "card": "#3a2e22", "accent": "#ffb74d", "text": "#fff5e6", "subtext": "#c0a878"}, "radius": "8px", "avatar": "🐆", "name": "小冲"},
    "ESFP": {"colors": {"bg": "#2a2518", "card": "#353022", "accent": "#ffd54f", "text": "#fffce6", "subtext": "#c0b870"}, "radius": "20px", "avatar": "🦜", "name": "小闪耀"},
}


SPECIFICITY_RULES = """
## 产品定位硬约束
OneDayReco 要在任何地点、任何时间帮用户找到现在可以做的事，减少决策成本。
推荐范围可以很小，例如一个人打游戏、看纪录片、吃饭、散步；也可以很大，例如周末短途旅行。
推荐不是泛泛给灵感，而是直接替用户做掉第一步选择。

## 推荐具体化原则（非常重要！）
推荐必须具体到可以直接执行，禁止泛泛而谈。每条推荐的 recommend_text 和 tips 中必须包含具体信息：

- 电影推荐：必须包含电影名称、电影院名称或明确检索路径、场次时间、片长、评分。
- 餐厅推荐：必须包含餐厅名称、菜系、地址或商圈、人均价格、评分/口碑信息、是否需要排队的判断。
- 户外活动：必须包含具体地点名称、地址/入口、当前天气适宜度、预计耗时、路线或交通建议。
- 居家活动：必须包含具体内容，例如纪录片名称+B站搜索词、游戏名称+平台+单人/多人+预计时长。
- 运动：必须包含具体运动名称、场馆名称/地址、价格、开放时段。
- 展览/演出：必须包含名称、场馆、地址、票价、展期/场次。
- 购物/市集：必须包含市集/商场名称、地址、特色、开放时间。
- 旅行：必须包含目的地、出发方式、预计路程、建议停留时间、预算范围。

绝对禁止："去看场电影吧""去公园走走""找个纪录片看看""做做运动""出去吃点东西"。
如果当前没有实时外部数据，不要编造实时排片或排队结果；必须给出明确获取路径，例如"打开猫眼搜《你想活出怎样的人生》，选择离你最近的影院和 19:00 后场次"。
"""


class RecommendationAgent:
    """活动推荐 Agent v0.2"""

    def __init__(self):
        self.config = load_config()
        self.activities = load_activities()
        self.client = None
        self._init_llm_client()

    def _init_llm_client(self):
        """初始化 LLM 客户端"""
        api_cfg = self.config["GPT_API"]
        try:
            self.client = AzureOpenAI(
                azure_endpoint=api_cfg["azure_endpoint"],
                api_key=api_cfg["api_key"],
                api_version=api_cfg["api_version"],
                default_headers={"X-TT-LOGID": api_cfg["log_id"]},
            )
            print("[Agent] LLM 客户端初始化成功")
        except Exception as e:
            print(f"[Agent] LLM 客户端初始化失败: {e}")
            self.client = None

    def _build_user_profile_text(self, user_profile: dict) -> str:
        """构建用户画像文本"""
        mbti = user_profile.get("mbti", "未知")
        preferences = user_profile.get("preferences", {})
        behavior_memory = user_profile.get("behavior_memory") or {}

        profile_text = f"""
用户MBTI: {mbti}
社交偏好: {preferences.get('social_frequency', '未知')}
预算范围: {preferences.get('budget', '不限')}
通勤容忍: {preferences.get('commute_tolerance', '未知')}
特殊偏好: {preferences.get('notes', '无')}
历史反馈摘要: {user_profile.get('feedback_summary', '暂无')}
近期行为记忆: {behavior_memory.get('summary', '暂无')}
对话偏好约束: {', '.join(behavior_memory.get('preference_constraints') or []) or '暂无'}
"""
        return profile_text.strip()

    def _behavior_memory_sets(self, user_profile: dict) -> tuple[set[str], set[str], set[str]]:
        behavior_memory = user_profile.get("behavior_memory") or {}
        positive_ids = set(behavior_memory.get("positive_activity_ids") or [])
        negative_ids = set(behavior_memory.get("negative_activity_ids") or [])
        recent_ids = set(behavior_memory.get("recent_activity_ids") or [])
        return positive_ids, negative_ids, recent_ids

    def _build_context_text(self, context: Optional[dict] = None) -> str:
        """构建当日上下文文本"""
        now = datetime.now()
        weekday = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][now.weekday()]

        ctx = context or {}
        weather = ctx.get("weather", "未知")
        location = ctx.get("location", "未知")
        mode = ctx.get("mode", "个人")
        mode_note = ctx.get("mode_note", "默认个人活动推荐")
        trigger_reason = ctx.get("trigger_reason", "")
        screen_usage = ctx.get("screen_usage", {})
        time_period = "上午" if now.hour < 12 else ("下午" if now.hour < 18 else "晚上")
        trigger_text = ""
        if trigger_reason:
            trigger_text = f"""
触发原因: {trigger_reason}
屏幕使用: {screen_usage.get('app_name', '未知应用')} 连续使用 {screen_usage.get('continuous_minutes', screen_usage.get('usage_minutes', 0))} 分钟
触发策略: 如果天气和时间安全，优先推荐短时、低门槛、低人群密度的户外活动，帮助用户从室内屏幕状态切出来；不安全时推荐室内离屏活动。
"""

        return f"""
当前时间: {now.strftime('%Y-%m-%d')} {weekday} {now.strftime('%H:%M')}
时间段: {time_period}
天气: {weather}
位置: {location}
推荐模式: {mode}
模式说明: {mode_note}
{trigger_text}
"""

    def _build_activities_text(self, candidate_activities: list) -> str:
        """构建候选活动文本（含可行性字段）"""
        activities_text = []
        for act in candidate_activities:
            specific_info = act.get("specific_info") or {}
            specific_text = ""
            if specific_info:
                specific_text = (
                    f" | 具体信息:"
                    f"名称:{specific_info.get('name', '')}; "
                    f"平台/地点:{specific_info.get('platform', specific_info.get('location', ''))}; "
                    f"类型:{specific_info.get('game_type', '')}; "
                    f"单人/多人:{specific_info.get('player_mode', '')}; "
                    f"预计时长:{specific_info.get('duration', '')}; "
                    f"价格:{specific_info.get('price', '')}; "
                    f"评价:{specific_info.get('rating', '')}; "
                    f"来源:{specific_info.get('source', '')}"
                )
            activities_text.append(
                f"- [{act['id']}] {act['name']} | 类别:{act['category']} | "
                f"人群密度:{act['crowd_density']} | 社交强度:{act['social_intensity']} | "
                f"能耗:{act['energy_cost']} | 室内外:{act['indoor_outdoor']} | "
                f"时长:{act['duration_hours']}h | 预算:{act['budget']} | "
                f"适合时段:{act.get('time_window', '全天')} | "
                f"启动门槛:{act.get('convenience', '中')} | "
                f"最低准备时间:{act.get('min_prep_time', '10分钟')} | "
                f"安全提示:{act.get('safety_note', '无')} | "
                f"可调节:{act.get('adjustable_factors', '无')} | "
                f"情绪效果:{act['mood_effect']}"
                f"{specific_text}"
            )
        return "\n".join(activities_text)

    def _place_query_for_activity(self, act: dict) -> str:
        subcategory = act.get("subcategory", "")
        name = act.get("name", "")
        mapping = {
            "电影": "电影院",
            "阅读": "独立书店 咖啡",
            "咖啡": "安静咖啡馆",
            "美食": "餐厅",
            "户外自然": "公园",
            "城市探索": name or "附近可去的地方",
            "展览": "展览 美术馆",
            "运动": "运动场馆",
        }
        return mapping.get(subcategory, name)

    def _lookup_places_for_candidates(self, candidates: list, context: Optional[dict] = None) -> dict:
        location = (context or {}).get("location", "")
        place_hints = {}
        for act in candidates[:8]:
            if act.get("indoor_outdoor") not in {"室外", "室内外"} and act.get("subcategory") not in {
                "电影",
                "阅读",
                "咖啡",
                "美食",
                "城市探索",
                "展览",
                "运动",
            }:
                continue
            query = self._place_query_for_activity(act)
            if not query:
                continue
            result = search_places(query, location=location, limit=3)
            place_hints[act["id"]] = result
        return place_hints

    def _build_place_hints_text(self, place_hints: dict) -> str:
        if not place_hints:
            return "无"
        lines = []
        for activity_id, result in place_hints.items():
            if result.get("is_realtime") and result.get("places"):
                details = []
                for place in result["places"][:3]:
                    label = place.get("name", "")
                    address = place.get("address", "")
                    area = place.get("business_area") or place.get("adname", "")
                    distance = place.get("distance", "")
                    details.append(f"{label}（{area}，{address}，{distance}）")
                lines.append(f"- 活动 {activity_id}: 高德实时地点候选: {'; '.join(details)}")
            else:
                lines.append(
                    f"- 活动 {activity_id}: 暂无实时地点数据，使用搜索入口确认: "
                    f"{result.get('search_url', '')}"
                )
        return "\n".join(lines)

    def _lookup_movie_hints_for_candidates(self, candidates: list, context: Optional[dict] = None) -> dict:
        if not any(act.get("subcategory") == "电影" for act in candidates):
            return {}
        return get_movie_candidates(location=(context or {}).get("location", ""), limit=3)

    def _build_movie_hints_text(self, movie_hints: dict) -> str:
        if not movie_hints:
            return "无"
        lines = [
            f"电影来源: {movie_hints.get('source', 'unknown')}；"
            f"电影实时: {'是' if movie_hints.get('is_realtime') else '否'}；"
            f"场次实时: {'是' if movie_hints.get('showtime_realtime') else '否'}；"
            f"{movie_hints.get('showtime_note', '')}"
        ]
        for movie in (movie_hints.get("movies") or [])[:3]:
            cinemas = movie.get("cinema_candidates") or []
            cinema_text = "、".join(cinema.get("name", "") for cinema in cinemas[:2] if cinema.get("name"))
            if not cinema_text:
                cinema_text = movie.get("cinema_search_url") or "打开猫眼/高德确认最近影院"
            lines.append(
                f"- {movie.get('title', '')}: {movie.get('duration', '')}，"
                f"{movie.get('rating', '')}，影院候选: {cinema_text}，"
                f"订票入口: {movie.get('booking_url', '')}"
            )
        return "\n".join(lines)

    def _lookup_content_hints_for_candidates(self, candidates: list, message: str = "") -> dict:
        candidate_text = " ".join(f"{act.get('subcategory', '')} {act.get('name', '')}" for act in candidates)
        combined = f"{candidate_text} {message}"
        if not any(keyword in combined for keyword in ["纪录片", "视频", "B站", "公开课", "电影夜"]):
            return {}
        query = "纪录片"
        if "公开课" in combined:
            query = "公开课"
        elif "电影" in message and "纪录片" not in message:
            query = "电影解说"
        return search_content(q=query, limit=3)

    def _build_content_hints_text(self, content_hints: dict) -> str:
        if not content_hints:
            return "无"
        lines = [
            f"内容来源: {content_hints.get('source', 'unknown')}；"
            f"内容实时: {'是' if content_hints.get('is_realtime') else '否'}；"
            f"搜索词: {content_hints.get('query', '')}"
        ]
        for item in (content_hints.get("items") or [])[:3]:
            lines.append(
                f"- {item.get('title', '')}: {item.get('duration', '')}，"
                f"{item.get('rating', '')}，入口: {item.get('action_url', '')}"
            )
        return "\n".join(lines)

    def _message_candidate_score(self, act: dict, message: str) -> int:
        text = f"{act.get('name', '')} {act.get('category', '')} {act.get('subcategory', '')} {act.get('description', '')}"
        info = act.get("specific_info") or {}
        info_text = " ".join(str(info.get(key, "")) for key in ["platform", "game_type", "player_mode", "source", "setup"])
        score = 0
        pairs = [
            (("电影", "影院"), ("电影",)),
            (("吃", "饭", "咖啡"), ("美食", "咖啡", "餐厅")),
            (("走走", "散步", "公园"), ("散步", "公园", "户外")),
            (("纪录片", "不出门", "在家", "居家"), ("纪录片", "居家", "室内")),
        ]
        if any(any(word in message for word in wants) and any(word in text for word in targets) for wants, targets in pairs):
            score -= 10
        if "游戏" in message:
            if any(word in info_text for word in ["Steam", "Switch", "App Store", "手机", "PC", "主机"]):
                score -= 12
            elif "游戏" in text:
                score -= 4
            if any(word in message for word in ["一个人", "单人", "自己"]):
                if "单人" in info_text:
                    score -= 3
                elif any(word in info_text for word in ["多人", "双人", "联机", "合作", "朋友", "2-4"]):
                    score += 10
            if any(word in info_text for word in ["线下", "门店"]):
                score += 6
        return score

    def _get_activity_catalog(self) -> dict:
        return get_activity_catalog(self.activities)

    def _activity_source(self, catalog: dict, candidates: list) -> dict:
        return {
            "source": catalog.get("source", "local_fallback"),
            "is_realtime": bool(catalog.get("is_realtime", False)),
            "total_count": catalog.get("count", len(catalog.get("activities", []))),
            "candidate_count": len(candidates),
        }

    def _pre_filter_activities(
        self,
        user_profile: dict,
        context: Optional[dict] = None,
        activities: Optional[list] = None,
    ) -> list:
        """预筛选活动（规则层，减少 LLM 输入量）"""
        mbti = user_profile.get("mbti", "")
        candidates = []
        source_activities = activities if activities is not None else self._get_activity_catalog()["activities"]

        is_introvert = "I" in mbti
        ctx = context or {}
        weather = ctx.get("weather", "")
        trigger_type = ctx.get("trigger_type", "")
        positive_ids, negative_ids, recent_ids = self._behavior_memory_sets(user_profile)
        constraints = set((user_profile.get("behavior_memory") or {}).get("preference_constraints") or [])
        fresh_candidates = []
        recent_candidates = []

        # 当前时间判断
        now = datetime.now()
        current_hour = now.hour

        for act in source_activities:
            activity_id = act.get("id", "")
            if activity_id in negative_ids:
                continue

            # 天气过滤：室外活动在雨天排除
            if weather and act.get("indoor_outdoor") == "室外":
                if any(word in weather for word in ["雨", "雪", "雷"]) and "雨" not in act.get("weather_suitable", []):
                    continue

            # 时段过滤：检查活动适合时段
            time_window = act.get("time_window", "全天")
            if time_window != "全天":
                if not self._is_time_in_window(current_hour, time_window):
                    continue

            # 内向用户降低高人群密度活动的优先级
            if is_introvert and act.get("crowd_density") == "高":
                if not act.get("adjustable_factors"):
                    continue

            if "low_crowd_first" in constraints and act.get("crowd_density") == "高":
                continue

            # 安全过滤：夜间不推荐需要远途或户外的活动
            if current_hour >= 20 and act.get("indoor_outdoor") == "室外":
                safety = act.get("safety_note", "")
                if "结伴" in safety or "安全" in safety.lower():
                    continue

            if activity_id in recent_ids and activity_id not in positive_ids:
                recent_candidates.append(act)
            else:
                fresh_candidates.append(act)

        candidates = fresh_candidates + recent_candidates
        if positive_ids:
            candidates = sorted(candidates, key=lambda act: 0 if act.get("id") in positive_ids else 1)

        if constraints:
            def constraint_score(act: dict) -> int:
                score = 0
                if act.get("id") in recent_ids and act.get("id") not in positive_ids:
                    score += 5
                text = f"{act.get('name', '')} {act.get('category', '')} {act.get('subcategory', '')}"
                if "indoor_first" in constraints and act.get("indoor_outdoor") in {"室内", "室内外"}:
                    score -= 3
                if "outdoor_first" in constraints and act.get("indoor_outdoor") in {"室外", "室内外"}:
                    score -= 3
                if "low_budget_first" in constraints and str(act.get("budget", "")).startswith(("0", "低")):
                    score -= 2
                if "nearby_first" in constraints and act.get("convenience") == "高":
                    score -= 2
                if "low_crowd_first" in constraints and act.get("crowd_density") in {"低", "极低"}:
                    score -= 2
                if "movie_interest" in constraints and "电影" in text:
                    score -= 4
                if "game_interest" in constraints and "游戏" in text:
                    score -= 4
                return score

            candidates = sorted(candidates, key=constraint_score)

        if trigger_type == "screen_overuse":
            bad_weather = any(word in weather for word in ["雨", "雪", "雷", "大风", "冷"])
            if not bad_weather and current_hour < 20:
                outdoor = [
                    act for act in candidates
                    if act.get("indoor_outdoor") == "室外"
                    and act.get("energy_cost") in ["低", "中"]
                    and act.get("crowd_density") in ["低", "中"]
                ]
                if outdoor:
                    return outdoor + [act for act in candidates if act not in outdoor]

        return candidates

    def trigger_recommend(self, user_profile: dict, trigger: dict, context: Optional[dict] = None) -> dict:
        """Generate a recommendation from app usage triggers."""
        usage_minutes = int(trigger.get("usage_minutes", 0) or 0)
        continuous_minutes = int(trigger.get("continuous_minutes", usage_minutes) or usage_minutes)
        app_name = trigger.get("app_name", "屏幕应用")
        app_category = trigger.get("app_category", "screen")

        trigger_context = dict(context or {})
        trigger_context.update(
            {
                "trigger_type": "screen_overuse",
                "trigger_reason": f"{app_name} 使用时间偏长",
                "screen_usage": {
                    "app_name": app_name,
                    "app_category": app_category,
                    "usage_minutes": usage_minutes,
                    "continuous_minutes": continuous_minutes,
                },
                "mode": trigger_context.get("mode", "个人"),
                "mode_note": trigger_context.get("mode_note", "屏幕使用时间触发的即时推荐"),
            }
        )
        return self.recommend(user_profile, trigger_context)

    def _enforce_recommendation_quality(
        self,
        result: dict,
        activity_map: dict,
        context: Optional[dict] = None,
        place_hints: Optional[dict] = None,
    ) -> dict:
        """Patch vague LLM recommendations before they leave the backend."""
        repaired = 0
        for rec in result.get("recommendations", []):
            issues = quality_issues(rec)
            if not issues:
                continue
            act = activity_map.get(rec.get("activity_id", ""))
            if not act:
                rec["quality_issues"] = issues
                continue
            rec.update(self._build_fallback_recommendation_copy(act, context, place_hints))
            rec["quality_repaired"] = True
            rec["quality_issues"] = issues
            repaired += 1
        if repaired:
            result["quality_notice"] = f"repaired_{repaired}_recommendations"
            print(f"[Agent] 推荐质量修复: {repaired} 条")
        return result

    def _dedupe_recommendations(self, result: dict) -> dict:
        unique = []
        seen: set[tuple[str, str]] = set()
        duplicates = 0
        for rec in result.get("recommendations", []):
            specific = rec.get("specific_info") or {}
            key = (
                str(rec.get("activity_id") or "").strip(),
                str(specific.get("name") or rec.get("activity_name") or "").strip(),
            )
            if key in seen:
                duplicates += 1
                continue
            seen.add(key)
            unique.append(rec)
        result["recommendations"] = unique
        if duplicates:
            result["dedupe_notice"] = f"removed_{duplicates}_duplicate_recommendations"
        return result

    def _finalize_result(
        self,
        result: dict,
        activity_map: dict,
        theme: dict,
        activity_source: dict,
        context: Optional[dict] = None,
        place_hints: Optional[dict] = None,
    ) -> dict:
        for rec in result.get("recommendations", []):
            aid = rec.get("activity_id", "")
            if aid in activity_map:
                self._attach_activity_metadata(rec, activity_map[aid])
        result["companion"] = {"avatar": theme["avatar"], "name": theme["name"]}
        result["theme"] = theme
        result["activity_source"] = activity_source
        result = self._enforce_recommendation_quality(result, activity_map, context, place_hints)
        return self._dedupe_recommendations(result)

    def _attach_activity_metadata(self, rec: dict, act: dict) -> dict:
        if not rec.get("action_url"):
            rec["action_url"] = act.get("action_url", "")
        if not rec.get("action_label"):
            rec["action_label"] = act.get("action_label", "")
        rec["action_url"] = self._specific_action_url(rec, act, rec.get("action_url", ""))
        rec["image_query"] = act.get("image_query", act["name"])
        rec["category"] = act.get("category", "")
        rec["budget"] = act.get("budget", "")
        return rec

    def _is_generic_action_url(self, url: str) -> bool:
        clean = (url or "").rstrip("/")
        return clean in {
            "https://maoyan.com",
            "https://m.maoyan.com",
            "https://www.damai.cn",
            "https://search.bilibili.com",
            "https://www.bilibili.com",
            "https://ditu.amap.com",
            "https://store.steampowered.com",
        }

    def _specific_action_url(self, rec: dict, act: dict, current_url: str) -> str:
        if current_url and not self._is_generic_action_url(current_url):
            return current_url

        info = rec.get("specific_info") or {}
        query_name = info.get("name") or rec.get("activity_name") or act.get("name", "")
        location = info.get("location") or ""
        source = f"{info.get('source', '')} {act.get('source_platform', '')} {act.get('action_label', '')}"
        clean_query_name = str(query_name).replace("《", "").replace("》", "").strip()
        query = quote(clean_query_name)
        local_query = quote(f"{location} {query_name}".strip())

        if "B站" in source or "Bilibili" in source or act.get("subcategory") == "纪录片":
            return f"https://search.bilibili.com/all?keyword={query}"
        if "Steam" in source or act.get("subcategory") == "游戏":
            return f"https://store.steampowered.com/search/?term={query}"
        if "猫眼" in source or act.get("subcategory") == "电影":
            return f"https://m.maoyan.com/search?keyword={local_query}"
        if "大麦" in source or act.get("subcategory") in {"演出", "赛事"}:
            return f"https://search.damai.cn/search.html?keyword={query}"
        return f"https://ditu.amap.com/search?query={local_query}"

    def _is_time_in_window(self, current_hour: int, time_window: str) -> bool:
        """检查当前时间是否在活动适合时段内"""
        try:
            windows = time_window.split(",")
            for w in windows:
                w = w.strip()
                if "-" in w:
                    parts = w.split("-")
                    start = int(parts[0].split(":")[0])
                    end = int(parts[1].split(":")[0])
                    if end < start:  # 跨午夜
                        if current_hour >= start or current_hour < end:
                            return True
                    else:
                        if start <= current_hour < end:
                            return True
                else:
                    return True  # 单个时间点，宽松处理
            return False
        except Exception:
            return True  # 解析失败时宽松处理

    def recommend(self, user_profile: dict, context: Optional[dict] = None) -> dict:
        """
        生成每日活动推荐（v0.2: 朋友对话式语气 + 互动仔人格）

        Returns:
            {
                "recommendations": [
                    {
                        "activity_id": "A001",
                        "activity_name": "看一场电影",
                        "recommend_text": "你今晚要不要去看场电影？...",
                        "tips": "实操建议...",
                        "action_url": "https://...",
                        "action_label": "猫眼订票",
                        "image_query": "电影院银幕氛围"
                    }
                ],
                "agent_message": "互动仔的对话式开场白",
                "companion": {"avatar": "🐰", "name": "小暖"}
            }
        """
        mbti = user_profile.get("mbti", "INTP")
        personality = MBTI_PERSONALITY_MAP.get(mbti, MBTI_PERSONALITY_MAP["INTP"])
        theme = MBTI_THEME_MAP.get(mbti, MBTI_THEME_MAP["INTP"])

        # Step 1: 获取活动目录并预筛选
        catalog = self._get_activity_catalog()
        catalog_activities = catalog.get("activities", [])
        candidates = self._pre_filter_activities(user_profile, context, catalog_activities)
        activity_map = {a["id"]: a for a in catalog_activities}
        activity_source = self._activity_source(catalog, candidates)
        print(f"[Agent] 预筛选后候选活动: {len(candidates)} 条")

        if not candidates:
            return {
                "recommendations": [],
                "agent_message": "现在这个时间段暂时没有合适的活动推荐，换个时间再来问我吧～",
                "companion": {"avatar": theme["avatar"], "name": theme["name"]},
                "theme": theme,
                "activity_source": activity_source,
            }

        # Step 2: 构建提示词
        user_profile_text = self._build_user_profile_text(user_profile)
        context_text = self._build_context_text(context)
        activities_text = self._build_activities_text(candidates)
        place_hints = self._lookup_places_for_candidates(candidates, context)
        place_hints_text = self._build_place_hints_text(place_hints)
        movie_hints = self._lookup_movie_hints_for_candidates(candidates, context)
        movie_hints_text = self._build_movie_hints_text(movie_hints)
        content_hints = self._lookup_content_hints_for_candidates(candidates)
        content_hints_text = self._build_content_hints_text(content_hints)

        system_prompt = f"""你是用户的"活动搭子"（互动仔），一个贴心的AI伙伴。你的性格和语气完全匹配用户的MBTI类型。

## 你的性格设定
用户MBTI: {mbti}
你的性格: {personality}

## 核心语气原则（最重要！）
1. 你是朋友，不是分析师。用第二人称"你"对话，像朋友聊天。
2. 绝对禁止出现以下表述：
   - "INTP型人格通常…"
   - "作为INFP你倾向于…"
   - "你的MBTI类型决定了…"
   - "根据你的性格分析…"
   - 任何把用户当研究对象的分析性语言
3. MBTI是你的幕后引擎，用户不应感受到"被分析"。
4. 推荐语要达到"吸引对方去做"的效果，有温度、有亲近感。

## 可行性约束（严格遵守！）
1. 必须考虑当前时间段——晚上不推荐远途户外活动
2. 必须检查活动的适合时段(time_window)——不在适合时段的活动不推荐
3. 必须考虑安全提示(safety_note)——有安全风险的活动要提醒
4. 必须考虑启动门槛(convenience)——推荐"此刻能马上做"的活动
5. 天气不好时不推荐室外活动

## 推荐逻辑
1. 不是推荐"热门"活动，而是推荐"此刻这个用户心理上能接受"的活动
2. 理解MBTI的深层含义：INFP不只是"安静"，而是"需要情感意义、对刺激敏感、偏好灵活"
3. 考虑可调节因素：如果活动有调节项（如选早场可降低人群密度），内向用户也可以被推荐
4. 如果用户有历史反馈，自然地体现你记住了ta的偏好（但不要说"根据你的历史反馈"）

{SPECIFICITY_RULES}

## 输出格式（严格JSON）
{{
  "recommendations": [
    {{
      "activity_id": "活动ID",
      "activity_name": "活动名称",
      "recommend_text": "用你的语气写的推荐语（第二人称对话式，必须包含具体信息：名称、地点、时间、价格等，3-4句话）",
      "tips": "实操建议（具体的执行细节，如选什么时段、怎么避峰、怎么到达等，1-2句话）",
      "safety_note": "安全提示（如果有需要注意的，没有则留空）",
      "specific_info": {{
        "name": "具体名称（电影名/餐厅名/地点名等）",
        "location": "具体地点/地址",
        "duration": "预计时长",
        "price": "价格/预算",
        "rating": "评分（如有）",
        "source": "信息来源/获取路径（如猫眼、高德地图、B站搜索词）"
      }}
    }}
  ],
  "agent_message": "互动仔的开场白（用你的语气，像朋友打招呼一样自然地带出推荐，2-3句话）"
}}

推荐数量：{self.config["RECOMMENDATION"]["daily_count"]} 个活动"""

        user_prompt = f"""请为以下用户推荐今天的活动：

{user_profile_text}

{context_text}

候选活动列表：
{activities_text}

真实地点候选：
{place_hints_text}

电影候选：
{movie_hints_text}

视频内容候选：
{content_hints_text}

请从中选择最适合的 {self.config["RECOMMENDATION"]["daily_count"]} 个活动。
记住：用你的性格语气说话，不要分析用户，像朋友一样推荐。"""

        # Step 3: 调用 LLM
        if self.client:
            try:
                # GPT-5.3 仅支持 temperature=1
                response = self.client.chat.completions.create(
                    model=self.config["GPT_API"]["model"],
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                )

                result_text = response.choices[0].message.content.strip()

                # 解析 JSON
                if result_text.startswith("```json"):
                    result_text = result_text.replace("```json", "").replace("```", "").strip()
                elif result_text.startswith("```"):
                    result_text = result_text.replace("```", "").strip()

                result = json.loads(result_text)

                result = self._finalize_result(result, activity_map, theme, activity_source, context, place_hints)

                print(f"[Agent] LLM 推荐生成成功，推荐了 {len(result.get('recommendations', []))} 个活动")
                return result

            except Exception as e:
                print(f"[Agent] LLM 调用失败: {e}")
                return self._fallback_recommend(candidates, mbti, theme, context, activity_source, place_hints)
        else:
            print("[Agent] LLM 客户端不可用，使用降级推荐")
            return self._fallback_recommend(candidates, mbti, theme, context, activity_source, place_hints)

    def _best_place_hint(self, act: dict, place_hints: Optional[dict] = None) -> Optional[dict]:
        if not place_hints:
            return None
        result = place_hints.get(act.get("id"))
        if not result or not result.get("is_realtime") or not result.get("places"):
            return None
        place = dict(result["places"][0])
        place["search_url"] = result.get("search_url", "")
        return place

    def _fallback_action_url(self, act: dict, selected: dict, context: Optional[dict] = None) -> str:
        if act.get("action_url") and not self._is_generic_action_url(act.get("action_url", "")):
            return act["action_url"]
        source = selected.get("source", "")
        name = selected.get("specific_name") or act.get("name", "")
        location = (context or {}).get("location", "")
        if "B站" in source:
            return f"https://search.bilibili.com/all?keyword={name}"
        if "Steam" in source:
            return f"https://store.steampowered.com/search/?term={name}"
        if "猫眼" in source:
            return f"https://m.maoyan.com/search?keyword={name}"
        return f"https://ditu.amap.com/search?query={quote(f'{location} {name}'.strip())}"

    def _build_fallback_recommendation_copy(
        self,
        act: dict,
        context: Optional[dict] = None,
        place_hints: Optional[dict] = None,
    ) -> dict:
        """Build concrete copy when LLM is unavailable."""
        location = (context or {}).get("location", "你附近")
        weather = (context or {}).get("weather", "当前天气")
        name = act["name"]
        subcategory = act.get("subcategory", "")
        duration = f"约 {act.get('duration_hours', 1)} 小时"
        budget = act.get("budget", "按需")
        source = act.get("source_platform", act.get("action_label", "应用内活动库"))
        act_specific = act.get("specific_info") or {}
        place = self._best_place_hint(act, place_hints)

        if place and not act_specific:
            place_name = place.get("name") or name
            place_address = place.get("address") or location
            place_area = place.get("business_area") or place.get("adname") or location
            place_distance = place.get("distance", "")
            place_location = f"{place_area} · {place_address}".strip(" ·")
            action_url = place.get("search_url") or f"https://ditu.amap.com/search?query={quote(place_name)}"
            return {
                "recommend_text": (
                    f"可以直接去 {place_name}。它在{place_location}"
                    f"{f'，距离约 {place_distance}' if place_distance else ''}，"
                    f"预计{duration}，预算大概{budget}。"
                    f"这个选择和{name}匹配，先把地点定下来，决策成本会低很多。"
                ),
                "tips": (
                    f"信息来源：高德地图实时地点。出发前再确认营业状态、路线和现场情况；"
                    f"{act.get('adjustable_factors', '如果人多，就换同商圈评分稳定的近处选项。')}"
                ),
                "specific_info": {
                    "name": place_name,
                    "location": place_location,
                    "duration": duration,
                    "price": budget,
                    "rating": "以高德/平台实时信息为准",
                    "source": "高德地图实时地点",
                },
                "action_url": action_url,
                "action_label": "高德地图",
            }

        if act_specific:
            specific_name = act_specific.get("name", name)
            specific_location = act_specific.get("location") or act_specific.get("platform") or location
            specific_duration = act_specific.get("duration", duration)
            specific_price = act_specific.get("price", budget)
            specific_rating = act_specific.get("rating", "")
            specific_source = act_specific.get("source", source)
            game_bits = []
            if act_specific.get("platform"):
                game_bits.append(f"平台是{act_specific['platform']}")
            if act_specific.get("game_type"):
                game_bits.append(f"类型是{act_specific['game_type']}")
            if act_specific.get("player_mode"):
                game_bits.append(act_specific["player_mode"])
            game_detail = "，".join(game_bits)
            if game_detail:
                game_detail = f"{game_detail}。"
            return {
                "recommend_text": (
                    f"可以直接安排{specific_name}。{game_detail}"
                    f"预计{specific_duration}，预算{specific_price}，评价参考是{specific_rating or '以平台实时信息为准'}。"
                    f"{act_specific.get('setup', f'打开{specific_source}，按名称搜索后直接开始。')}"
                ),
                "tips": (
                    f"信息来源：{specific_source}。"
                    f"{act.get('adjustable_factors', '开始前先确认时间和状态。')}"
                ),
                "specific_info": {
                    "name": specific_name,
                    "location": specific_location,
                    "duration": specific_duration,
                    "price": specific_price,
                    "rating": specific_rating,
                    "source": specific_source,
                },
                "action_url": act.get("action_url", ""),
                "action_label": act.get("action_label", "查看详情"),
            }

        details = {
            "电影": {
                "specific_name": "《你想活出怎样的人生》",
                "specific_location": f"{location} 附近影院，打开猫眼按距离选择",
                "duration": "片长约 124 分钟，建议预留 2.5 小时",
                "price": budget,
                "rating": "豆瓣约 7.6，猫眼约 9 分",
                "source": "猫眼搜索：你想活出怎样的人生",
                "text": f"可以直接去看《你想活出怎样的人生》。现在没有实时排片数据，你打开猫眼搜片名，选 {location} 附近 19:00 后的场次；片长约 124 分钟，整体预留 2.5 小时。它节奏不吵，适合一个人安静看完。",
                "tips": "优先选工作日或晚间非黄金场，后排中间偏侧的位置更安静。到影院前再确认猫眼评分、票价和开场时间。",
            },
            "阅读": {
                "specific_name": "独立书店看书+咖啡",
                "specific_location": f"{location} 附近独立书店",
                "duration": duration,
                "price": budget,
                "rating": "以店铺实时评分为准",
                "source": "地图搜索：独立书店 咖啡",
                "text": f"你可以搜一下 {location} 附近的独立书店，选评分 4.5 以上、带咖啡座的店，待 {duration}。预算大概 {budget}，不用做复杂准备，带上耳机和一本想读的书就行。{weather} 的时候这类室内安排更稳。",
                "tips": "地图搜“独立书店 咖啡”，按距离和营业中筛选；优先选工作日下午或晚饭前，人会少一点。",
            },
            "游戏": {
                "specific_name": "《星露谷物语》",
                "specific_location": "Steam / Switch / 手机",
                "duration": "45-90 分钟",
                "price": "约 20-50 元，已有则 0 元",
                "rating": "Steam 好评如潮",
                "source": "Steam 搜索：Stardew Valley",
                "text": "一个人也可以把今天安排得很好。可以玩《星露谷物语》，Steam/Switch/手机都能玩，单人休闲经营，开一局 45-90 分钟刚好。它不需要社交，也不会太刺激，适合想放松但不想出门的时候。",
                "tips": "如果已经买过就直接开；没买可以在 Steam 搜 Stardew Valley。给自己设 90 分钟上限，玩完就收。",
            },
            "纪录片": {
                "specific_name": "《人生果实》",
                "specific_location": "B站搜索",
                "duration": "约 91 分钟",
                "price": "0 元起",
                "rating": "豆瓣 9.5",
                "source": "B站搜索：人生果实 纪录片",
                "text": "不想折腾的话，今晚可以看《人生果实》。B站搜“人生果实 纪录片”，片长约 91 分钟，豆瓣 9.5，节奏很慢也很温柔。准备一杯热饮，直接从屏幕里退出来一点。",
                "tips": "把灯光调暗，手机放远一点；如果 20 分钟后不在状态，就换成听播客，不硬撑。",
            },
        }

        selected = details.get(subcategory)
        if not selected:
            selected = {
                "specific_name": name,
                "specific_location": location,
                "duration": duration,
                "price": budget,
                "rating": "",
                "source": source,
                "text": f"可以试试{name}。地点先按 {location} 附近来找，预计 {duration}，预算大概 {budget}；它的效果偏向{act.get('mood_effect', '放松')}，现在开始不需要太多准备。{act.get('adjustable_factors', '')}",
                "tips": f"打开地图或对应平台搜索“{name}”，优先选距离近、营业中、评价稳定的结果；开始前预留 {act.get('min_prep_time', '10分钟')} 准备时间。",
            }

        return {
            "recommend_text": selected["text"],
            "tips": selected["tips"],
            "specific_info": {
                "name": selected["specific_name"],
                "location": selected["specific_location"],
                "duration": selected["duration"],
                "price": selected["price"],
                "rating": selected["rating"],
                "source": selected["source"],
            },
            "action_url": self._fallback_action_url(act, selected, context),
            "action_label": act.get("action_label") or "打开入口",
        }

    def _fallback_recommend(
        self,
        candidates: list,
        mbti: str,
        theme: dict,
        context: Optional[dict] = None,
        activity_source: Optional[dict] = None,
        place_hints: Optional[dict] = None,
    ) -> dict:
        """降级推荐（无 LLM 时基于规则，但保持对话式语气）"""
        top_n = self.config["RECOMMENDATION"]["daily_count"]

        # 按MBTI友好度排序
        def mbti_score(act):
            scores = act.get("mbti_friendly", {})
            return sum(scores.get(d, 0) for d in mbti)

        sorted_candidates = sorted(candidates, key=mbti_score, reverse=True)
        selected = sorted_candidates[:top_n]

        # 生成简单的对话式推荐语
        personality = MBTI_PERSONALITY_MAP.get(mbti, "")
        is_flexible = "P" in mbti
        is_warm = "F" in mbti

        companion_name = theme["name"]

        fallback_messages = {
            "INFP": f"今天先看看这几个吧，你挑挑，想去就去，不想动也没事～",
            "ENFP": "嗨！发现几个不错的活动！你看看哪个感兴趣？",
            "INTP": "找了几个适合现在的活动，信息都列好了，你看看。",
            "ENTJ": "帮你筛了几个活动，信息都在这，选一个？",
            "INTJ": "根据当前时间和条件，筛选了以下几个活动供参考。",
            "ENTP": "嘿，找到几个有意思的，你看看哪个来劲？",
            "INFJ": "今天这几个感觉挺适合你的，看看有没有心动的？",
            "ENFJ": "今天天气不错呢！找了几个活动，你看看哪个想去？",
            "ISTJ": "根据当前条件筛选了以下活动，请参考。",
            "ISFJ": "今天这几个活动感觉挺适合你的，要不要看看？",
            "ESTJ": "筛选完毕，以下活动适合当前时段，选一个吧。",
            "ESFJ": "今天给你找了几个活动～你看看哪个想去？",
            "ISTP": "找了几个活动，信息都在，你自己看。",
            "ISFP": "今天这几个感觉还不错，你看看？不想去也没事。",
            "ESTP": "找到几个不错的！看看哪个来劲？",
            "ESFP": "嗨嗨！发现几个超不错的活动！你看看哪个想去！",
        }

        agent_message = fallback_messages.get(mbti, f"找了几个适合现在的活动，你看看？")

        return {
            "recommendations": [
                self._attach_activity_metadata(
                    {
                    "activity_id": act["id"],
                    "activity_name": act["name"],
                    **self._build_fallback_recommendation_copy(act, context, place_hints),
                    "safety_note": act.get("safety_note", ""),
                    "image_query": act.get("image_query", act["name"]),
                    "category": act.get("category", ""),
                    "budget": act.get("budget", ""),
                    },
                    act,
                )
                for act in selected
            ],
            "agent_message": agent_message,
            "companion": {"avatar": theme["avatar"], "name": companion_name},
            "theme": theme,
            "activity_source": activity_source or {
                "source": "local_fallback",
                "is_realtime": False,
                "total_count": len(candidates),
                "candidate_count": len(candidates),
            },
        }

    def chat(self, user_profile: dict, message: str, context: Optional[dict] = None, history: list = None) -> dict:
        """
        对话接口：用户与互动仔聊天

        Args:
            user_profile: 用户画像
            message: 用户消息
            context: 当日上下文
            history: 对话历史 [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]

        Returns:
            {
                "reply": "互动仔的回复",
                "recommendations": [...],  # 如果在对话中产生了推荐
                "companion": {"avatar": "...", "name": "..."}
            }
        """
        mbti = user_profile.get("mbti", "INTP")
        personality = MBTI_PERSONALITY_MAP.get(mbti, MBTI_PERSONALITY_MAP["INTP"])
        theme = MBTI_THEME_MAP.get(mbti, MBTI_THEME_MAP["INTP"])

        catalog = self._get_activity_catalog()
        catalog_activities = catalog.get("activities", [])
        candidates = self._pre_filter_activities(user_profile, context, catalog_activities)
        activity_map = {a["id"]: a for a in catalog_activities}
        activity_source = self._activity_source(catalog, candidates)
        user_profile_text = self._build_user_profile_text(user_profile)
        context_text = self._build_context_text(context)
        activities_text = self._build_activities_text(candidates)
        place_hints = self._lookup_places_for_candidates(candidates, context)
        place_hints_text = self._build_place_hints_text(place_hints)
        movie_hints = self._lookup_movie_hints_for_candidates(candidates, context)
        movie_hints_text = self._build_movie_hints_text(movie_hints)
        content_hints = self._lookup_content_hints_for_candidates(candidates, message)
        content_hints_text = self._build_content_hints_text(content_hints)

        system_prompt = f"""你是用户的"活动搭子"（互动仔），一个贴心的AI伙伴。你的名字叫"{theme["name"]}"。

## 你的性格设定
用户MBTI: {mbti}
你的性格: {personality}

## 核心语气原则
1. 你是朋友，不是分析师。用第二人称"你"对话。
2. 绝对禁止出现"INTP型人格通常…""作为INFP你倾向于…"等分析性表述。
3. MBTI是你的幕后引擎，用户不应感受到"被分析"。
4. 对话要自然、有温度，像朋友聊天。

## 你的能力
1. 推荐活动：根据用户当前状态和需求，推荐合适的活动
2. 换推荐：如果用户说"不想去""换一个"，重新推荐
3. 聊天陪伴：可以闲聊，关心用户的状态
4. 回答活动相关问题

{SPECIFICITY_RULES}

## 当前上下文
{context_text}

## 用户偏好与行为记忆
{user_profile_text}

## 可推荐的活动
{activities_text}

## 真实地点候选
{place_hints_text}

## 电影候选
{movie_hints_text}

## 视频内容候选
{content_hints_text}

## 输出格式（严格JSON）
{{
  "reply": "你的回复（用你的语气，像朋友聊天，2-4句话）",
  "recommendations": [
    {{
      "activity_id": "活动ID",
      "activity_name": "活动名称",
      "recommend_text": "推荐语（对话式，必须包含具体信息：名称、地点、时间、价格等，3-4句话）",
      "tips": "实操建议（具体执行细节）",
      "safety_note": "安全提示",
      "specific_info": {{
        "name": "具体名称",
        "location": "具体地点",
        "duration": "预计时长",
        "price": "价格",
        "rating": "评分",
        "source": "信息来源/获取路径"
      }}
    }}
  ]
}}

如果用户只是闲聊没有要求推荐，recommendations 返回空数组 []。
如果用户要求推荐或换一个，推荐1-2个活动。"""

        messages = [{"role": "system", "content": system_prompt}]

        # 加入历史对话
        if history:
            messages.extend(history[-10:])  # 最多保留最近10条

        messages.append({"role": "user", "content": message})

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.config["GPT_API"]["model"],
                    messages=messages,
                )

                result_text = response.choices[0].message.content.strip()
                if result_text.startswith("```json"):
                    result_text = result_text.replace("```json", "").replace("```", "").strip()
                elif result_text.startswith("```"):
                    result_text = result_text.replace("```", "").strip()

                result = json.loads(result_text)

                result = self._finalize_result(result, activity_map, theme, activity_source, context, place_hints)
                result["reply_source"] = "llm"

                return result

            except Exception as e:
                print(f"[Agent] 对话调用失败: {e}")
                return self._fallback_chat(message, mbti, theme, context, catalog, candidates, place_hints)
        else:
            return self._fallback_chat(message, mbti, theme, context, catalog, candidates, place_hints)

    def _fallback_chat(
        self,
        message: str,
        mbti: str,
        theme: dict,
        context: Optional[dict] = None,
        catalog: Optional[dict] = None,
        candidates: Optional[list] = None,
        place_hints: Optional[dict] = None,
    ) -> dict:
        """降级对话（无 LLM 时）"""
        if catalog is None:
            catalog = self._get_activity_catalog()
        if candidates is None:
            candidates = self._pre_filter_activities({"mbti": mbti}, context, catalog.get("activities", []))
        candidates = sorted(candidates, key=lambda act: self._message_candidate_score(act, message))
        if place_hints is None:
            place_hints = self._lookup_places_for_candidates(candidates, context)
        activity_source = self._activity_source(catalog, candidates)

        if any(kw in message for kw in ["不想", "换", "别的", "其他"]):
            # 换推荐
            if candidates:
                import random
                act = random.choice(candidates[:10])
                return {
                    "reply": "行，那看看这个？",
                    "reply_source": "fallback",
                    "recommendations": [
                        self._attach_activity_metadata(
                            {
                                "activity_id": act["id"],
                                "activity_name": act["name"],
                                **self._build_fallback_recommendation_copy(act, context, place_hints),
                                "safety_note": act.get("safety_note", ""),
                            },
                            act,
                        )
                    ],
                    "companion": {"avatar": theme["avatar"], "name": theme["name"]},
                    "theme": theme,
                    "activity_source": activity_source,
                }

        if any(kw in message for kw in ["推荐", "好玩", "做什么", "干嘛", "无聊", "放松", "人少", "安静", "电影", "游戏", "吃", "走走", "灵感"]):
            if candidates:
                act = candidates[0]
                return {
                    "reply": "我先给你一个现在就能开始的选择。你不用想太多，看看这个合不合适；不喜欢我再换。",
                    "reply_source": "fallback",
                    "recommendations": [
                        self._attach_activity_metadata(
                            {
                                "activity_id": act["id"],
                                "activity_name": act["name"],
                                **self._build_fallback_recommendation_copy(act, context, place_hints),
                                "safety_note": act.get("safety_note", ""),
                            },
                            act,
                        )
                    ],
                    "companion": {"avatar": theme["avatar"], "name": theme["name"]},
                    "theme": theme,
                    "activity_source": activity_source,
                }

        # 默认闲聊
        return {
            "reply": "嗯嗯，我在呢～有什么想聊的或者想找活动，随时跟我说。",
            "reply_source": "fallback",
            "recommendations": [],
            "companion": {"avatar": theme["avatar"], "name": theme["name"]},
            "theme": theme,
            "activity_source": activity_source,
        }

    def update_feedback(self, user_id: str, activity_id: str, feedback: str):
        """记录用户反馈并更新画像"""
        feedback_path = os.path.join(PROJECT_ROOT, self.config["DATA"]["feedback_path"])

        all_feedback = {}
        if os.path.exists(feedback_path):
            with open(feedback_path, "r", encoding="utf-8") as f:
                all_feedback = json.load(f)

        if user_id not in all_feedback:
            all_feedback[user_id] = []

        all_feedback[user_id].append(
            {
                "activity_id": activity_id,
                "feedback": feedback,
                "timestamp": datetime.now().isoformat(),
            }
        )

        with open(feedback_path, "w", encoding="utf-8") as f:
            json.dump(all_feedback, f, ensure_ascii=False, indent=2)

        print(f"[Agent] 已记录反馈: user={user_id}, activity={activity_id}, feedback={feedback}")


# 测试入口
if __name__ == "__main__":
    agent = RecommendationAgent()

    # 模拟一个 INFP 用户
    test_user = {
        "user_id": "test_001",
        "mbti": "INFP",
        "preferences": {
            "social_frequency": "偶尔社交，大部分时间独处",
            "budget": "0-100元",
            "commute_tolerance": "30分钟以内",
            "notes": "喜欢安静的地方，人多的地方会焦虑",
        },
        "feedback_summary": "偏好文化类和户外低密度活动",
    }

    test_context = {
        "weather": "晴",
        "location": "北京",
    }

    print("=" * 60)
    print("推荐测试：")
    result = agent.recommend(test_user, test_context)
    print(json.dumps(result, ensure_ascii=False, indent=2))

    print("\n" + "=" * 60)
    print("对话测试：")
    chat_result = agent.chat(test_user, "今天不想出门", test_context)
    print(json.dumps(chat_result, ensure_ascii=False, indent=2))
