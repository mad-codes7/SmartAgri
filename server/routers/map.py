"""
SmartAgri AI - Map Router
Personalized farm map data — mandis, crops, soil, irrigation, nearby districts.
"""
import json
import os
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict
from database import get_db
from db_models import User
from utils.security import get_current_user_id

router = APIRouter(prefix="/api/map", tags=["Farm Map"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data", "raw")

try:
    with open(os.path.join(DATA_DIR, "maharashtra_district_profiles.json"), "r", encoding="utf-8") as f:
        MH_DISTRICTS: Dict = json.load(f)
except FileNotFoundError:
    MH_DISTRICTS = {}

# District coordinates for map pins (approximate lat/lng for 10 key districts)
DISTRICT_COORDS = {
    "Pune":       {"lat": 18.5204, "lng": 73.8567},
    "Nashik":     {"lat": 19.9975, "lng": 73.7898},
    "Nagpur":     {"lat": 21.1458, "lng": 79.0882},
    "Aurangabad": {"lat": 19.8762, "lng": 75.3433},
    "Kolhapur":   {"lat": 16.7050, "lng": 74.2433},
    "Solapur":    {"lat": 17.6599, "lng": 75.9064},
    "Satara":     {"lat": 17.6805, "lng": 74.0183},
    "Sangli":     {"lat": 16.8524, "lng": 74.5815},
    "Latur":      {"lat": 18.4088, "lng": 76.5604},
    "Ahmednagar": {"lat": 19.0948, "lng": 74.7480},
}


def _get_nearby_districts(district: str) -> List[Dict]:
    """Find districts in the same division/region."""
    profile = MH_DISTRICTS.get(district, {})
    division = profile.get("division", "")
    region = profile.get("region", "")

    nearby = []
    for name, data in MH_DISTRICTS.items():
        if name == district:
            continue
        # Same division or same region = nearby
        if data.get("division") == division or data.get("region") == region:
            nearby.append({
                "name": name,
                "region": data.get("region", ""),
                "division": data.get("division", ""),
                "dominant_crops": [c["name"] for c in data.get("dominant_crops", [])[:3]],
                "num_mandis": len(data.get("mandis", [])),
                "coords": DISTRICT_COORDS.get(name),
            })
    return nearby


@router.get("/data")
async def get_map_data(
    district: Optional[str] = Query(None, description="Override district (default: user's profile district)"),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Personalized farm map data for the user's district.
    Returns: district overview, mandis, crops, soil/irrigation, nearby districts, alerts.
    """
    # Get user's district if not overridden
    if not district:
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        if user:
            district = user.district

    if not district or district not in MH_DISTRICTS:
        # Return list of available districts + generic overview
        return {
            "personalized": False,
            "district": None,
            "available_districts": [
                {
                    "name": k,
                    "region": v.get("region", ""),
                    "dominant_crops": [c["name"] for c in v.get("dominant_crops", [])[:2]],
                    "num_mandis": len(v.get("mandis", [])),
                    "coords": DISTRICT_COORDS.get(k),
                }
                for k, v in MH_DISTRICTS.items()
            ],
        }

    profile = MH_DISTRICTS[district]

    return {
        "personalized": True,
        "district": district,
        "state": "Maharashtra",
        "coords": DISTRICT_COORDS.get(district),

        # Overview
        "overview": {
            "region": profile.get("region", ""),
            "division": profile.get("division", ""),
            "agro_climate": profile.get("agro_climate", ""),
            "soil_types": profile.get("soil_types", []),
            "irrigation": profile.get("irrigation", {}),
        },

        # Mandis with all details
        "mandis": profile.get("mandis", []),

        # Dominant crops with full info
        "crops": profile.get("dominant_crops", []),

        # Price alerts
        "alerts": profile.get("price_alerts", []),

        # Krishi Vibhag contact
        "krishi_vibhag": profile.get("krishi_vibhag", {}),

        # Nearby districts
        "nearby_districts": _get_nearby_districts(district),

        # All district names for exploration
        "all_districts": list(MH_DISTRICTS.keys()),
    }
