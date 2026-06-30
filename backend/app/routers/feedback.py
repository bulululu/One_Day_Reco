from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.dependencies import agent
from backend.app.schemas import FeedbackRequest
from backend.services.database import get_db
from backend.services.feedback_service import record_feedback


router = APIRouter(prefix="/api", tags=["feedback"])


@router.post("/feedback")
async def feedback(req: FeedbackRequest, db: Session = Depends(get_db)):
    return record_feedback(
        db,
        req.user_id,
        req.activity_id,
        req.feedback,
        agent.activities,
    )
