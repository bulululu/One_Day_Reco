"""FastAPI app wiring for OneDayReco."""

from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.dependencies import agent
from backend.app.routers import activities, auth, config, content, feedback, movies, places, recommendations, weather
from backend.services.database import init_db


app = FastAPI(
    title="OneDayReco API",
    description="基于 MBTI 的每日活动推荐服务",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/")
async def root():
    return {"message": "OneDayReco API is running", "version": "0.2.0"}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "activities_count": len(agent.activities),
        "llm_available": agent.client is not None,
    }


app.include_router(auth.router)
app.include_router(activities.router)
app.include_router(config.router)
app.include_router(content.router)
app.include_router(places.router)
app.include_router(movies.router)
app.include_router(weather.router)
app.include_router(recommendations.router)
app.include_router(feedback.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
