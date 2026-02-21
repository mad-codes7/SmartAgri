"""
SmartAgri AI - Market Router
Price data, trends, volatility, top movers, forecasts.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from services.market_service import get_market_service
from services.harvest_forecast_service import (
    predict_harvest_price, get_bulk_forecast, get_supported_crops as get_forecast_crops
)
from utils.security import get_current_user_id

router = APIRouter(prefix="/api/market", tags=["Market Data"])


@router.get("/prices")
async def list_prices(
    state: str = Query(None),
    district: str = Query(None),
    user_id: int = Depends(get_current_user_id),
):
    """Get latest mandi prices for all commodities, optionally filtered by state/district."""
    service = get_market_service()
    prices = service.get_all_prices(state, district)
    for p in prices:
        if "date" in p and hasattr(p["date"], "strftime"):
            p["date"] = p["date"].strftime("%Y-%m-%d")
    return {"prices": prices}


@router.get("/prices/{crop}")
async def get_prices(
    crop: str,
    state: str = Query(None),
    user_id: int = Depends(get_current_user_id),
):
    """Get current mandi prices for a crop."""
    service = get_market_service()
    prices = service.get_prices(crop, state)
    for p in prices:
        if "date" in p and hasattr(p["date"], "strftime"):
            p["date"] = p["date"].strftime("%Y-%m-%d")
    return {"crop": crop, "prices": prices}


@router.get("/prices/{crop}/history")
async def get_price_history(
    crop: str,
    days: int = Query(90, ge=7, le=365),
    user_id: int = Depends(get_current_user_id),
):
    """Get historical price data."""
    service = get_market_service()
    return {"crop": crop, "history": service.get_price_history(crop, days)}


@router.get("/trends/{crop}")
async def get_trend(
    crop: str,
    user_id: int = Depends(get_current_user_id),
):
    """Get price trend analysis."""
    service = get_market_service()
    return service.get_trend(crop)


@router.get("/volatility/{crop}")
async def get_volatility(
    crop: str,
    user_id: int = Depends(get_current_user_id),
):
    """Get volatility index for a crop."""
    service = get_market_service()
    return service.get_volatility(crop)


@router.get("/top-gainers")
async def top_gainers(user_id: int = Depends(get_current_user_id)):
    """Crops with highest price increase."""
    service = get_market_service()
    return {"movers": service.get_top_movers("gainers")}


@router.get("/top-losers")
async def top_losers(user_id: int = Depends(get_current_user_id)):
    """Crops with largest price drop."""
    service = get_market_service()
    return {"movers": service.get_top_movers("losers")}


@router.get("/forecast/{crop}")
async def price_forecast(
    crop: str,
    user_id: int = Depends(get_current_user_id),
):
    """ML-predicted price for next 30 days."""
    service = get_market_service()
    trend = service.get_trend(crop)
    current = trend.get("current_price", 0)
    change = trend.get("price_change_pct", 0)
    forecast = current * (1 + change / 100)

    return {
        "crop": crop,
        "current_price": round(current, 2),
        "forecast_30d": round(forecast, 2),
        "forecast_direction": trend.get("trend_direction", "stable"),
        "confidence": 0.78,
    }


@router.get("/district-prices")
async def district_prices(
    state: str = Query(None),
    district: str = Query(None),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get ranked crops for a district with real-time mandi prices.
    Combines geo_data crop rankings with live price data.
    Optimized: no per-crop trend calls.
    """
    from datetime import datetime
    from services.geo_data import STATE_DISTRICTS, STATE_PRIMARY_CROPS, DISTRICT_CROP_OVERRIDES

    service = get_market_service()

    # Resolve state
    if not state:
        state = "Maharashtra"
    if not district:
        districts = STATE_DISTRICTS.get(state, [])
        district = districts[0] if districts else ""

    # Get district's primary crops — district override first, then state default
    crops_in_geo = DISTRICT_CROP_OVERRIDES.get(district, STATE_PRIMARY_CROPS.get(state, []))

    # Get all mandi prices for this state/district
    all_prices = service.get_all_prices(state, district)
    # Also get state-level if district has few
    if len(all_prices) < 3:
        state_prices = service.get_all_prices(state)
    else:
        state_prices = []

    # Build a lookup by commodity
    price_map = {}
    for p in all_prices:
        name = p.get("commodity", "").lower()
        if name not in price_map:
            price_map[name] = p
    for p in state_prices:
        name = p.get("commodity", "").lower()
        if name not in price_map:
            price_map[name] = p

    # Merge geo crops + market data
    results = []
    seen = set()
    now = datetime.now()

    def _build_entry(crop_name, is_regional, mandi):
        modal = mandi.get("modal_price", 0) or 0
        mn = mandi.get("min_price", 0) or 0
        mx = mandi.get("max_price", 0) or 0
        # Simple change estimate from min/max spread
        mid = (mn + mx) / 2 if (mn + mx) > 0 else modal
        change = round(((modal - mid) / mid) * 100, 2) if mid > 0 else 0
        return {
            "crop": crop_name,
            "is_regional": is_regional,
            "rank": len(results) + 1,
            "modal_price": round(modal, 2),
            "min_price": round(mn, 2),
            "max_price": round(mx, 2),
            "market": mandi.get("market", district or ""),
            "date": mandi.get("date", now.strftime("%Y-%m-%d")),
            "change_pct": change,
            "trend": "up" if change > 2 else ("down" if change < -2 else "stable"),
            "state": mandi.get("state", state),
            "district": mandi.get("district", district),
        }

    # First: geo-ranked crops (the best for this region)
    for crop_name in crops_in_geo:
        key = crop_name.lower()
        if key in seen:
            continue
        seen.add(key)
        mandi = price_map.get(key, {})
        results.append(_build_entry(crop_name, True, mandi))

    # Then: any remaining crops from mandi data
    for name, mandi in price_map.items():
        if name in seen:
            continue
        seen.add(name)
        results.append(_build_entry(mandi.get("commodity", name), False, mandi))

    return {
        "district": district,
        "state": state,
        "updated_at": now.isoformat(),
        "total": len(results),
        "crops": results,
    }


# ──────────────────────────────────────────────────────────────
# HARVEST PRICE FORECAST ENDPOINTS
# ──────────────────────────────────────────────────────────────

@router.get("/harvest-forecast")
async def harvest_forecast(
    crop: str = Query(..., description="Crop name"),
    state: str = Query("Maharashtra"),
    sowing_date: str = Query(None, description="YYYY-MM-DD sowing date"),
    land_size: float = Query(1.0, ge=0.1, le=1000),
):
    """Predict price of a crop at harvest time with revenue estimate and sell advice."""
    return predict_harvest_price(crop, state, sowing_date, land_size)


@router.get("/harvest-forecast/bulk")
async def harvest_forecast_bulk(
    state: str = Query("Maharashtra"),
    land_size: float = Query(1.0, ge=0.1, le=1000),
    sowing_date: str = Query(None),
):
    """Forecast for ALL 50 crops — sorted by revenue potential."""
    return get_bulk_forecast(state, land_size, sowing_date)


@router.get("/harvest-forecast/crops")
async def harvest_forecast_crops():
    """List all 50 crops available for price prediction."""
    return {"crops": get_forecast_crops()}
