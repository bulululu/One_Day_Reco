"""Feedback persistence and summary building."""

from sqlalchemy.orm import Session

from backend.services.models import FeedbackEvent, User


FEEDBACK_LABELS = {
    "liked": "喜欢",
    "completed": "完成过",
    "skipped": "跳过",
    "disliked": "不喜欢",
}


def _activity_name(activity_id: str, activities: list[dict]) -> str:
    for activity in activities:
        if activity.get("id") == activity_id:
            specific = activity.get("specific_info") or {}
            return specific.get("name") or activity.get("name") or activity_id
    return activity_id


def _build_summary(events: list[FeedbackEvent]) -> str:
    entries: list[str] = []
    seen: set[str] = set()
    for event in events:
        label = FEEDBACK_LABELS.get(event.feedback, event.feedback)
        name = event.activity_name or event.activity_id
        entry = f"{label}：{name}"
        if entry in seen:
            continue
        entries.append(entry)
        seen.add(entry)
        if len(entries) >= 10:
            break
    return "；".join(entries)


def record_feedback(
    db: Session,
    user_id: str,
    activity_id: str,
    feedback: str,
    activities: list[dict],
) -> dict:
    activity_name = _activity_name(activity_id, activities)
    event = FeedbackEvent(
        user_id=user_id,
        activity_id=activity_id,
        activity_name=activity_name,
        feedback=feedback,
    )
    db.add(event)

    recent_events = (
        db.query(FeedbackEvent)
        .filter(FeedbackEvent.user_id == user_id)
        .order_by(FeedbackEvent.created_at.desc())
        .limit(30)
        .all()
    )
    summary = _build_summary([event, *recent_events])

    user = db.get(User, user_id)
    if user:
        user.feedback_summary = summary
        db.add(user)

    db.commit()
    return {
        "status": "ok",
        "message": "反馈已记录",
        "feedback_summary": summary,
    }


def hydrate_profile_feedback(db: Session, user_profile: dict) -> dict:
    user_id = user_profile.get("user_id")
    if not user_id:
        return user_profile
    user = db.get(User, user_id)
    if not user or not user.feedback_summary:
        return user_profile
    hydrated = dict(user_profile)
    hydrated["feedback_summary"] = user.feedback_summary
    return hydrated
