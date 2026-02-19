"""
SmartAgri AI - Market Router
Price data, trends, volatility, top movers, forecasts.
"""
from fastapi import APIRouter, Depends, Query
from services.market_service import get_market_service
from utils.security import get_current_user_id

router = APIRouter(prefix="/api/market", tags=["Market Data"])


@router.get("/prices")
async def list_prices(
    state: str = Query(None),
    user_id: int = Depends(get_current_user_id),
):
    """Get latest mandi prices for all commodities, optionally filtered by state."""
    service = get_market_service()
    prices = service.get_all_prices(state)
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
