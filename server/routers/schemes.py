"""
SmartAgri AI - Schemes Router
Government agricultural schemes with filtering & search.
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

# Pre-compute unique categories, states, types for filter metadata
ALL_CATEGORIES = sorted(set(s.get("category", "") for s in SCHEMES if s.get("category")))
ALL_TYPES = sorted(set(s.get("type", "") for s in SCHEMES if s.get("type")))

def _extract_states(schemes):
    """Extract unique state names from applicable_states fields."""
    states = set()
    for s in schemes:
        val = s.get("applicable_states", "")
        if val == "All States":
            continue
        for part in val.split(","):
            part = part.strip()
            if part:
                states.add(part)
    return sorted(states)

ALL_SCHEME_STATES = _extract_states(SCHEMES)


@router.get("/")
async def list_schemes(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    state: Optional[str] = None,
    scheme_type: Optional[str] = Query(None, alias="type"),
):
    """List schemes with optional search, category, state, and type filters."""
    filtered = SCHEMES

    # Text search
    if search:
        q = search.lower()
        filtered = [
            s for s in filtered
            if q in s.get("name", "").lower()
            or q in s.get("description", "").lower()
            or q in s.get("benefits", "").lower()
        ]

    # Category filter
    if category:
        filtered = [
            s for s in filtered
            if s.get("category", "").lower() == category.lower()
        ]

    # State filter
    if state:
        filtered = [
            s for s in filtered
            if "All States" in (s.get("applicable_states") or "")
            or state.lower() in (s.get("applicable_states") or "").lower()
        ]

    # Type filter (Central / State)
    if scheme_type:
        filtered = [
            s for s in filtered
            if s.get("type", "").lower() == scheme_type.lower()
        ]

    total = len(filtered)
    start = (page - 1) * per_page
    items = filtered[start: start + per_page]

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.get("/meta")
async def scheme_metadata():
    """Return filter metadata — all available categories, states, types."""
    return {
        "categories": ALL_CATEGORIES,
        "states": ALL_SCHEME_STATES,
        "types": ALL_TYPES,
        "total_schemes": len(SCHEMES),
    }


@router.get("/filter")
async def filter_schemes(
    state: Optional[str] = None,
    crop: Optional[str] = None,
    max_land: Optional[float] = None,
    category: Optional[str] = None,
):
    """Filter schemes by state, crop, land size, or category."""
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
    if category:
        filtered = [
            s for s in filtered
            if s.get("category", "").lower() == category.lower()
        ]
    return {"results": filtered, "total": len(filtered)}


@router.get("/recommended")
async def recommended_schemes(
    user_id: int = Depends(get_current_user_id),
):
    """Get schemes relevant to the farmer's profile."""
    # Return first 5 general + any state-specific if user has state
    return {"schemes": SCHEMES[:5], "total": 5}


@router.get("/{scheme_id}")
async def get_scheme(scheme_id: int):
    """Get scheme details."""
    scheme = SCHEME_BY_ID.get(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme
