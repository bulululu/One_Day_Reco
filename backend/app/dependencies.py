import json
from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from backend.agents.recommendation_agent import RecommendationAgent
from backend.app.schemas import AuthUser
from backend.services.auth_service import verify_token
from backend.services.database import get_db
from backend.services.models import User


agent = RecommendationAgent()


def auth_user(user: User) -> AuthUser:
    try:
        preferences = json.loads(user.preferences_json or "{}")
    except json.JSONDecodeError:
        preferences = {}
    return AuthUser(
        user_id=user.id,
        email=user.email,
        mbti=user.mbti,
        preferences=preferences,
        feedback_summary=user.feedback_summary,
    )


def current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    user_id = verify_token(authorization.replace("Bearer ", "", 1).strip())
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
