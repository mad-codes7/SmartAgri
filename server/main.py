"""
SmartAgri AI - FastAPI Application Entry Point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("🌾 SmartAgri AI Server Starting...")
    await init_db()
    print("✅ Database initialized")

    # Ensure upload dir exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.MODEL_DIR, exist_ok=True)

    # Pre-load ML models
    from services.recommendation import get_engine
    get_engine(settings.MODEL_DIR)

    # Pre-load market data
    from services.market_service import get_market_service
    get_market_service()

    print("🚀 SmartAgri AI Server Ready!")
    print(f"   API docs: http://{settings.HOST}:{settings.PORT}/docs")
    yield

    # Shutdown
    print("👋 SmartAgri AI Server Shutting Down...")


app = FastAPI(
    title="SmartAgri AI",
    description="Farmer Advisory & Crop Decision Support System API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from routers import auth, recommend, market, weather, crops, schemes, history, health, chatbot, disease, districts, community, map, expenses, fertilizer, crop_calendar, soil_report

app.include_router(auth.router)
app.include_router(recommend.router)
app.include_router(market.router)
app.include_router(weather.router)
app.include_router(crops.router)
app.include_router(schemes.router)
app.include_router(history.router)
app.include_router(health.router)
app.include_router(chatbot.router)
app.include_router(disease.router)
app.include_router(districts.router)
app.include_router(community.router)
app.include_router(map.router)
app.include_router(expenses.router)
app.include_router(fertilizer.router)
app.include_router(crop_calendar.router)
app.include_router(soil_report.router)


@app.get("/")
async def root():
    return {
        "name": "SmartAgri AI",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
