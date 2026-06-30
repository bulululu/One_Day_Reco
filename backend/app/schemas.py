from typing import Optional, List

from pydantic import BaseModel


class UserProfile(BaseModel):
    user_id: str
    mbti: str
    preferences: dict = {}
    feedback_summary: str = ""


class RecommendRequest(BaseModel):
    user_profile: UserProfile
    context: Optional[dict] = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    user_profile: UserProfile
    message: str
    context: Optional[dict] = None
    history: Optional[List[ChatMessage]] = None


class FeedbackRequest(BaseModel):
    user_id: str
    activity_id: str
    feedback: str
    activity_name: str = ""


class TriggerRequest(BaseModel):
    user_profile: UserProfile
    app_name: str
    app_category: str = "screen"
    usage_minutes: int
    continuous_minutes: Optional[int] = None
    context: Optional[dict] = None


class ActivityEventRequest(BaseModel):
    user_id: str
    activity_id: str
    event_type: str
    activity_name: str = ""
    source: str = "app"
    metadata: dict = {}


class WeatherResponse(BaseModel):
    location: str
    country: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    weather: str
    temperature: Optional[float] = None
    display: str
    source: str


class PlaceCandidate(BaseModel):
    id: str
    name: str
    address: str = ""
    type: str = ""
    typecode: str = ""
    location: str = ""
    distance: str = ""
    tel: str = ""
    business_area: str = ""
    pname: str = ""
    cityname: str = ""
    adname: str = ""
    source: str = "AMap"


class AuthRequest(BaseModel):
    email: str
    password: str
    mbti: str = "INTP"
    preferences: dict = {}


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    mbti: Optional[str] = None
    preferences: Optional[dict] = None
    feedback_summary: Optional[str] = None


class AuthUser(BaseModel):
    user_id: str
    email: str
    mbti: str
    preferences: dict
    feedback_summary: str


class AuthResponse(BaseModel):
    token: str
    user: AuthUser
