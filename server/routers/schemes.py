"""
SmartAgri AI - Schemes Router
Government agricultural schemes.
"""
import json
import os
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from utils.security import get_current_user_id

router = APIRouter(prefix="/api/schemes", tags=["Government Schemes"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data", "raw")

with open(os.path.join(DATA_DIR, "government_schemes.json"), "r", encoding="utf-8") as f:
    SCHEMES = json.load(f)
SCHEME_BY_ID = {s["id"]: s for s in SCHEMES}


@router.get("/")
async def list_schemes(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
):
    """List all government schemes."""
    total = len(SCHEMES)
    start = (page - 1) * per_page
    items = SCHEMES[start: start + per_page]
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.get("/filter")
async def filter_schemes(
    state: Optional[str] = None,
    crop: Optional[str] = None,
    max_land: Optional[float] = None,
):
    """Filter schemes by state, crop, or land size."""
    filtered = SCHEMES
    if state:
        filtered = [
            s for s in filtered
            if "All States" in (s.get("applicable_states") or "") or state.lower() in (s.get("applicable_states") or "").lower()
        ]
    if crop:
        filtered = [
            s for s in filtered
            if "All crops" in (s.get("applicable_crops") or "") or crop.lower() in (s.get("applicable_crops") or "").lower()
        ]
    if max_land is not None:
        filtered = [
            s for s in filtered
            if s.get("max_land_size") is None or max_land <= s["max_land_size"]
        ]
    return {"results": filtered, "total": len(filtered)}


@router.get("/recommended")
async def recommended_schemes(
    user_id: int = Depends(get_current_user_id),
):
    """Get schemes relevant to the farmer's profile."""
    # For now, return all general schemes
    return {"schemes": SCHEMES[:5], "total": 5}


@router.get("/{scheme_id}")
async def get_scheme(scheme_id: int):
    """Get scheme details."""
    scheme = SCHEME_BY_ID.get(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme
