"""
SmartAgri AI - Districts Router
Maharashtra district profiles: crops, mandis, alerts, Krishi Vibhag contacts.
"""
import json
import os
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from utils.security import get_current_user_id

router = APIRouter(prefix="/api/districts", tags=["District Profiles"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data", "raw")

try:
    with open(os.path.join(DATA_DIR, "maharashtra_district_profiles.json"), "r", encoding="utf-8") as f:
        MH_DISTRICTS = json.load(f)
except FileNotFoundError:
    MH_DISTRICTS = {}


@router.get("/profile")
async def get_district_profile(
    district: str = Query(..., description="District name, e.g. Pune"),
    state: str = Query("Maharashtra"),
    user_id: int = Depends(get_current_user_id),
):
    """Full district profile: dominant crops, mandis, alerts, Krishi Vibhag contact."""
    # Only Maharashtra districts supported currently
    if state != "Maharashtra":
        raise HTTPException(status_code=404, detail=f"District profiles not yet available for {state}. Currently supporting Maharashtra.")

    profile = MH_DISTRICTS.get(district)
    if not profile:
        # Return closest match or partial data
        available = list(MH_DISTRICTS.keys())
        raise HTTPException(
            status_code=404,
            detail=f"Profile not found for '{district}'. Available: {', '.join(available)}"
        )
    return profile


@router.get("/mandis")
async def get_district_mandis(
    district: str = Query(...),
    state: str = Query("Maharashtra"),
    user_id: int = Depends(get_current_user_id),
):
    """Top APMC mandis for a district with their commodities and contacts."""
    if state != "Maharashtra":
        raise HTTPException(status_code=404, detail="Mandi data currently available only for Maharashtra.")

    profile = MH_DISTRICTS.get(district)
    if not profile:
        raise HTTPException(status_code=404, detail=f"No mandi data for '{district}'.")

    mandis = profile.get("mandis", [])
    return {
        "district": district,
        "state": state,
        "mandis": mandis,
        "total": len(mandis),
    }


@router.get("/alerts")
async def get_price_alerts(
    district: str = Query(...),
    state: str = Query("Maharashtra"),
    user_id: int = Depends(get_current_user_id),
):
    """Price trend alerts for crops in the district."""
    if state != "Maharashtra":
        raise HTTPException(status_code=404, detail="Price alerts currently available only for Maharashtra.")

    profile = MH_DISTRICTS.get(district)
    if not profile:
        raise HTTPException(status_code=404, detail=f"No alerts for '{district}'.")

    alerts = profile.get("price_alerts", [])
    return {
        "district": district,
        "state": state,
        "alerts": alerts,
        "generated_at": datetime.now().isoformat(),
        "total": len(alerts),
    }


@router.get("/krishi-vibhag")
async def get_krishi_vibhag(
    district: str = Query(...),
    state: str = Query("Maharashtra"),
    user_id: int = Depends(get_current_user_id),
):
    """Krishi Vibhag (District Agriculture Office) contact for the district."""
    if state != "Maharashtra":
        raise HTTPException(status_code=404, detail="Krishi Vibhag data currently available only for Maharashtra.")

    profile = MH_DISTRICTS.get(district)
    if not profile:
        raise HTTPException(status_code=404, detail=f"No Krishi Vibhag data for '{district}'.")

    return {
        "district": district,
        "state": state,
        "krishi_vibhag": profile.get("krishi_vibhag", {}),
    }


@router.get("/list")
async def list_districts(
    state: str = Query("Maharashtra"),
    user_id: int = Depends(get_current_user_id),
):
    """List all districts with available profiles."""
    if state != "Maharashtra":
        return {"districts": [], "state": state, "message": "Only Maharashtra supported currently."}
    return {
        "state": state,
        "districts": list(MH_DISTRICTS.keys()),
        "total": len(MH_DISTRICTS),
    }
