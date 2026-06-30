from fastapi import APIRouter

from backend.app.dependencies import agent
from backend.services.config_status_service import get_config_status


router = APIRouter(prefix="/api", tags=["config"])


@router.get("/config/status")
async def config_status():
    return get_config_status(agent.client is not None)
