"""
SmartAgri AI - Crop Calendar Router
Endpoints for the Smart Crop Calendar & Task Scheduler system.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from utils.security import get_current_user_id
from services.crop_calendar_service import generate_schedule, get_supported_crops
from services.geo_data import (
    get_districts,
    get_crops_ranked_for_location,
    STATE_DISTRICTS,
)

router = APIRouter(prefix="/api/calendar", tags=["Crop Calendar"])


@router.get("/states")
async def list_states():
    """Return all supported states with district counts."""
    return {
        "states": [
            {"name": s, "district_count": len(d)}
            for s, d in sorted(STATE_DISTRICTS.items())
        ],
        "total": len(STATE_DISTRICTS),
    }


@router.get("/districts")
async def list_districts(
    state: str = Query(..., description="State name e.g. Punjab"),
):
    """Return real districts for a given state, sorted alphabetically."""
    districts = get_districts(state)
    if not districts:
        return {"state": state, "districts": [], "total": 0, "error": f"No districts found for '{state}'"}
    return {"state": state, "districts": districts, "total": len(districts)}


@router.get("/crops-ranked")
async def get_ranked_crops(
    state: str = Query("Maharashtra", description="State name"),
    district: str = Query("", description="District name — local crops shown first"),
):
    """
    Return crops ranked by local relevance for a given state/district.
    Local crops (grown in that district) appear first with region badges.
    Each crop includes season_fit: optimal | marginal | offseason.
    """
    current_month = datetime.now().month
    result = get_crops_ranked_for_location(state, district, current_month)
    return result


@router.get("/crops")
async def list_supported_crops():
    """Return simple list of all crops (legacy endpoint)."""
    crops = get_supported_crops()
    return {"crops": crops, "total": len(crops)}


@router.get("/schedule")
async def get_crop_schedule(
    crop: str = Query(..., description="Crop name e.g. Wheat, Rice"),
    sowing_date: str = Query(..., description="Sowing date in YYYY-MM-DD format"),
    state: str = Query("Maharashtra", description="State for weather intelligence"),
    district: str = Query("", description="District for localised context"),
    water_source: str = Query("Rainfed", description="Canal / Borewell / Rainfed"),
    user_id: int = Depends(get_current_user_id),
):
    """
    Generate a smart, weather-adjusted crop task schedule.
    Returns tasks categorized as urgent / upcoming / scheduled / done,
    with AI-adjusted dates based on rainfall and temperature forecasts.
    """
    from fastapi import HTTPException
    result = generate_schedule(
        crop_name=crop,
        sowing_date=sowing_date,
        state=state,
        water_source=water_source,
    )
    # If the service returned an error dict, raise properly so frontend gets a 422
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    result["district"] = district
    return result


@router.get("/next-tasks")
async def get_next_tasks(
    crop: str = Query(...),
    sowing_date: str = Query(...),
    state: str = Query("Maharashtra"),
    water_source: str = Query("Rainfed"),
    limit: int = Query(5, ge=1, le=10),
    user_id: int = Depends(get_current_user_id),
):
    """
    Return only the next N urgent/upcoming tasks.
    Optimized for the dashboard widget.
    """
    result = generate_schedule(crop, sowing_date, state, water_source)
    if "error" in result:
        return result

    tasks = [
        t for t in result["tasks"]
        if t["status"] in ["urgent", "upcoming"]
    ][:limit]

    return {
        "crop": result["crop"],
        "current_phase": result["current_phase"],
        "progress_pct": result["progress_pct"],
        "days_elapsed": result["days_elapsed"],
        "harvest_date": result["harvest_date"],
        "next_tasks": tasks,
        "next_task": result.get("next_task"),
        "weather_summary": result.get("weather_summary"),
    }
