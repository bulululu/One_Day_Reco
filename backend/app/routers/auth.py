import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.dependencies import auth_user, current_user
from backend.app.schemas import AuthRequest, AuthResponse, AuthUser, LoginRequest, ProfileUpdateRequest
from backend.services.auth_service import create_token, hash_password, verify_password
from backend.services.database import get_db
from backend.services.models import User


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(req: AuthRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    if "@" not in email or len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Email invalid or password too short")
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(req.password),
        mbti=req.mbti,
        preferences_json=json.dumps(req.preferences, ensure_ascii=False),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthResponse(token=create_token(user.id), user=auth_user(user))


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthResponse(token=create_token(user.id), user=auth_user(user))


@router.get("/me", response_model=AuthUser)
async def me(user: User = Depends(current_user)):
    return auth_user(user)


@router.put("/me/profile", response_model=AuthUser)
async def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if req.mbti:
        user.mbti = req.mbti
    if req.preferences is not None:
        user.preferences_json = json.dumps(req.preferences, ensure_ascii=False)
    if req.feedback_summary is not None:
        user.feedback_summary = req.feedback_summary
    db.add(user)
    db.commit()
    db.refresh(user)
    return auth_user(user)
