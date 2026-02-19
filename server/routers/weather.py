"""
SmartAgri AI - Weather Router
Current weather, forecasts, impact analysis, alerts.
"""
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from services.weather_service import get_weather_service
from utils.security import get_current_user_id

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("/current")
async def get_current_weather(
    state: str = Query(...),
    district: str = Query(""),
    user_id: int = Depends(get_current_user_id),
):
    """Get current weather for farmer's location."""
    service = get_weather_service()
    return service.get_current(state, district)


@router.get("/forecast")
async def get_forecast(
    state: str = Query(...),
    days: int = Query(7, ge=1, le=14),
    user_id: int = Depends(get_current_user_id),
):
    """Get multi-day weather forecast."""
    service = get_weather_service()
    forecast = service.get_forecast(state, days)
    return {"location": state, "forecast": forecast}


@router.get("/seasonal")
async def get_seasonal_outlook(
    state: str = Query(...),
    season: str = Query(...),
    user_id: int = Depends(get_current_user_id),
):
    """Get seasonal weather outlook."""
    service = get_weather_service()
    base = service._get_base_weather(state, season)

    monsoon_status = "Normal"
    if base["rainfall"] > 250:
        monsoon_status = "Above Normal"
    elif base["rainfall"] < 100:
        monsoon_status = "Below Normal"

    return {
        "state": state,
        "season": season,
        "avg_temperature": base["temp"],
        "avg_rainfall": base["rainfall"],
        "avg_humidity": base["humidity"],
        "monsoon_status": monsoon_status,
        "outlook": f"{'Favorable' if 100 <= base['rainfall'] <= 250 else 'Mixed'} conditions expected for {season} in {state}",
    }


@router.get("/impact")
async def get_weather_impact(
    state: str = Query(...),
    season: str = Query(...),
    crops: Optional[str] = Query(None, description="Comma-separated crop names"),
    user_id: int = Depends(get_current_user_id),
):
    """Analyze weather impact on crops."""
    service = get_weather_service()
    crop_list = [c.strip() for c in crops.split(",")] if crops else []
    return service.get_impact(state, season, crop_list)


@router.get("/alerts")
async def get_weather_alerts(
    state: str = Query(...),
    user_id: int = Depends(get_current_user_id),
):
    """Get severe weather warnings for region."""
    service = get_weather_service()
    base = service._get_base_weather(state, "Kharif")
    alerts = []

    if base["temp"] > 38:
        alerts.append({
            "type": "heat_wave",
            "severity": "High",
            "message": f"Heat wave warning for {state}. Temperature may exceed 40°C.",
            "advisory": "Increase irrigation, apply mulch, avoid mid-day field work.",
        })
    if base["rainfall"] > 300:
        alerts.append({
            "type": "heavy_rain",
            "severity": "Medium",
            "message": f"Heavy rainfall expected in {state}.",
            "advisory": "Ensure drainage channels are clear. Postpone fertilizer application.",
        })

    if not alerts:
        alerts.append({
            "type": "info",
            "severity": "Low",
            "message": f"No severe weather warnings for {state}.",
            "advisory": "Favorable conditions for farming activities.",
        })

    return {"state": state, "alerts": alerts}
