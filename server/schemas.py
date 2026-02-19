"""
SmartAgri AI - Pydantic Schemas
Request and response models for all API endpoints.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── Auth Schemas ──────────────────────────────────────────
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    language: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    state: Optional[str]
    district: Optional[str]
    language: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Farm Schemas ──────────────────────────────────────────
class FarmInput(BaseModel):
    name: Optional[str] = "My Farm"
    land_size_acres: Optional[float] = None
    irrigation_type: Optional[str] = None  # Rainfed, Canal, Borewell
    soil_type: Optional[str] = None        # Clayey, Loamy, Sandy, etc
    previous_crop: Optional[str] = None


# ─── Soil Data ─────────────────────────────────────────────
class SoilData(BaseModel):
    N: float = Field(..., ge=0, le=200, description="Nitrogen content (kg/ha)")
    P: float = Field(..., ge=0, le=200, description="Phosphorus content (kg/ha)")
    K: float = Field(..., ge=0, le=300, description="Potassium content (kg/ha)")
    ph: float = Field(..., ge=3.0, le=10.0, description="Soil pH level")
    soil_type: Optional[str] = "Loamy"


# ─── Weather Data ──────────────────────────────────────────
class WeatherData(BaseModel):
    temperature: float = Field(..., ge=0, le=50, description="Average temperature °C")
    humidity: float = Field(..., ge=10, le=100, description="Humidity %")
    rainfall: float = Field(..., ge=0, le=500, description="Average rainfall mm")
    season: str = Field(..., description="Kharif / Rabi / Summer")


# ─── Recommendation Schemas ───────────────────────────────
class RecommendationRequest(BaseModel):
    state: str
    district: str
    land_size_acres: float = Field(..., gt=0)
    irrigation_type: str = "Rainfed"
    previous_crop: Optional[str] = None
    soil: SoilData
    weather: WeatherData


class QuickRecommendRequest(BaseModel):
    """Minimal inputs for quick recommendation."""
    state: str
    season: str
    soil_type: str = "Loamy"
    irrigation_type: str = "Rainfed"
    N: float = 50
    P: float = 50
    K: float = 50
    ph: float = 6.5
    temperature: float = 25
    humidity: float = 70
    rainfall: float = 150


class CropCompareRequest(BaseModel):
    crops: List[str] = Field(..., min_length=2, max_length=5)
    state: str
    season: str


class WhatIfRequest(BaseModel):
    crop: str
    state: str
    season: str
    land_size_acres: float = 1.0
    N: float = 50
    P: float = 50
    K: float = 50
    ph: float = 6.5
    temperature: float = 25
    humidity: float = 70
    rainfall: float = 150
    irrigation_type: str = "Rainfed"


class CropRecommendation(BaseModel):
    name: str
    suitability_score: float
    expected_yield: str
    predicted_price: str
    estimated_cost: str
    estimated_profit: str
    risk_level: str
    why_this_crop: str


class MarketInsight(BaseModel):
    current_trend: str
    demand_outlook: str
    best_selling_window: str
    volatility_level: str
    price_range: str


class RiskAssessment(BaseModel):
    climate_risk: str
    water_risk: str
    market_risk: str
    pest_risk: str
    overall_score: float
    overall_level: str


class ProductivityTip(BaseModel):
    title: str
    description: str
    category: str  # rotation, water, sowing, nutrient, intercropping, soil


class RecommendationResponse(BaseModel):
    id: Optional[int] = None
    crops: List[CropRecommendation]
    market_insight: MarketInsight
    risk_assessment: RiskAssessment
    productivity_tips: List[ProductivityTip]
    season: str
    state: str
    created_at: Optional[datetime] = None


# ─── Market Schemas ────────────────────────────────────────
class PriceDataPoint(BaseModel):
    date: str
    min_price: float
    max_price: float
    modal_price: float


class PriceTrendResponse(BaseModel):
    crop: str
    state: str
    current_price: float
    price_change_pct: float
    trend_direction: str  # up, down, stable
    data_points: List[PriceDataPoint]


class VolatilityResponse(BaseModel):
    crop: str
    volatility_index: float
    risk_level: str
    avg_price: float
    std_dev: float


class TopMoverResponse(BaseModel):
    crop: str
    state: str
    current_price: float
    change_pct: float


class PriceForecastResponse(BaseModel):
    crop: str
    current_price: float
    forecast_30d: float
    forecast_direction: str
    confidence: float


# ─── Weather Schemas ───────────────────────────────────────
class WeatherCurrentResponse(BaseModel):
    temperature: float
    humidity: float
    description: str
    wind_speed: float
    rainfall: float
    icon: str


class WeatherForecastDay(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    humidity: float
    rainfall: float
    description: str


class WeatherForecastResponse(BaseModel):
    location: str
    forecast: List[WeatherForecastDay]


class WeatherImpactResponse(BaseModel):
    impact_level: str
    summary: str
    affected_crops: List[str]
    recommendations: List[str]


# ─── Crop Library Schemas ──────────────────────────────────
class CropSummary(BaseModel):
    id: int
    name: str
    hindi_name: Optional[str]
    seasons: list
    growth_days: int
    soil_types: list

    class Config:
        from_attributes = True


class CropDetail(BaseModel):
    id: int
    name: str
    hindi_name: Optional[str]
    min_n: float
    max_n: float
    min_p: float
    max_p: float
    min_k: float
    max_k: float
    min_ph: float
    max_ph: float
    min_temp: float
    max_temp: float
    min_rainfall: float
    max_rainfall: float
    min_humidity: float
    max_humidity: float
    seasons: list
    irrigation_types: list
    soil_types: list
    growth_days: int
    avg_cost_per_hectare: float
    pest_info: list
    cultivation_tips: list

    class Config:
        from_attributes = True


class CropCalendarResponse(BaseModel):
    crop: str
    sowing_months: List[str]
    growing_period_days: int
    harvest_months: List[str]
    key_activities: List[dict]


# ─── Scheme Schemas ────────────────────────────────────────
class SchemeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    eligibility: Optional[str]
    benefits: Optional[str]
    apply_url: Optional[str]
    applicable_states: Optional[str]
    applicable_crops: Optional[str]
    max_land_size: Optional[float]

    class Config:
        from_attributes = True


# ─── Disease Schemas ───────────────────────────────────────
class DiagnosisResponse(BaseModel):
    disease: str
    confidence: float
    crop: str
    description: str
    symptoms: List[str]
    treatment: List[str]
    prevention: List[str]


class DiseaseInfo(BaseModel):
    name: str
    description: str
    symptoms: List[str]
    treatment: List[str]
    prevention: List[str]
    affected_crops: List[str]


# ─── Alert Schemas ─────────────────────────────────────────
class AlertResponse(BaseModel):
    id: int
    alert_type: str
    crop_name: Optional[str]
    message: str
    severity: str
    created_at: Optional[datetime]


class AlertSubscribeRequest(BaseModel):
    alert_type: str  # price_alert, pest_warning, weather_alert
    crop_name: str
    price_threshold: Optional[float] = None


# ─── History Schemas ───────────────────────────────────────
class HistoryItem(BaseModel):
    id: int
    season: Optional[str]
    top_crop: str
    profit_estimate: str
    risk_level: str
    created_at: Optional[datetime]


class HistoryStatsResponse(BaseModel):
    total_recommendations: int
    most_recommended_crop: str
    avg_profit_estimate: float
    recommendations_by_season: dict


# ─── Common Schemas ────────────────────────────────────────
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    total_pages: int


class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
    version: str
    db_connected: bool
    models_loaded: bool
