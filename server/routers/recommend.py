"""
SmartAgri AI - Recommendation Router
Crop recommendation, comparison, what-if analysis.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from db_models import Recommendation, CropResult
from schemas import (
    RecommendationRequest, QuickRecommendRequest, CropCompareRequest,
    WhatIfRequest, RecommendationResponse, MessageResponse,
)
from services.recommendation import get_engine
from utils.security import get_current_user_id
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/recommend", tags=["Recommendations"])


@router.post("/", response_model=RecommendationResponse)
async def get_recommendation(
    data: RecommendationRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get top 3 crop recommendations based on farm data."""
    engine = get_engine(settings.MODEL_DIR)

    params = {
        "state": data.state,
        "district": data.district,
        "land_size_acres": data.land_size_acres,
        "irrigation_type": data.irrigation_type,
        "previous_crop": data.previous_crop,
        "soil": {
            "N": data.soil.N,
            "P": data.soil.P,
            "K": data.soil.K,
            "ph": data.soil.ph,
            "soil_type": data.soil.soil_type,
        },
        "weather": {
            "temperature": data.weather.temperature,
            "humidity": data.weather.humidity,
            "rainfall": data.weather.rainfall,
            "season": data.weather.season,
        },
    }

    result = engine.get_recommendation(params)

    # Save to history
    rec = Recommendation(
        user_id=user_id,
        input_params=params,
        season=data.weather.season,
        overall_risk_score=result["risk_assessment"]["overall_score"],
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    for i, crop in enumerate(result["crops"], 1):
        cr = CropResult(
            recommendation_id=rec.id,
            crop_name=crop["name"],
            rank=i,
            suitability_score=crop["suitability_score"],
            predicted_yield=float(crop["expected_yield"].split()[0]),
            predicted_price=float(crop["predicted_price"].replace("₹", "").replace(",", "").split("/")[0]),
            estimated_cost=float(crop["estimated_cost"].replace("₹", "").replace(",", "")),
            estimated_profit=float(crop["estimated_profit"].replace("₹", "").replace(",", "")),
            risk_level=crop["risk_level"],
            reasoning=crop["why_this_crop"],
        )
        db.add(cr)
    await db.commit()

    result["id"] = rec.id
    return result


@router.post("/quick", response_model=RecommendationResponse)
async def quick_recommendation(
    data: QuickRecommendRequest,
    user_id: int = Depends(get_current_user_id),
):
    """Quick recommendation with minimal inputs."""
    engine = get_engine(settings.MODEL_DIR)

    params = {
        "state": data.state,
        "district": "",
        "land_size_acres": 1.0,
        "irrigation_type": data.irrigation_type,
        "soil": {
            "N": data.N, "P": data.P, "K": data.K,
            "ph": data.ph, "soil_type": data.soil_type,
        },
        "weather": {
            "temperature": data.temperature,
            "humidity": data.humidity,
            "rainfall": data.rainfall,
            "season": data.season,
        },
    }

    return engine.get_recommendation(params)


@router.get("/{rec_id}")
async def get_saved_recommendation(
    rec_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a saved recommendation by ID."""
    result = await db.execute(
        select(Recommendation).where(
            Recommendation.id == rec_id,
            Recommendation.user_id == user_id,
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    crop_results = await db.execute(
        select(CropResult).where(CropResult.recommendation_id == rec_id).order_by(CropResult.rank)
    )
    crops = crop_results.scalars().all()

    return {
        "id": rec.id,
        "input_params": rec.input_params,
        "season": rec.season,
        "overall_risk_score": rec.overall_risk_score,
        "created_at": rec.created_at,
        "crops": [
            {
                "name": c.crop_name,
                "rank": c.rank,
                "suitability_score": c.suitability_score,
                "predicted_yield": c.predicted_yield,
                "predicted_price": c.predicted_price,
                "estimated_cost": c.estimated_cost,
                "estimated_profit": c.estimated_profit,
                "risk_level": c.risk_level,
                "reasoning": c.reasoning,
            }
            for c in crops
        ],
    }


@router.post("/compare")
async def compare_crops(
    data: CropCompareRequest,
    user_id: int = Depends(get_current_user_id),
):
    """Compare 2-3 crops side by side."""
    engine = get_engine(settings.MODEL_DIR)
    comparison = []

    for crop_name in data.crops:
        price = engine._estimate_price(crop_name)
        base_yield = engine._estimate_yield(crop_name, data.state, data.season)
        cost = 30000
        from services.recommendation import CROP_LOOKUP
        db_crop = CROP_LOOKUP.get(crop_name.lower(), {})
        if db_crop:
            cost = db_crop.get("avg_cost_per_hectare", 30000)

        risk = engine._calculate_risk(
            crop_name,
            {"temperature": 25, "humidity": 70, "rainfall": 150},
            "Rainfed",
            db_crop,
        )

        comparison.append({
            "crop": crop_name,
            "yield_per_hectare": base_yield,
            "price_per_quintal": price,
            "cost_per_hectare": cost,
            "profit_per_hectare": round(base_yield * price * 10 - cost, 2),
            "risk_level": risk["level"],
            "growth_days": db_crop.get("growth_days", 120),
            "seasons": db_crop.get("seasons", []),
        })

    return {"comparison": comparison}


@router.post("/what-if")
async def what_if_analysis(
    data: WhatIfRequest,
    user_id: int = Depends(get_current_user_id),
):
    """Simulate yield and profit with modified parameters."""
    engine = get_engine(settings.MODEL_DIR)

    params = {
        "state": data.state,
        "district": "",
        "land_size_acres": data.land_size_acres,
        "irrigation_type": data.irrigation_type,
        "soil": {"N": data.N, "P": data.P, "K": data.K, "ph": data.ph, "soil_type": "Loamy"},
        "weather": {
            "temperature": data.temperature,
            "humidity": data.humidity,
            "rainfall": data.rainfall,
            "season": data.season,
        },
    }

    from services.recommendation import CROP_LOOKUP
    db_crop = CROP_LOOKUP.get(data.crop.lower(), {})
    base_yield = engine._estimate_yield(data.crop, data.state, data.season)
    adjusted_yield = engine._adjust_yield(base_yield, params["soil"], params["weather"], db_crop)
    price = engine._estimate_price(data.crop)
    cost = db_crop.get("avg_cost_per_hectare", 30000) * (data.land_size_acres * 0.4047)
    revenue = adjusted_yield * (data.land_size_acres * 0.4047) * price
    profit = revenue - cost
    risk = engine._calculate_risk(data.crop, params["weather"], data.irrigation_type, db_crop)

    return {
        "crop": data.crop,
        "yield_per_hectare": adjusted_yield,
        "price_per_quintal": price,
        "total_cost": round(cost, 2),
        "total_revenue": round(revenue, 2),
        "estimated_profit": round(profit, 2),
        "risk_level": risk["level"],
        "risk_score": risk["score"],
    }
