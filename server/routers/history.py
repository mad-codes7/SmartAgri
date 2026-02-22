"""
SmartAgri AI - History Router
Past recommendations and reports.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case
from database import get_db
from db_models import Recommendation, CropResult
from utils.security import get_current_user_id

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("/")
async def get_history(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get all past recommendations."""
    result = await db.execute(
        select(Recommendation)
        .where(Recommendation.user_id == user_id)
        .order_by(desc(Recommendation.created_at))
    )
    recs = result.scalars().all()
    items = []
    for rec in recs:
        crops = await db.execute(
            select(CropResult).where(CropResult.recommendation_id == rec.id).order_by(CropResult.rank)
        )
        crop_list = crops.scalars().all()
        top_crop = crop_list[0] if crop_list else None
        items.append({
            "id": rec.id,
            "season": rec.season,
            "top_crop": top_crop.crop_name if top_crop else "N/A",
            "profit_estimate": f"₹{abs(top_crop.estimated_profit):,.0f}" if top_crop else "N/A",
            "risk_level": top_crop.risk_level if top_crop else "N/A",
            "created_at": rec.created_at,
        })
    return {"items": items, "total": len(items)}


@router.get("/stats")
async def get_stats(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate stats for user recommendations."""
    count_result = await db.execute(
        select(func.count(Recommendation.id)).where(Recommendation.user_id == user_id)
    )
    total = count_result.scalar() or 0

    crop_result = await db.execute(
        select(CropResult.crop_name, func.count(CropResult.id).label("cnt"))
        .join(Recommendation)
        .where(Recommendation.user_id == user_id)
        .group_by(CropResult.crop_name)
        .order_by(desc("cnt"))
        .limit(1)
    )
    top = crop_result.first()

    avg_result = await db.execute(
        select(func.avg(func.abs(CropResult.estimated_profit)))
        .join(Recommendation)
        .where(Recommendation.user_id == user_id, CropResult.rank == 1)
    )
    avg_profit = avg_result.scalar() or 0

    return {
        "total_recommendations": total,
        "most_recommended_crop": top[0] if top else "N/A",
        "avg_profit_estimate": round(abs(float(avg_profit)), 0),
    }


@router.get("/{rec_id}")
async def get_history_detail(
    rec_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get single recommendation detail."""
    result = await db.execute(
        select(Recommendation).where(
            Recommendation.id == rec_id,
            Recommendation.user_id == user_id,
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    crops = await db.execute(
        select(CropResult).where(CropResult.recommendation_id == rec_id).order_by(CropResult.rank)
    )
    return {
        "id": rec.id,
        "input_params": rec.input_params,
        "season": rec.season,
        "created_at": rec.created_at,
        "crops": [
            {
                "name": c.crop_name, "rank": c.rank,
                "suitability_score": c.suitability_score,
                "predicted_yield": c.predicted_yield,
                "predicted_price": c.predicted_price,
                "estimated_profit": c.estimated_profit,
                "risk_level": c.risk_level,
                "reasoning": c.reasoning,
            }
            for c in crops.scalars().all()
        ],
    }


@router.delete("/{rec_id}")
async def delete_recommendation(
    rec_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a saved recommendation."""
    result = await db.execute(
        select(Recommendation).where(
            Recommendation.id == rec_id,
            Recommendation.user_id == user_id,
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    await db.delete(rec)
    await db.commit()
    return {"message": "Recommendation deleted successfully"}
