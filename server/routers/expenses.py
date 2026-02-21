"""
SmartAgri AI - Expenses Tracker Router
CRUD for farm expenses, income, and financial summaries.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, extract
from typing import Optional, List
from datetime import date

from database import get_db
from db_models import Expense, Income
from schemas import (
    ExpenseCreate, ExpenseResponse,
    IncomeCreate, IncomeResponse,
    ExpenseSummary, MessageResponse,
)
from utils.security import get_current_user_id

router = APIRouter(prefix="/api/expenses", tags=["Expenses Tracker"])

VALID_CATEGORIES = [
    "Labour", "Crop Plantation", "Fertilizers",
    "Pesticides", "Transportation", "Equipment", "Other",
]


# ─── Expenses CRUD ─────────────────────────────────────────
@router.post("/expense", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def add_expense(
    data: ExpenseCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Add a new farm expense."""
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Choose from: {', '.join(VALID_CATEGORIES)}")

    expense = Expense(
        user_id=user_id,
        amount=data.amount,
        category=data.category,
        crop=data.crop,
        season=data.season,
        date=data.date,
        notes=data.notes,
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.get("/expense", response_model=List[ExpenseResponse])
async def list_expenses(
    crop: Optional[str] = Query(None),
    season: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all expenses with optional filters."""
    q = select(Expense).where(Expense.user_id == user_id)
    if crop:
        q = q.where(Expense.crop == crop)
    if season:
        q = q.where(Expense.season == season)
    if category:
        q = q.where(Expense.category == category)
    if start_date:
        q = q.where(Expense.date >= start_date)
    if end_date:
        q = q.where(Expense.date <= end_date)
    q = q.order_by(Expense.date.desc())

    result = await db.execute(q)
    expenses = result.scalars().all()
    return [ExpenseResponse.model_validate(e) for e in expenses]


@router.delete("/expense/{expense_id}", response_model=MessageResponse)
async def delete_expense(
    expense_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete an expense entry."""
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.user_id == user_id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(expense)
    await db.commit()
    return MessageResponse(message="Expense deleted")


# ─── Income CRUD ────────────────────────────────────────────
@router.post("/income", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
async def add_income(
    data: IncomeCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Record income from crop sale."""
    income = Income(
        user_id=user_id,
        amount=data.amount,
        crop=data.crop,
        season=data.season,
        quantity_kg=data.quantity_kg,
        price_per_kg=data.price_per_kg,
        buyer=data.buyer,
        date=data.date,
        notes=data.notes,
    )
    db.add(income)
    await db.commit()
    await db.refresh(income)
    return IncomeResponse.model_validate(income)


@router.get("/income", response_model=List[IncomeResponse])
async def list_incomes(
    crop: Optional[str] = Query(None),
    season: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all income records with optional filters."""
    q = select(Income).where(Income.user_id == user_id)
    if crop:
        q = q.where(Income.crop == crop)
    if season:
        q = q.where(Income.season == season)
    if start_date:
        q = q.where(Income.date >= start_date)
    if end_date:
        q = q.where(Income.date <= end_date)
    q = q.order_by(Income.date.desc())

    result = await db.execute(q)
    incomes = result.scalars().all()
    return [IncomeResponse.model_validate(i) for i in incomes]


@router.delete("/income/{income_id}", response_model=MessageResponse)
async def delete_income(
    income_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete an income entry."""
    result = await db.execute(
        select(Income).where(Income.id == income_id, Income.user_id == user_id)
    )
    income = result.scalar_one_or_none()
    if not income:
        raise HTTPException(status_code=404, detail="Income record not found")
    await db.delete(income)
    await db.commit()
    return MessageResponse(message="Income record deleted")


# ─── Summary / Analytics ───────────────────────────────────
@router.get("/summary", response_model=ExpenseSummary)
async def get_summary(
    crop: Optional[str] = Query(None),
    season: Optional[str] = Query(None),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Calculate total expenses, income, profit/loss, ROI and breakdowns."""
    # --- Total expenses ---
    eq = select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.user_id == user_id)
    if crop:
        eq = eq.where(Expense.crop == crop)
    if season:
        eq = eq.where(Expense.season == season)
    total_expenses = (await db.execute(eq)).scalar() or 0

    # --- Expense by category ---
    cq = (
        select(Expense.category, func.sum(Expense.amount))
        .where(Expense.user_id == user_id)
        .group_by(Expense.category)
    )
    if crop:
        cq = cq.where(Expense.crop == crop)
    if season:
        cq = cq.where(Expense.season == season)
    cat_rows = (await db.execute(cq)).all()
    expense_by_category = {row[0]: round(row[1], 2) for row in cat_rows}

    # --- Total income ---
    iq = select(func.coalesce(func.sum(Income.amount), 0)).where(Income.user_id == user_id)
    if crop:
        iq = iq.where(Income.crop == crop)
    if season:
        iq = iq.where(Income.season == season)
    total_income = (await db.execute(iq)).scalar() or 0

    net_profit = total_income - total_expenses
    roi_percent = round((net_profit / total_expenses * 100), 2) if total_expenses > 0 else 0.0

    # --- Monthly expenses ---
    meq = (
        select(
            extract("year", Expense.date).label("yr"),
            extract("month", Expense.date).label("mo"),
            func.sum(Expense.amount),
        )
        .where(Expense.user_id == user_id)
        .group_by("yr", "mo")
        .order_by("yr", "mo")
    )
    if crop:
        meq = meq.where(Expense.crop == crop)
    if season:
        meq = meq.where(Expense.season == season)
    me_rows = (await db.execute(meq)).all()
    monthly_expenses = [
        {"year": int(r[0]), "month": int(r[1]), "total": round(r[2], 2)} for r in me_rows
    ]

    # --- Monthly income ---
    miq = (
        select(
            extract("year", Income.date).label("yr"),
            extract("month", Income.date).label("mo"),
            func.sum(Income.amount),
        )
        .where(Income.user_id == user_id)
        .group_by("yr", "mo")
        .order_by("yr", "mo")
    )
    if crop:
        miq = miq.where(Income.crop == crop)
    if season:
        miq = miq.where(Income.season == season)
    mi_rows = (await db.execute(miq)).all()
    monthly_income = [
        {"year": int(r[0]), "month": int(r[1]), "total": round(r[2], 2)} for r in mi_rows
    ]

    return ExpenseSummary(
        total_expenses=round(total_expenses, 2),
        total_income=round(total_income, 2),
        net_profit=round(net_profit, 2),
        roi_percent=roi_percent,
        expense_by_category=expense_by_category,
        monthly_expenses=monthly_expenses,
        monthly_income=monthly_income,
    )


@router.get("/crops-list", response_model=List[str])
async def get_user_crops(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get a distinct list of crops from user's expense and income records."""
    eq = select(Expense.crop).where(Expense.user_id == user_id, Expense.crop.isnot(None)).distinct()
    iq = select(Income.crop).where(Income.user_id == user_id).distinct()

    e_result = (await db.execute(eq)).scalars().all()
    i_result = (await db.execute(iq)).scalars().all()
    crops = sorted(set(e_result) | set(i_result))
    return crops
