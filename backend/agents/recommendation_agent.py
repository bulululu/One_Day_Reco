"""
推荐 Agent 核心模块
基于 MBTI 画像 + 活动库 + 上下文，用 LLM 生成个性化活动推荐
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


class RecommendationAgent:
    """活动推荐 Agent"""

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
当前日期: {now.strftime('%Y-%m-%d')} {weekday}
时间段: {time_period}
天气: {weather}
位置: {location}
"""

    def _build_activities_text(self, candidate_activities: list) -> str:
        """构建候选活动文本"""
        activities_text = []
        for act in candidate_activities:
            activities_text.append(
                f"- [{act['id']}] {act['name']} | 类别:{act['category']} | "
                f"人群密度:{act['crowd_density']} | 社交强度:{act['social_intensity']} | "
                f"能耗:{act['energy_cost']} | 室内外:{act['indoor_outdoor']} | "
                f"时长:{act['duration_hours']}h | 预算:{act['budget']} | "
                f"可调节:{act.get('adjustable_factors', '无')} | "
                f"情绪效果:{act['mood_effect']}"
            )
        return "\n".join(activities_text)

    def _pre_filter_activities(self, user_profile: dict, context: Optional[dict] = None) -> list:
        """预筛选活动（规则层，减少 LLM 输入量）"""
        mbti = user_profile.get("mbti", "")
        candidates = []

        # MBTI 维度提取
        is_introvert = "I" in mbti
        ctx = context or {}
        weather = ctx.get("weather", "")

        for act in self.activities:
            # 天气过滤：室外活动在雨天排除
            if weather and act["indoor_outdoor"] == "室外":
                if weather in ["雨", "雪"] and "雨" not in act.get("weather_suitable", []):
                    continue

            # 内向用户降低高人群密度活动的优先级（但不完全排除，因为有可调节因素）
            if is_introvert and act["crowd_density"] == "高":
                # 如果有可调节因素，保留但降低优先级
                if not act.get("adjustable_factors"):
                    continue

            candidates.append(act)

        return candidates

    def recommend(self, user_profile: dict, context: Optional[dict] = None) -> dict:
        """
        生成每日活动推荐

        Args:
            user_profile: 用户画像，含 mbti, preferences, feedback_summary
            context: 当日上下文，含 weather, location

        Returns:
            {
                "recommendations": [
                    {
                        "activity_id": "A001",
                        "activity_name": "看一场电影",
                        "reason": "推荐理由...",
                        "tips": "实操建议..."
                    }
                ],
                "agent_message": "整体推荐说明..."
            }
        """
        # Step 1: 预筛选
        candidates = self._pre_filter_activities(user_profile, context)
        print(f"[Agent] 预筛选后候选活动: {len(candidates)} 条")

        # Step 2: 构建提示词
        user_profile_text = self._build_user_profile_text(user_profile)
        context_text = self._build_context_text(context)
        activities_text = self._build_activities_text(candidates)

        system_prompt = f"""你是一个个性化的活动推荐助手。你的任务是根据用户的MBTI人格画像、当日上下文和活动库，推荐最合适的活动。

核心原则：
1. 不是推荐"热门"活动，而是推荐"此刻这个用户心理上能接受"的活动
2. 理解MBTI的深层含义：INFP不只是"安静"，而是"需要情感意义、对刺激敏感、偏好灵活"
3. 考虑可调节因素：如果活动有"选早场可降低人群密度"的调节项，内向用户也可以被推荐
4. 推荐要具体可执行，附上实操建议
5. 如果用户有历史反馈，要体现你记住了ta的偏好

输出格式（严格JSON）：
{{
  "recommendations": [
    {{
      "activity_id": "活动ID",
      "activity_name": "活动名称",
      "reason": "为什么推荐这个活动给这个用户（结合MBTI+上下文，2-3句话）",
      "tips": "实操建议（比如选什么时段、怎么避峰等，1-2句话）"
    }}
  ],
  "agent_message": "一句话总结今天的推荐逻辑，语气像朋友聊天"
}}

推荐数量：{self.config["RECOMMENDATION"]["daily_count"]} 个活动
"""

        user_prompt = f"""请为以下用户推荐今天的活动：

{user_profile_text}

{context_text}

候选活动列表：
{activities_text}

请从中选择最适合的 {self.config["RECOMMENDATION"]["daily_count"]} 个活动，并给出推荐理由和实操建议。"""

        # Step 3: 调用 LLM
        if self.client:
            try:
                # GPT-5.3 仅支持 temperature=1，不支持自定义值
                response = self.client.chat.completions.create(
                    model=self.config["GPT_API"]["model"],
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                )

                result_text = response.choices[0].message.content.strip()

                # 尝试解析 JSON
                if result_text.startswith("```json"):
                    result_text = result_text.replace("```json", "").replace("```", "").strip()
                elif result_text.startswith("```"):
                    result_text = result_text.replace("```", "").strip()

                result = json.loads(result_text)
                print(f"[Agent] LLM 推荐生成成功，推荐了 {len(result.get('recommendations', []))} 个活动")
                return result

            except Exception as e:
                print(f"[Agent] LLM 调用失败: {e}")
                return self._fallback_recommend(candidates)
        else:
            print("[Agent] LLM 客户端不可用，使用降级推荐")
            return self._fallback_recommend(candidates)

    def _fallback_recommend(self, candidates: list) -> dict:
        """降级推荐（无 LLM 时基于规则）"""
        top_n = self.config["RECOMMENDATION"]["daily_count"]
        # 简单取前 N 个
        selected = candidates[:top_n]
        return {
            "recommendations": [
                {
                    "activity_id": act["id"],
                    "activity_name": act["name"],
                    "reason": f"基于规则匹配推荐（{act['category']}类活动，人群密度{act['crowd_density']}）",
                    "tips": act.get("adjustable_factors", "无特殊建议"),
                }
                for act in selected
            ],
            "agent_message": "当前为规则推荐模式（LLM未连接），建议配置GPT API后体验完整推荐。",
        }

    def update_feedback(self, user_id: str, activity_id: str, feedback: str):
        """
        记录用户反馈并更新画像

        Args:
            user_id: 用户ID
            activity_id: 活动ID
            feedback: "liked" | "disliked" | "completed" | "skipped"
        """
        feedback_path = os.path.join(PROJECT_ROOT, self.config["DATA"]["feedback_path"])

        # 加载已有反馈
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

    result = agent.recommend(test_user, test_context)
    print("\n" + "=" * 60)
    print("推荐结果：")
    print(json.dumps(result, ensure_ascii=False, indent=2))
