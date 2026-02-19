"""
SmartAgri AI - Crops Router
Crop encyclopedia, search, nutrient profiles, calendar.
"""
import json
import os
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List

router = APIRouter(prefix="/api/crops", tags=["Crop Library"])

# Load crop encyclopedia
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data", "raw")

with open(os.path.join(DATA_DIR, "crop_encyclopedia.json"), "r", encoding="utf-8") as f:
    CROPS = json.load(f)
CROP_BY_ID = {c["id"]: c for c in CROPS}
CROP_BY_NAME = {c["name"].lower(): c for c in CROPS}


@router.get("/")
async def list_crops(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    season: Optional[str] = None,
    soil_type: Optional[str] = None,
):
    """List all crops with optional filtering."""
    filtered = CROPS
    if season:
        filtered = [c for c in filtered if season in c.get("seasons", [])]
    if soil_type:
        filtered = [c for c in filtered if soil_type in c.get("soil_types", [])]

    total = len(filtered)
    start = (page - 1) * per_page
    end = start + per_page
    items = filtered[start:end]

    return {
        "items": [
            {
                "id": c["id"],
                "name": c["name"],
                "hindi_name": c.get("hindi_name"),
                "seasons": c.get("seasons", []),
                "growth_days": c.get("growth_days"),
                "soil_types": c.get("soil_types", []),
            }
            for c in items
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.get("/search")
async def search_crops(
    q: str = Query(..., min_length=1),
    season: Optional[str] = None,
):
    """Search crops by name."""
    query = q.lower()
    results = [
        c for c in CROPS
        if query in c["name"].lower() or query in c.get("hindi_name", "").lower()
    ]
    if season:
        results = [c for c in results if season in c.get("seasons", [])]

    return {
        "results": [
            {"id": c["id"], "name": c["name"], "hindi_name": c.get("hindi_name"), "seasons": c.get("seasons", [])}
            for c in results
        ],
        "total": len(results),
    }


@router.get("/seasonal/{season}")
async def get_seasonal_crops(season: str):
    """Get crops suitable for a specific season."""
    crops = [c for c in CROPS if season in c.get("seasons", [])]
    return {
        "season": season,
        "crops": [
            {
                "id": c["id"],
                "name": c["name"],
                "hindi_name": c.get("hindi_name"),
                "growth_days": c.get("growth_days"),
                "avg_cost_per_hectare": c.get("avg_cost_per_hectare"),
            }
            for c in crops
        ],
        "total": len(crops),
    }


@router.get("/{crop_id}")
async def get_crop_detail(crop_id: int):
    """Get full crop details."""
    crop = CROP_BY_ID.get(crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return crop


@router.get("/{crop_id}/nutrient-profile")
async def get_nutrient_profile(crop_id: int):
    """Get NPK requirements and ideal soil conditions."""
    crop = CROP_BY_ID.get(crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    return {
        "crop": crop["name"],
        "nutrients": {
            "nitrogen": {"min": crop["min_n"], "max": crop["max_n"], "unit": "kg/ha"},
            "phosphorus": {"min": crop["min_p"], "max": crop["max_p"], "unit": "kg/ha"},
            "potassium": {"min": crop["min_k"], "max": crop["max_k"], "unit": "kg/ha"},
        },
        "soil_ph": {"min": crop["min_ph"], "max": crop["max_ph"]},
        "temperature": {"min": crop["min_temp"], "max": crop["max_temp"], "unit": "°C"},
        "rainfall": {"min": crop["min_rainfall"], "max": crop["max_rainfall"], "unit": "mm"},
        "humidity": {"min": crop["min_humidity"], "max": crop["max_humidity"], "unit": "%"},
        "suitable_soils": crop.get("soil_types", []),
    }


@router.get("/{crop_id}/calendar")
async def get_crop_calendar(crop_id: int):
    """Get sowing-to-harvest calendar."""
    crop = CROP_BY_ID.get(crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    seasons = crop.get("seasons", [])
    sowing_months = {"Kharif": ["June", "July"], "Rabi": ["October", "November"], "Summer": ["February", "March"]}
    harvest_map = {"Kharif": ["October", "November"], "Rabi": ["March", "April"], "Summer": ["May", "June"]}

    sowing = []
    harvest = []
    for s in seasons:
        sowing.extend(sowing_months.get(s, []))
        harvest.extend(harvest_map.get(s, []))

    return {
        "crop": crop["name"],
        "sowing_months": sowing,
        "growing_period_days": crop.get("growth_days", 120),
        "harvest_months": harvest,
        "key_activities": [
            {"stage": "Land Preparation", "timing": "2-3 weeks before sowing", "activity": "Plowing, leveling, manure application"},
            {"stage": "Sowing", "timing": ", ".join(sowing), "activity": "Seed treatment and sowing at recommended spacing"},
            {"stage": "Vegetative Growth", "timing": f"1-{crop.get('growth_days', 120)//3} days after sowing", "activity": "First irrigation, weeding, thinning"},
            {"stage": "Flowering/Fruiting", "timing": "Mid-season", "activity": "Second fertilizer dose, pest monitoring"},
            {"stage": "Harvest", "timing": ", ".join(harvest), "activity": "Harvest at optimal maturity, drying, storage"},
        ],
    }
