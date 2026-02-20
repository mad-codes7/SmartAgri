"""
SmartAgri AI - Database Models
SQLAlchemy ORM models for all tables.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(15), nullable=True)
    state = Column(String(50), nullable=True)
    district = Column(String(50), nullable=True)
    language = Column(String(10), default="en")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    farms = relationship("Farm", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    disease_logs = relationship("DiseaseLog", back_populates="user", cascade="all, delete-orphan")
    alert_subscriptions = relationship("AlertSubscription", back_populates="user", cascade="all, delete-orphan")


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), default="My Farm")
    land_size_acres = Column(Float, nullable=True)
    irrigation_type = Column(String(30), nullable=True)
    soil_type = Column(String(30), nullable=True)
    soil_n = Column(Float, nullable=True)
    soil_p = Column(Float, nullable=True)
    soil_k = Column(Float, nullable=True)
    soil_ph = Column(Float, nullable=True)
    previous_crop = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="farms")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    input_params = Column(JSON, nullable=False)
    weather_snapshot = Column(JSON, nullable=True)
    season = Column(String(20), nullable=True)
    overall_risk_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="recommendations")
    crop_results = relationship("CropResult", back_populates="recommendation", cascade="all, delete-orphan")


class CropResult(Base):
    __tablename__ = "crop_results"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String(50), nullable=False)
    rank = Column(Integer, nullable=False)
    suitability_score = Column(Float, nullable=True)
    predicted_yield = Column(Float, nullable=True)
    predicted_price = Column(Float, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    estimated_profit = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=True)
    reasoning = Column(Text, nullable=True)

    recommendation = relationship("Recommendation", back_populates="crop_results")


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    hindi_name = Column(String(50), nullable=True)
    min_n = Column(Float)
    max_n = Column(Float)
    min_p = Column(Float)
    max_p = Column(Float)
    min_k = Column(Float)
    max_k = Column(Float)
    min_ph = Column(Float)
    max_ph = Column(Float)
    min_temp = Column(Float)
    max_temp = Column(Float)
    min_rainfall = Column(Float)
    max_rainfall = Column(Float)
    min_humidity = Column(Float)
    max_humidity = Column(Float)
    seasons = Column(JSON)
    irrigation_types = Column(JSON)
    soil_types = Column(JSON)
    growth_days = Column(Integer)
    avg_cost_per_hectare = Column(Float)
    pest_info = Column(JSON)
    cultivation_tips = Column(JSON)


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    commodity = Column(String(50), index=True, nullable=False)
    state = Column(String(50), nullable=False)
    district = Column(String(50), nullable=True)
    market_name = Column(String(100), nullable=True)
    date = Column(Date, nullable=False)
    min_price = Column(Float)
    max_price = Column(Float)
    modal_price = Column(Float)


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    eligibility = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    apply_url = Column(String(500), nullable=True)
    applicable_states = Column(String(500), nullable=True)
    applicable_crops = Column(String(500), nullable=True)
    max_land_size = Column(Float, nullable=True)


class DiseaseLog(Base):
    __tablename__ = "disease_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String(500), nullable=True)
    predicted_disease = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    crop = Column(String(50), nullable=True)
    treatment = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="disease_logs")


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String(30), nullable=False)  # price_alert, pest_warning, weather_alert
    crop_name = Column(String(50), nullable=True)
    price_threshold = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="alert_subscriptions")


# ─────────────────────────────────────────────────────────
#  Community
# ─────────────────────────────────────────────────────────

class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String(100), nullable=False)
    district = Column(String(80), nullable=False, index=True)
    state = Column(String(80), nullable=False)
    category = Column(String(40), nullable=False)   # tip | price | pest | question | general
    content = Column(Text, nullable=False)
    photo_url = Column(String(300), nullable=True)
    upvote_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    comments = relationship("CommunityComment", back_populates="post", cascade="all, delete-orphan", lazy="select")
    upvotes = relationship("CommunityUpvote", back_populates="post", cascade="all, delete-orphan", lazy="select")


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("CommunityPost", back_populates="comments")


class CommunityUpvote(Base):
    __tablename__ = "community_upvotes"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("CommunityPost", back_populates="upvotes")

