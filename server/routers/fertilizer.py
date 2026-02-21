"""
SmartAgri AI - Fertilizer & Pesticide Recommendation Router
Scientific recommendations based on ICAR guidelines.
"""
from fastapi import APIRouter
from schemas import FertilizerRequest, FertilizerResponse
from services.fertilizer_service import get_full_recommendation

router = APIRouter(prefix="/api/fertilizer", tags=["Fertilizer & Pesticide"])


@router.post("/recommend", response_model=FertilizerResponse)
async def recommend_fertilizer(data: FertilizerRequest):
    """Get fertilizer, pest risk, and pesticide recommendations for a crop."""
    result = get_full_recommendation({
        "state": data.state,
        "district": data.district,
        "crop": data.crop,
        "growth_stage": data.growth_stage,
        "soil_type": data.soil_type,
        "temperature": data.temperature,
        "humidity": data.humidity,
        "rainfall": data.rainfall,
    })
    return result
