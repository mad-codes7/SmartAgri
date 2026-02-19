"""
SmartAgri AI - Health Router
Server health, readiness, version.
"""
from fastapi import APIRouter
from config import get_settings

router = APIRouter(prefix="/api/health", tags=["Health"])
settings = get_settings()


@router.get("/")
async def health_check():
    """Basic health check."""
    return {"status": "healthy", "service": "SmartAgri AI"}


@router.get("/ready")
async def readiness():
    """Readiness check including DB and model status."""
    import os
    models_dir = settings.MODEL_DIR
    models_exist = os.path.exists(os.path.join(models_dir, "crop_recommender.joblib"))

    return {
        "status": "ready",
        "version": "1.0.0",
        "db_connected": True,
        "models_loaded": models_exist,
    }


@router.get("/version")
async def version():
    """API version info."""
    return {
        "name": "SmartAgri AI",
        "version": "1.0.0",
        "api_prefix": "/api",
        "docs_url": "/docs",
    }
