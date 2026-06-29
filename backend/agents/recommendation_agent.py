"""
推荐 Agent 核心模块
基于 MBTI 画像 + 活动库 + 上下文，用 LLM 生成个性化活动推荐
v0.2: 朋友对话式语气 + 互动仔人格 + 可行性约束 + 聊天接口
"""

import json
import os
from datetime import datetime
from typing import Optional
from openai import AzureOpenAI

# 项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_config() -> dict:
    """加载配置"""
    config_path = os.path.join(PROJECT_ROOT, "config", "settings.yaml")
    with open(config_path, "r", encoding="utf-8") as f:
        import yaml
        return yaml.safe_load(f)


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

        profile_text = f"""
用户MBTI: {mbti}
社交偏好: {preferences.get('social_frequency', '未知')}
预算范围: {preferences.get('budget', '不限')}
通勤容忍: {preferences.get('commute_tolerance', '未知')}
特殊偏好: {preferences.get('notes', '无')}
历史反馈摘要: {user_profile.get('feedback_summary', '暂无')}
"""
        return profile_text.strip()

    def _build_context_text(self, context: Optional[dict] = None) -> str:
        """构建当日上下文文本"""
        now = datetime.now()
        weekday = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][now.weekday()]

        ctx = context or {}
        weather = ctx.get("weather", "未知")
        location = ctx.get("location", "未知")
        time_period = "上午" if now.hour < 12 else ("下午" if now.hour < 18 else "晚上")

        return f"""
当前时间: {now.strftime('%Y-%m-%d')} {weekday} {now.strftime('%H:%M')}
时间段: {time_period}
天气: {weather}
位置: {location}
"""

    def _build_activities_text(self, candidate_activities: list) -> str:
        """构建候选活动文本（含可行性字段）"""
        activities_text = []
        for act in candidate_activities:
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
            )
        return "\n".join(activities_text)

    def _pre_filter_activities(self, user_profile: dict, context: Optional[dict] = None) -> list:
        """预筛选活动（规则层，减少 LLM 输入量）"""
        mbti = user_profile.get("mbti", "")
        candidates = []

        is_introvert = "I" in mbti
        ctx = context or {}
        weather = ctx.get("weather", "")

        # 当前时间判断
        now = datetime.now()
        current_hour = now.hour

        for act in self.activities:
            # 天气过滤：室外活动在雨天排除
            if weather and act["indoor_outdoor"] == "室外":
                if weather in ["雨", "雪"] and "雨" not in act.get("weather_suitable", []):
                    continue

            # 时段过滤：检查活动适合时段
            time_window = act.get("time_window", "全天")
            if time_window != "全天":
                if not self._is_time_in_window(current_hour, time_window):
                    continue

            # 内向用户降低高人群密度活动的优先级
            if is_introvert and act["crowd_density"] == "高":
                if not act.get("adjustable_factors"):
                    continue

            # 安全过滤：夜间不推荐需要远途或户外的活动
            if current_hour >= 20 and act["indoor_outdoor"] == "室外":
                safety = act.get("safety_note", "")
                if "结伴" in safety or "安全" in safety.lower():
                    continue

            candidates.append(act)

        return candidates

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

        # Step 1: 预筛选
        candidates = self._pre_filter_activities(user_profile, context)
        print(f"[Agent] 预筛选后候选活动: {len(candidates)} 条")

        if not candidates:
            return {
                "recommendations": [],
                "agent_message": "现在这个时间段暂时没有合适的活动推荐，换个时间再来问我吧～",
                "companion": {"avatar": theme["avatar"], "name": theme["name"]},
                "theme": theme,
            }

        # Step 2: 构建提示词
        user_profile_text = self._build_user_profile_text(user_profile)
        context_text = self._build_context_text(context)
        activities_text = self._build_activities_text(candidates)

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

## 推荐具体化原则（非常重要！）
推荐必须**具体到可以直接执行**，禁止泛泛而谈。每条推荐的 recommend_text 和 tips 中必须包含具体信息：

- 电影推荐：必须包含电影名称、电影院名称（可虚构合理的）、场次时间、片长、评分。例如："今晚 7:30 的《沙丘2》猫眼评分 9.1，片长 166 分钟，XX影城 IMAX 厅，打车 15 分钟到。"
- 餐厅推荐：必须包含餐厅名称、菜系、人均价格、评分。例如："附近有家「日新拉面」，日式拉面，人均 45 元，大众点评 4.7 分。"
- 户外活动：必须包含具体地点名称、预计耗时。例如："朝阳公园西门进去走 10 分钟有个湖边长椅，人少，坐一会儿挺舒服的。"
- 居家活动：必须包含具体内容。例如纪录片要给出名称和B站搜索词："B站搜「人生果实」，一部豆瓣 9.5 的日本纪录片，片长 91 分钟。"
- 运动：必须包含具体运动名称、场馆、价格。例如："XX 羽毛球馆，工作日下午场 30 元/小时，打车 10 分钟。"
- 展览/演出：必须包含名称、场馆、票价。例如：「莫奈特展」在国家美术馆，门票 80 元，展期到 8 月。
- 游戏：必须包含游戏名称、平台。例如："Steam 上的《潜水员戴夫》，休闲经营类，单人，好评如潮。"

**绝对禁止的推荐语**：
- "去看场电影吧" → 必须说看什么电影、哪个影院、什么场次
- "去公园走走" → 必须说哪个公园、去哪块区域
- "找个纪录片看看" → 必须说纪录片名称、在哪看
- "做做运动" → 必须说什么运动、去哪做

如果活动库中的信息不够具体，你需要在推荐语中补充合理的具体细节（如当前热映电影名称、附近合理的场所名称等）。
如果无法获取实时数据，给出获取路径："打开猫眼搜 XXX，最近的场次是…"

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
        "source": "信息来源/获取路径（如猫眼、大众点评、B站搜索词）"
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

                # 补充活动元数据（action_url, action_label, image_query）
                activity_map = {a["id"]: a for a in self.activities}
                for rec in result.get("recommendations", []):
                    aid = rec.get("activity_id", "")
                    if aid in activity_map:
                        act = activity_map[aid]
                        rec["action_url"] = act.get("action_url", "")
                        rec["action_label"] = act.get("action_label", "")
                        rec["image_query"] = act.get("image_query", act["name"])
                        rec["category"] = act.get("category", "")
                        rec["budget"] = act.get("budget", "")

                result["companion"] = {"avatar": theme["avatar"], "name": theme["name"]}
                result["theme"] = theme

                print(f"[Agent] LLM 推荐生成成功，推荐了 {len(result.get('recommendations', []))} 个活动")
                return result

            except Exception as e:
                print(f"[Agent] LLM 调用失败: {e}")
                return self._fallback_recommend(candidates, mbti, theme)
        else:
            print("[Agent] LLM 客户端不可用，使用降级推荐")
            return self._fallback_recommend(candidates, mbti, theme)

    def _fallback_recommend(self, candidates: list, mbti: str, theme: dict) -> dict:
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
                {
                    "activity_id": act["id"],
                    "activity_name": act["name"],
                    "recommend_text": f"这个怎么样——{act['name']}，{act.get('mood_effect', '挺不错的')}",
                    "tips": act.get("adjustable_factors", "无特殊建议"),
                    "safety_note": act.get("safety_note", ""),
                    "action_url": act.get("action_url", ""),
                    "action_label": act.get("action_label", ""),
                    "image_query": act.get("image_query", act["name"]),
                    "category": act.get("category", ""),
                    "budget": act.get("budget", ""),
                }
                for act in selected
            ],
            "agent_message": agent_message,
            "companion": {"avatar": theme["avatar"], "name": companion_name},
            "theme": theme,
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

        context_text = self._build_context_text(context)
        activities_text = self._build_activities_text(self._pre_filter_activities(user_profile, context))

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

## 推荐具体化原则（非常重要！）
推荐必须**具体到可以直接执行**，禁止泛泛而谈。每条推荐的 recommend_text 中必须包含具体信息：

- 电影推荐：必须包含电影名称、电影院名称、场次时间、片长、评分
- 餐厅推荐：必须包含餐厅名称、菜系、人均价格、评分
- 户外活动：必须包含具体地点名称、预计耗时
- 居家活动：必须包含具体内容（如纪录片名称和B站搜索词）
- 运动：必须包含具体运动名称、场馆、价格
- 展览/演出：必须包含名称、场馆、票价
- 游戏：必须包含游戏名称、平台

**绝对禁止**："去看场电影吧""去公园走走""找个纪录片看看"等泛泛推荐。

如果活动库中的信息不够具体，你需要在推荐语中补充合理的具体细节。
如果无法获取实时数据，给出获取路径："打开猫眼搜 XXX，最近的场次是…"

## 当前上下文
{context_text}

## 可推荐的活动
{activities_text}

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

                # 补充活动元数据
                activity_map = {a["id"]: a for a in self.activities}
                for rec in result.get("recommendations", []):
                    aid = rec.get("activity_id", "")
                    if aid in activity_map:
                        act = activity_map[aid]
                        rec["action_url"] = act.get("action_url", "")
                        rec["action_label"] = act.get("action_label", "")
                        rec["image_query"] = act.get("image_query", act["name"])
                        rec["category"] = act.get("category", "")
                        rec["budget"] = act.get("budget", "")

                result["companion"] = {"avatar": theme["avatar"], "name": theme["name"]}
                result["theme"] = theme

                return result

            except Exception as e:
                print(f"[Agent] 对话调用失败: {e}")
                return self._fallback_chat(message, mbti, theme)
        else:
            return self._fallback_chat(message, mbti, theme)

    def _fallback_chat(self, message: str, mbti: str, theme: dict) -> dict:
        """降级对话（无 LLM 时）"""
        msg_lower = message.lower()

        if any(kw in message for kw in ["不想", "换", "别的", "其他"]):
            # 换推荐
            candidates = self._pre_filter_activities({"mbti": mbti}, None)
            if candidates:
                import random
                act = random.choice(candidates[:10])
                return {
                    "reply": "行，那看看这个？",
                    "recommendations": [{
                        "activity_id": act["id"],
                        "activity_name": act["name"],
                        "recommend_text": f"这个怎么样——{act['name']}",
                        "tips": act.get("adjustable_factors", "无特殊建议"),
                        "safety_note": act.get("safety_note", ""),
                        "action_url": act.get("action_url", ""),
                        "action_label": act.get("action_label", ""),
                        "image_query": act.get("image_query", act["name"]),
                        "category": act.get("category", ""),
                        "budget": act.get("budget", ""),
                    }],
                    "companion": {"avatar": theme["avatar"], "name": theme["name"]},
                    "theme": theme,
                }

        if any(kw in message for kw in ["推荐", "好玩", "做什么", "干嘛", "无聊"]):
            candidates = self._pre_filter_activities({"mbti": mbti}, None)
            if candidates:
                act = candidates[0]
                return {
                    "reply": "给你找了个活动，看看？",
                    "recommendations": [{
                        "activity_id": act["id"],
                        "activity_name": act["name"],
                        "recommend_text": f"要不要试试{act['name']}？",
                        "tips": act.get("adjustable_factors", "无特殊建议"),
                        "safety_note": act.get("safety_note", ""),
                        "action_url": act.get("action_url", ""),
                        "action_label": act.get("action_label", ""),
                        "image_query": act.get("image_query", act["name"]),
                        "category": act.get("category", ""),
                        "budget": act.get("budget", ""),
                    }],
                    "companion": {"avatar": theme["avatar"], "name": theme["name"]},
                    "theme": theme,
                }

        # 默认闲聊
        return {
            "reply": "嗯嗯，我在呢～有什么想聊的或者想找活动，随时跟我说。",
            "recommendations": [],
            "companion": {"avatar": theme["avatar"], "name": theme["name"]},
            "theme": theme,
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
