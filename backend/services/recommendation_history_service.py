import json
from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.services.models import ActivityEvent, RecommendationRecord


def _json_dumps(value: object) -> str:
    return json.dumps(value or {}, ensure_ascii=False)


def _json_loads(value: str, fallback: object) -> object:
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return fallback


def _compact_recommendation(rec: dict) -> dict:
    info = rec.get("specific_info") or {}
    return {
        "activity_id": rec.get("activity_id", ""),
        "activity_name": rec.get("activity_name", ""),
        "category": rec.get("category", ""),
        "budget": rec.get("budget", ""),
        "specific_info": {
            "name": info.get("name", ""),
            "location": info.get("location", ""),
            "duration": info.get("duration", ""),
            "price": info.get("price", ""),
            "source": info.get("source", ""),
        },
    }


def _append_unique(target: list[dict], activity_id: str, activity_name: str = "") -> None:
    if not activity_id:
        return
    if any(item["activity_id"] == activity_id for item in target):
        return
    target.append({"activity_id": activity_id, "activity_name": activity_name or activity_id})


def _names(items: list[dict], limit: int = 5) -> str:
    return "、".join(item["activity_name"] or item["activity_id"] for item in items[:limit])


def _preference_labels(items: list[dict], limit: int = 6) -> str:
    labels = []
    seen = set()
    for item in items:
        label = item.get("label") or item.get("constraint") or ""
        if not label or label in seen:
            continue
        labels.append(label)
        seen.add(label)
        if len(labels) >= limit:
            break
    return "、".join(labels)


def record_recommendation(
    db: Session,
    user_id: str,
    result: dict,
    context: Optional[dict] = None,
    source: str = "recommend",
) -> None:
    if not user_id:
        return
    recommendations = [
        _compact_recommendation(rec)
        for rec in result.get("recommendations", [])
        if rec.get("activity_id")
    ]
    db.add(
        RecommendationRecord(
            user_id=user_id,
            source=source,
            context_json=_json_dumps(context or {}),
            activity_source_json=_json_dumps(result.get("activity_source") or {}),
            recommendations_json=json.dumps(recommendations, ensure_ascii=False),
        )
    )
    db.commit()


def record_activity_event(
    db: Session,
    user_id: str,
    activity_id: str,
    event_type: str,
    activity_name: str = "",
    source: str = "app",
    metadata: Optional[dict] = None,
) -> ActivityEvent:
    event = ActivityEvent(
        user_id=user_id,
        activity_id=activity_id,
        activity_name=activity_name,
        event_type=event_type,
        source=source,
        metadata_json=_json_dumps(metadata or {}),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def list_recommendation_history(db: Session, user_id: str, limit: int = 20) -> list[dict]:
    records = (
        db.query(RecommendationRecord)
        .filter(RecommendationRecord.user_id == user_id)
        .order_by(desc(RecommendationRecord.created_at))
        .limit(max(1, min(limit, 50)))
        .all()
    )
    return [
        {
            "id": record.id,
            "source": record.source,
            "context": _json_loads(record.context_json, {}),
            "activity_source": _json_loads(record.activity_source_json, {}),
            "recommendations": _json_loads(record.recommendations_json, []),
            "created_at": record.created_at.isoformat(),
        }
        for record in records
    ]


def list_activity_events(db: Session, user_id: str, limit: int = 50) -> list[dict]:
    events = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.user_id == user_id)
        .order_by(desc(ActivityEvent.created_at))
        .limit(max(1, min(limit, 100)))
        .all()
    )
    return [
        {
            "id": event.id,
            "activity_id": event.activity_id,
            "activity_name": event.activity_name,
            "event_type": event.event_type,
            "source": event.source,
            "metadata": _json_loads(event.metadata_json, {}),
            "created_at": event.created_at.isoformat(),
        }
        for event in events
    ]


def build_behavior_memory(db: Session, user_id: str) -> dict:
    if not user_id:
        return {}

    events = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.user_id == user_id)
        .order_by(desc(ActivityEvent.created_at))
        .limit(80)
        .all()
    )
    records = (
        db.query(RecommendationRecord)
        .filter(RecommendationRecord.user_id == user_id)
        .order_by(desc(RecommendationRecord.created_at))
        .limit(20)
        .all()
    )

    liked_or_completed: list[dict] = []
    clicked: list[dict] = []
    skipped: list[dict] = []
    preferences: list[dict] = []
    recent_recommended: list[dict] = []

    for event in events:
        if event.event_type in {"liked", "completed"}:
            _append_unique(liked_or_completed, event.activity_id, event.activity_name)
        elif event.event_type == "click":
            _append_unique(clicked, event.activity_id, event.activity_name)
        elif event.event_type in {"skipped", "disliked"}:
            _append_unique(skipped, event.activity_id, event.activity_name)
        elif event.event_type == "preference":
            metadata = _json_loads(event.metadata_json, {})
            if isinstance(metadata, dict):
                preferences.append({
                    "constraint": metadata.get("constraint", event.activity_id),
                    "label": metadata.get("label", event.activity_name),
                })

    for record in records:
        recommendations = _json_loads(record.recommendations_json, [])
        if not isinstance(recommendations, list):
            continue
        for rec in recommendations:
            if not isinstance(rec, dict):
                continue
            _append_unique(
                recent_recommended,
                rec.get("activity_id", ""),
                rec.get("activity_name", ""),
            )

    summary_parts = []
    if liked_or_completed:
        summary_parts.append(f"近期喜欢/完成：{_names(liked_or_completed)}")
    if clicked:
        summary_parts.append(f"近期点开过：{_names(clicked)}")
    if skipped:
        summary_parts.append(f"近期跳过：{_names(skipped)}")
    if preferences:
        summary_parts.append(f"对话里表达过：{_preference_labels(preferences)}")
    if recent_recommended:
        summary_parts.append(f"最近已推荐：{_names(recent_recommended)}，短期内优先换新选择")

    if not summary_parts:
        return {}

    preference_constraints = []
    seen_constraints = set()
    for item in preferences:
        constraint = item.get("constraint")
        if not constraint or constraint in seen_constraints:
            continue
        preference_constraints.append(constraint)
        seen_constraints.add(constraint)

    return {
        "summary": "；".join(summary_parts),
        "positive_activity_ids": [item["activity_id"] for item in liked_or_completed],
        "clicked_activity_ids": [item["activity_id"] for item in clicked],
        "negative_activity_ids": [item["activity_id"] for item in skipped],
        "recent_activity_ids": [item["activity_id"] for item in recent_recommended],
        "preference_constraints": preference_constraints,
    }


def hydrate_profile_behavior_memory(db: Session, user_profile: dict) -> dict:
    user_id = user_profile.get("user_id")
    if not user_id:
        return user_profile
    memory = build_behavior_memory(db, user_id)
    if not memory:
        return user_profile
    hydrated = dict(user_profile)
    hydrated["behavior_memory"] = memory
    return hydrated
