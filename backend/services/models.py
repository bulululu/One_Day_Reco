"""Database models."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.services.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    mbti: Mapped[str] = mapped_column(String(8), nullable=False, default="INTP")
    preferences_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    feedback_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class FeedbackEvent(Base):
    __tablename__ = "feedback_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    activity_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    activity_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    feedback: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class RecommendationRecord(Base):
    __tablename__ = "recommendation_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="recommend")
    context_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    activity_source_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    recommendations_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    activity_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    activity_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    event_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="app")
    metadata_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
