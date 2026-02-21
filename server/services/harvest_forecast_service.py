"""
SmartAgri AI - Harvest Price Prediction Service
================================================
Predicts crop prices at harvest time using:
  1. 50-crop price profiles with real Indian MSP data
  2. REAL historical price data (2015-2025) from GOI/AGMARKNET
  3. Holt-Winters Exponential Smoothing (double exponential with trend)
  4. State-wise yield and price adjustments
  5. Revenue estimation and sell-timing advice

Data sources:
  - Ministry of Agriculture MSP notifications (CACP)
  - AGMARKNET wholesale price records (2015-2025)
  - ICAR yield data by state
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import math
from services.real_crop_prices import (
    get_monthly_price, get_all_monthly_history, REAL_MSP, REAL_SEASONAL
)

# ──────────────────────────────────────────────────────────────
# CROP PRICE PROFILES — 50 crops with real Indian data
# ──────────────────────────────────────────────────────────────
# base_price: typical modal price (₹/quintal) in 2025
# msp: Minimum Support Price 2025-26 (0 if not MSP-eligible)
# seasonal_curve: 12 monthly multipliers (Jan=0 .. Dec=11)
#   < 1.0 = prices drop (harvest glut), > 1.0 = prices rise (scarcity)
# harvest_months: typical harvest months (1-indexed)
# growth_days: days from sowing to harvest
# yield_per_acre: average yield in quintals per acre
# hold_advice_days: recommended storage days for better price
# storage_loss_pct: % loss per month in storage
# ──────────────────────────────────────────────────────────────

CROP_PROFILES: Dict[str, Dict] = {
    # ── CEREALS ──
    "Wheat": {
        "base_price": 2275, "msp": 2275,
        "seasonal_curve": [1.02, 1.05, 0.92, 0.88, 0.90, 0.95, 1.08, 1.12, 1.10, 1.06, 1.00, 0.98],
        "harvest_months": [3, 4], "growth_days": 120, "yield_per_acre": 18,
        "hold_advice_days": 60, "storage_loss_pct": 0.5,
        "peak_months": [7, 8], "category": "Cereals",
    },
    "Rice": {
        "base_price": 2320, "msp": 2320,
        "seasonal_curve": [1.05, 1.08, 1.10, 1.12, 1.10, 1.05, 0.98, 0.95, 0.92, 0.88, 0.90, 0.95],
        "harvest_months": [10, 11], "growth_days": 135, "yield_per_acre": 22,
        "hold_advice_days": 45, "storage_loss_pct": 0.4,
        "peak_months": [3, 4], "category": "Cereals",
    },
    "Maize": {
        "base_price": 2090, "msp": 2090,
        "seasonal_curve": [1.04, 1.06, 1.08, 1.05, 1.00, 0.95, 0.90, 0.88, 0.92, 0.95, 1.00, 1.02],
        "harvest_months": [9, 10], "growth_days": 100, "yield_per_acre": 12,
        "hold_advice_days": 30, "storage_loss_pct": 0.8,
        "peak_months": [2, 3], "category": "Cereals",
    },
    "Bajra": {
        "base_price": 2500, "msp": 2500,
        "seasonal_curve": [1.06, 1.08, 1.10, 1.08, 1.04, 0.98, 0.94, 0.90, 0.88, 0.92, 0.98, 1.02],
        "harvest_months": [9, 10], "growth_days": 90, "yield_per_acre": 8,
        "hold_advice_days": 30, "storage_loss_pct": 0.6,
        "peak_months": [3, 4], "category": "Cereals",
    },
    "Jowar": {
        "base_price": 3180, "msp": 3180,
        "seasonal_curve": [1.04, 1.06, 1.08, 1.06, 1.02, 0.98, 0.94, 0.90, 0.88, 0.92, 0.96, 1.00],
        "harvest_months": [10, 11], "growth_days": 110, "yield_per_acre": 7,
        "hold_advice_days": 30, "storage_loss_pct": 0.5,
        "peak_months": [4, 5], "category": "Cereals",
    },
    "Ragi": {
        "base_price": 3846, "msp": 3846,
        "seasonal_curve": [1.05, 1.07, 1.08, 1.06, 1.02, 0.98, 0.95, 0.92, 0.88, 0.90, 0.96, 1.00],
        "harvest_months": [10, 11], "growth_days": 120, "yield_per_acre": 6,
        "hold_advice_days": 45, "storage_loss_pct": 0.3,
        "peak_months": [3, 4], "category": "Cereals",
    },
    "Barley": {
        "base_price": 1850, "msp": 1850,
        "seasonal_curve": [1.02, 1.04, 0.92, 0.88, 0.90, 0.95, 1.06, 1.10, 1.08, 1.04, 1.00, 0.98],
        "harvest_months": [3, 4], "growth_days": 130, "yield_per_acre": 14,
        "hold_advice_days": 45, "storage_loss_pct": 0.5,
        "peak_months": [7, 8], "category": "Cereals",
    },

    # ── PULSES ──
    "Chickpea": {
        "base_price": 5440, "msp": 5440,
        "seasonal_curve": [1.02, 1.04, 0.90, 0.86, 0.88, 0.94, 1.04, 1.10, 1.12, 1.08, 1.04, 1.00],
        "harvest_months": [3, 4], "growth_days": 110, "yield_per_acre": 7,
        "hold_advice_days": 60, "storage_loss_pct": 0.3,
        "peak_months": [8, 9], "category": "Pulses",
    },
    "Tur": {
        "base_price": 7000, "msp": 7000,
        "seasonal_curve": [0.92, 0.88, 0.90, 0.94, 1.00, 1.05, 1.10, 1.12, 1.08, 1.04, 0.98, 0.95],
        "harvest_months": [1, 2], "growth_days": 180, "yield_per_acre": 5,
        "hold_advice_days": 60, "storage_loss_pct": 0.3,
        "peak_months": [7, 8], "category": "Pulses",
    },
    "Moong": {
        "base_price": 8558, "msp": 8558,
        "seasonal_curve": [1.04, 1.06, 1.08, 1.10, 1.06, 1.00, 0.94, 0.90, 0.88, 0.92, 0.98, 1.02],
        "harvest_months": [9, 10], "growth_days": 70, "yield_per_acre": 4,
        "hold_advice_days": 30, "storage_loss_pct": 0.3,
        "peak_months": [3, 4], "category": "Pulses",
    },
    "Urad": {
        "base_price": 6950, "msp": 6950,
        "seasonal_curve": [1.04, 1.06, 1.08, 1.06, 1.02, 0.98, 0.94, 0.90, 0.88, 0.92, 0.98, 1.02],
        "harvest_months": [9, 10], "growth_days": 80, "yield_per_acre": 4,
        "hold_advice_days": 30, "storage_loss_pct": 0.3,
        "peak_months": [3, 4], "category": "Pulses",
    },
    "Masoor": {
        "base_price": 6425, "msp": 6425,
        "seasonal_curve": [1.02, 1.04, 0.90, 0.86, 0.90, 0.96, 1.04, 1.08, 1.10, 1.06, 1.02, 0.98],
        "harvest_months": [3, 4], "growth_days": 120, "yield_per_acre": 5,
        "hold_advice_days": 45, "storage_loss_pct": 0.3,
        "peak_months": [8, 9], "category": "Pulses",
    },
    "Rajma": {
        "base_price": 8500, "msp": 0,
        "seasonal_curve": [1.02, 1.00, 0.92, 0.88, 0.90, 0.96, 1.04, 1.08, 1.10, 1.06, 1.02, 1.00],
        "harvest_months": [3, 4], "growth_days": 100, "yield_per_acre": 5,
        "hold_advice_days": 30, "storage_loss_pct": 0.3,
        "peak_months": [8, 9], "category": "Pulses",
    },

    # ── OILSEEDS ──
    "Soybean": {
        "base_price": 4600, "msp": 4600,
        "seasonal_curve": [1.06, 1.08, 1.10, 1.08, 1.04, 0.98, 0.94, 0.90, 0.88, 0.86, 0.94, 1.00],
        "harvest_months": [10, 11], "growth_days": 110, "yield_per_acre": 8,
        "hold_advice_days": 45, "storage_loss_pct": 0.5,
        "peak_months": [3, 4], "category": "Oilseeds",
    },
    "Mustard": {
        "base_price": 5650, "msp": 5650,
        "seasonal_curve": [1.02, 1.04, 0.90, 0.86, 0.88, 0.94, 1.02, 1.08, 1.12, 1.10, 1.06, 1.00],
        "harvest_months": [3, 4], "growth_days": 110, "yield_per_acre": 6,
        "hold_advice_days": 60, "storage_loss_pct": 0.3,
        "peak_months": [8, 9], "category": "Oilseeds",
    },
    "Groundnut": {
        "base_price": 6377, "msp": 6377,
        "seasonal_curve": [1.04, 1.06, 1.08, 1.06, 1.02, 0.98, 0.94, 0.90, 0.88, 0.86, 0.94, 1.00],
        "harvest_months": [10, 11], "growth_days": 120, "yield_per_acre": 7,
        "hold_advice_days": 45, "storage_loss_pct": 0.6,
        "peak_months": [3, 4], "category": "Oilseeds",
    },
    "Sunflower": {
        "base_price": 6760, "msp": 6760,
        "seasonal_curve": [1.04, 1.06, 0.92, 0.88, 0.90, 0.96, 1.04, 1.08, 1.10, 1.06, 1.02, 0.98],
        "harvest_months": [3, 4], "growth_days": 100, "yield_per_acre": 5,
        "hold_advice_days": 30, "storage_loss_pct": 0.5,
        "peak_months": [8, 9], "category": "Oilseeds",
    },
    "Sesame": {
        "base_price": 8635, "msp": 8635,
        "seasonal_curve": [1.04, 1.06, 1.08, 1.10, 1.06, 1.00, 0.96, 0.92, 0.88, 0.90, 0.96, 1.00],
        "harvest_months": [9, 10], "growth_days": 90, "yield_per_acre": 3,
        "hold_advice_days": 30, "storage_loss_pct": 0.3,
        "peak_months": [3, 4], "category": "Oilseeds",
    },
    "Castor": {
        "base_price": 6015, "msp": 0,
        "seasonal_curve": [1.02, 1.00, 0.94, 0.90, 0.88, 0.92, 0.98, 1.04, 1.08, 1.10, 1.06, 1.02],
        "harvest_months": [12, 1], "growth_days": 150, "yield_per_acre": 6,
        "hold_advice_days": 30, "storage_loss_pct": 0.3,
        "peak_months": [9, 10], "category": "Oilseeds",
    },

    # ── CASH CROPS ──
    "Cotton": {
        "base_price": 7121, "msp": 7121,
        "seasonal_curve": [1.04, 1.06, 1.08, 1.06, 1.02, 0.98, 0.94, 0.90, 0.88, 0.86, 0.92, 0.98],
        "harvest_months": [10, 11, 12], "growth_days": 180, "yield_per_acre": 8,
        "hold_advice_days": 45, "storage_loss_pct": 0.2,
        "peak_months": [3, 4], "category": "Cash Crops",
    },
    "Sugarcane": {
        "base_price": 3150, "msp": 3150,
        "seasonal_curve": [0.96, 0.94, 0.92, 0.94, 0.98, 1.02, 1.04, 1.06, 1.08, 1.06, 1.02, 0.98],
        "harvest_months": [11, 12, 1, 2], "growth_days": 365, "yield_per_acre": 350,
        "hold_advice_days": 0, "storage_loss_pct": 2.0,
        "peak_months": [8, 9], "category": "Cash Crops",
    },
    "Jute": {
        "base_price": 5050, "msp": 5050,
        "seasonal_curve": [1.04, 1.06, 1.08, 1.06, 1.02, 0.98, 0.94, 0.88, 0.86, 0.90, 0.96, 1.00],
        "harvest_months": [7, 8], "growth_days": 120, "yield_per_acre": 10,
        "hold_advice_days": 30, "storage_loss_pct": 0.8,
        "peak_months": [1, 2], "category": "Cash Crops",
    },
    "Tobacco": {
        "base_price": 12000, "msp": 0,
        "seasonal_curve": [1.00, 0.94, 0.90, 0.88, 0.92, 0.98, 1.04, 1.08, 1.10, 1.08, 1.04, 1.00],
        "harvest_months": [2, 3], "growth_days": 120, "yield_per_acre": 8,
        "hold_advice_days": 30, "storage_loss_pct": 0.3,
        "peak_months": [8, 9], "category": "Cash Crops",
    },

    # ── VEGETABLES ──
    "Tomato": {
        "base_price": 2500, "msp": 0,
        "seasonal_curve": [0.80, 0.70, 0.75, 0.90, 1.10, 1.30, 1.40, 1.20, 1.00, 0.85, 0.75, 0.80],
        "harvest_months": [1, 2, 3, 6, 7], "growth_days": 90, "yield_per_acre": 80,
        "hold_advice_days": 3, "storage_loss_pct": 15.0,
        "peak_months": [6, 7], "category": "Vegetables",
    },
    "Onion": {
        "base_price": 2000, "msp": 0,
        "seasonal_curve": [0.85, 0.80, 0.75, 0.78, 0.90, 1.05, 1.15, 1.30, 1.40, 1.20, 1.00, 0.90],
        "harvest_months": [3, 4, 11, 12], "growth_days": 130, "yield_per_acre": 60,
        "hold_advice_days": 30, "storage_loss_pct": 5.0,
        "peak_months": [8, 9], "category": "Vegetables",
    },
    "Potato": {
        "base_price": 1200, "msp": 0,
        "seasonal_curve": [0.85, 0.80, 0.78, 0.82, 0.90, 1.00, 1.10, 1.20, 1.25, 1.15, 1.05, 0.90],
        "harvest_months": [1, 2, 3], "growth_days": 90, "yield_per_acre": 80,
        "hold_advice_days": 60, "storage_loss_pct": 3.0,
        "peak_months": [8, 9], "category": "Vegetables",
    },
    "Green Peas": {
        "base_price": 4000, "msp": 0,
        "seasonal_curve": [0.85, 0.80, 0.90, 1.05, 1.20, 1.30, 1.25, 1.15, 1.10, 1.00, 0.88, 0.82],
        "harvest_months": [12, 1, 2], "growth_days": 80, "yield_per_acre": 30,
        "hold_advice_days": 5, "storage_loss_pct": 10.0,
        "peak_months": [6, 7], "category": "Vegetables",
    },
    "Cauliflower": {
        "base_price": 1800, "msp": 0,
        "seasonal_curve": [0.82, 0.78, 0.85, 1.00, 1.15, 1.25, 1.30, 1.20, 1.10, 0.95, 0.85, 0.80],
        "harvest_months": [12, 1, 2], "growth_days": 90, "yield_per_acre": 60,
        "hold_advice_days": 3, "storage_loss_pct": 12.0,
        "peak_months": [6, 7], "category": "Vegetables",
    },
    "Brinjal": {
        "base_price": 1500, "msp": 0,
        "seasonal_curve": [0.90, 0.85, 0.88, 0.95, 1.05, 1.15, 1.20, 1.10, 1.00, 0.92, 0.88, 0.85],
        "harvest_months": [1, 2, 10, 11], "growth_days": 75, "yield_per_acre": 100,
        "hold_advice_days": 2, "storage_loss_pct": 15.0,
        "peak_months": [6, 7], "category": "Vegetables",
    },
    "Cabbage": {
        "base_price": 1200, "msp": 0,
        "seasonal_curve": [0.80, 0.75, 0.82, 0.95, 1.10, 1.25, 1.30, 1.20, 1.10, 0.95, 0.85, 0.78],
        "harvest_months": [12, 1, 2], "growth_days": 90, "yield_per_acre": 80,
        "hold_advice_days": 5, "storage_loss_pct": 10.0,
        "peak_months": [6, 7], "category": "Vegetables",
    },
    "Chilli": {
        "base_price": 8000, "msp": 0,
        "seasonal_curve": [1.00, 0.95, 0.88, 0.85, 0.90, 0.98, 1.05, 1.12, 1.15, 1.10, 1.05, 1.00],
        "harvest_months": [2, 3, 4], "growth_days": 120, "yield_per_acre": 6,
        "hold_advice_days": 30, "storage_loss_pct": 1.0,
        "peak_months": [8, 9], "category": "Vegetables",
    },
    "Garlic": {
        "base_price": 5000, "msp": 0,
        "seasonal_curve": [1.00, 0.95, 0.85, 0.80, 0.82, 0.90, 1.00, 1.12, 1.20, 1.18, 1.10, 1.04],
        "harvest_months": [3, 4], "growth_days": 140, "yield_per_acre": 25,
        "hold_advice_days": 60, "storage_loss_pct": 2.0,
        "peak_months": [8, 9], "category": "Vegetables",
    },
    "Ladyfinger": {
        "base_price": 2000, "msp": 0,
        "seasonal_curve": [1.10, 1.15, 1.05, 0.95, 0.85, 0.80, 0.78, 0.82, 0.90, 1.00, 1.08, 1.12],
        "harvest_months": [3, 4, 7, 8], "growth_days": 55, "yield_per_acre": 40,
        "hold_advice_days": 1, "storage_loss_pct": 20.0,
        "peak_months": [1, 2], "category": "Vegetables",
    },

    # ── FRUITS ──
    "Banana": {
        "base_price": 1500, "msp": 0,
        "seasonal_curve": [0.95, 0.90, 0.88, 0.92, 1.00, 1.08, 1.12, 1.10, 1.05, 0.98, 0.92, 0.90],
        "harvest_months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], "growth_days": 300, "yield_per_acre": 120,
        "hold_advice_days": 3, "storage_loss_pct": 12.0,
        "peak_months": [6, 7], "category": "Fruits",
    },
    "Mango": {
        "base_price": 4000, "msp": 0,
        "seasonal_curve": [1.15, 1.20, 1.10, 0.95, 0.80, 0.75, 0.85, 1.00, 1.10, 1.15, 1.18, 1.15],
        "harvest_months": [4, 5, 6], "growth_days": 150, "yield_per_acre": 40,
        "hold_advice_days": 5, "storage_loss_pct": 15.0,
        "peak_months": [1, 2], "category": "Fruits",
    },
    "Papaya": {
        "base_price": 1200, "msp": 0,
        "seasonal_curve": [0.95, 0.92, 0.90, 0.94, 1.00, 1.08, 1.12, 1.10, 1.05, 0.98, 0.94, 0.92],
        "harvest_months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], "growth_days": 270, "yield_per_acre": 60,
        "hold_advice_days": 3, "storage_loss_pct": 12.0,
        "peak_months": [6, 7], "category": "Fruits",
    },
    "Guava": {
        "base_price": 2500, "msp": 0,
        "seasonal_curve": [0.90, 0.85, 0.88, 0.95, 1.05, 1.12, 1.18, 1.15, 1.10, 1.00, 0.92, 0.88],
        "harvest_months": [8, 9, 12, 1], "growth_days": 120, "yield_per_acre": 50,
        "hold_advice_days": 3, "storage_loss_pct": 12.0,
        "peak_months": [6, 7], "category": "Fruits",
    },
    "Grapes": {
        "base_price": 5000, "msp": 0,
        "seasonal_curve": [0.88, 0.82, 0.80, 0.85, 0.95, 1.08, 1.15, 1.20, 1.18, 1.10, 1.02, 0.92],
        "harvest_months": [2, 3, 4], "growth_days": 150, "yield_per_acre": 40,
        "hold_advice_days": 5, "storage_loss_pct": 10.0,
        "peak_months": [7, 8], "category": "Fruits",
    },
    "Orange": {
        "base_price": 3000, "msp": 0,
        "seasonal_curve": [0.90, 0.85, 0.88, 0.95, 1.05, 1.12, 1.15, 1.12, 1.08, 0.98, 0.92, 0.88],
        "harvest_months": [11, 12, 1, 2], "growth_days": 240, "yield_per_acre": 50,
        "hold_advice_days": 10, "storage_loss_pct": 5.0,
        "peak_months": [6, 7], "category": "Fruits",
    },
    "Watermelon": {
        "base_price": 800, "msp": 0,
        "seasonal_curve": [1.10, 1.05, 0.95, 0.85, 0.78, 0.82, 0.90, 1.00, 1.08, 1.12, 1.15, 1.12],
        "harvest_months": [3, 4, 5], "growth_days": 80, "yield_per_acre": 120,
        "hold_advice_days": 2, "storage_loss_pct": 15.0,
        "peak_months": [11, 12], "category": "Fruits",
    },
    "Pomegranate": {
        "base_price": 6000, "msp": 0,
        "seasonal_curve": [0.92, 0.88, 0.85, 0.90, 0.98, 1.05, 1.12, 1.15, 1.10, 1.04, 0.96, 0.92],
        "harvest_months": [1, 2, 6, 7], "growth_days": 180, "yield_per_acre": 30,
        "hold_advice_days": 10, "storage_loss_pct": 3.0,
        "peak_months": [7, 8], "category": "Fruits",
    },

    # ── SPICES ──
    "Turmeric": {
        "base_price": 8500, "msp": 0,
        "seasonal_curve": [0.98, 0.94, 0.88, 0.85, 0.88, 0.94, 1.02, 1.08, 1.12, 1.14, 1.10, 1.04],
        "harvest_months": [1, 2, 3], "growth_days": 240, "yield_per_acre": 10,
        "hold_advice_days": 60, "storage_loss_pct": 0.5,
        "peak_months": [9, 10], "category": "Spices",
    },
    "Coriander": {
        "base_price": 7500, "msp": 0,
        "seasonal_curve": [1.00, 0.94, 0.88, 0.85, 0.90, 0.98, 1.05, 1.10, 1.14, 1.12, 1.06, 1.02],
        "harvest_months": [3, 4], "growth_days": 100, "yield_per_acre": 5,
        "hold_advice_days": 45, "storage_loss_pct": 0.5,
        "peak_months": [9, 10], "category": "Spices",
    },
    "Cumin": {
        "base_price": 25000, "msp": 0,
        "seasonal_curve": [1.00, 0.95, 0.88, 0.84, 0.88, 0.95, 1.04, 1.10, 1.14, 1.12, 1.06, 1.02],
        "harvest_months": [3, 4], "growth_days": 120, "yield_per_acre": 3,
        "hold_advice_days": 60, "storage_loss_pct": 0.3,
        "peak_months": [9, 10], "category": "Spices",
    },
    "Ginger": {
        "base_price": 4000, "msp": 0,
        "seasonal_curve": [0.95, 0.90, 0.85, 0.88, 0.95, 1.02, 1.08, 1.12, 1.15, 1.10, 1.02, 0.97],
        "harvest_months": [12, 1, 2], "growth_days": 240, "yield_per_acre": 40,
        "hold_advice_days": 30, "storage_loss_pct": 3.0,
        "peak_months": [8, 9], "category": "Spices",
    },
    "Fenugreek": {
        "base_price": 6000, "msp": 0,
        "seasonal_curve": [1.00, 0.95, 0.88, 0.85, 0.90, 0.98, 1.05, 1.10, 1.12, 1.08, 1.04, 1.00],
        "harvest_months": [3, 4], "growth_days": 100, "yield_per_acre": 5,
        "hold_advice_days": 30, "storage_loss_pct": 0.5,
        "peak_months": [8, 9], "category": "Spices",
    },
    "Black Pepper": {
        "base_price": 45000, "msp": 0,
        "seasonal_curve": [0.96, 0.92, 0.88, 0.90, 0.95, 1.00, 1.05, 1.10, 1.12, 1.10, 1.04, 0.98],
        "harvest_months": [12, 1, 2], "growth_days": 270, "yield_per_acre": 2,
        "hold_advice_days": 60, "storage_loss_pct": 0.2,
        "peak_months": [8, 9], "category": "Spices",
    },

    # ── OTHERS ──
    "Coconut": {
        "base_price": 2800, "msp": 0,
        "seasonal_curve": [0.95, 0.92, 0.88, 0.90, 0.95, 1.02, 1.08, 1.12, 1.14, 1.10, 1.02, 0.96],
        "harvest_months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], "growth_days": 365, "yield_per_acre": 50,
        "hold_advice_days": 15, "storage_loss_pct": 1.0,
        "peak_months": [8, 9], "category": "Others",
    },
    "Arecanut": {
        "base_price": 45000, "msp": 0,
        "seasonal_curve": [0.95, 0.92, 0.88, 0.90, 0.96, 1.02, 1.06, 1.10, 1.12, 1.08, 1.02, 0.96],
        "harvest_months": [11, 12, 1], "growth_days": 365, "yield_per_acre": 6,
        "hold_advice_days": 30, "storage_loss_pct": 0.3,
        "peak_months": [8, 9], "category": "Others",
    },
    "Rubber": {
        "base_price": 17000, "msp": 0,
        "seasonal_curve": [0.96, 0.94, 0.92, 0.95, 0.98, 1.02, 1.06, 1.08, 1.10, 1.06, 1.00, 0.96],
        "harvest_months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], "growth_days": 365, "yield_per_acre": 5,
        "hold_advice_days": 30, "storage_loss_pct": 0.2,
        "peak_months": [8, 9], "category": "Others",
    },
}


# ──────────────────────────────────────────────────────────────
# STATE PRICE MULTIPLIERS — price varies by region
# ──────────────────────────────────────────────────────────────
STATE_PRICE_FACTOR = {
    "Punjab": 1.05, "Haryana": 1.04, "Maharashtra": 1.00,
    "Uttar Pradesh": 0.95, "Madhya Pradesh": 0.96, "Rajasthan": 0.97,
    "Karnataka": 1.02, "Tamil Nadu": 1.03, "Gujarat": 1.01,
    "West Bengal": 0.98, "Andhra Pradesh": 0.99, "Telangana": 1.01,
    "Odisha": 0.94, "Bihar": 0.93, "Kerala": 1.06,
    "Chhattisgarh": 0.95, "Jharkhand": 0.94, "Assam": 0.96,
}

# ──────────────────────────────────────────────────────────────
# STATE-WISE YIELD MULTIPLIERS (vs national average = 1.0)
# Source: ICAR/State Agriculture Dept productivity data
# ──────────────────────────────────────────────────────────────
STATE_YIELD_FACTOR = {
    "Punjab":         {"Wheat": 1.30, "Rice": 1.35, "Maize": 1.10, "Cotton": 1.15, "Sugarcane": 1.20, "Bajra": 0.90, "Mustard": 1.10, "_default": 1.10},
    "Haryana":        {"Wheat": 1.25, "Rice": 1.20, "Bajra": 1.10, "Cotton": 1.10, "Sugarcane": 1.15, "Mustard": 1.15, "_default": 1.08},
    "Uttar Pradesh":  {"Wheat": 0.90, "Rice": 0.85, "Sugarcane": 1.30, "Potato": 1.25, "Mustard": 0.95, "_default": 0.90},
    "Madhya Pradesh": {"Wheat": 0.85, "Soybean": 1.20, "Chickpea": 1.15, "Maize": 0.90, "_default": 0.88},
    "Maharashtra":    {"Cotton": 0.80, "Soybean": 1.00, "Sugarcane": 1.10, "Onion": 1.20, "Tur": 1.10, "Pomegranate": 1.15, "Grapes": 1.20, "_default": 0.95},
    "Rajasthan":      {"Bajra": 0.75, "Mustard": 1.20, "Cumin": 1.30, "Chickpea": 0.85, "Barley": 1.10, "_default": 0.80},
    "Karnataka":      {"Rice": 0.90, "Ragi": 1.20, "Maize": 1.05, "Cotton": 0.90, "Sugarcane": 1.15, "Arecanut": 1.10, "_default": 0.95},
    "Tamil Nadu":     {"Rice": 1.10, "Sugarcane": 1.15, "Banana": 1.20, "Coconut": 1.15, "Turmeric": 1.10, "_default": 1.00},
    "Gujarat":        {"Cotton": 1.10, "Groundnut": 1.20, "Castor": 1.25, "Cumin": 1.15, "Bajra": 1.05, "_default": 1.00},
    "West Bengal":    {"Rice": 1.15, "Jute": 1.30, "Potato": 1.20, "_default": 0.95},
    "Andhra Pradesh": {"Rice": 1.10, "Cotton": 0.95, "Chilli": 1.25, "Mango": 1.15, "_default": 0.98},
    "Telangana":      {"Rice": 1.05, "Cotton": 0.90, "Maize": 1.00, "Turmeric": 1.10, "_default": 0.95},
    "Odisha":         {"Rice": 0.80, "_default": 0.82},
    "Bihar":          {"Rice": 0.85, "Wheat": 0.80, "Maize": 1.00, "_default": 0.82},
    "Kerala":         {"Coconut": 1.25, "Rubber": 1.30, "Black Pepper": 1.20, "Banana": 1.10, "_default": 0.90},
    "Chhattisgarh":   {"Rice": 0.85, "_default": 0.80},
    "Jharkhand":      {"Rice": 0.80, "_default": 0.78},
    "Assam":          {"Rice": 0.85, "Jute": 1.10, "_default": 0.80},
}

# ──────────────────────────────────────────────────────────────
# COST OF CULTIVATION (₹/acre) — from CACP cost studies
# Includes seeds, fertilizer, labour, irrigation, pesticides
# ──────────────────────────────────────────────────────────────
CULTIVATION_COST = {
    "Wheat": 12000, "Rice": 15000, "Maize": 10000, "Bajra": 7000, "Jowar": 7500,
    "Ragi": 8000, "Barley": 9000,
    "Chickpea": 10000, "Tur": 12000, "Moong": 9000, "Urad": 9000, "Masoor": 9500, "Rajma": 11000,
    "Soybean": 11000, "Mustard": 10000, "Groundnut": 14000, "Sunflower": 10000, "Sesame": 8500, "Castor": 9000,
    "Cotton": 18000, "Sugarcane": 35000, "Jute": 12000, "Tobacco": 20000,
    "Tomato": 25000, "Onion": 20000, "Potato": 22000, "Green Peas": 15000, "Cauliflower": 18000,
    "Brinjal": 16000, "Cabbage": 15000, "Chilli": 18000, "Garlic": 20000, "Ladyfinger": 14000,
    "Banana": 30000, "Mango": 15000, "Papaya": 20000, "Guava": 12000, "Grapes": 40000,
    "Orange": 15000, "Watermelon": 18000, "Pomegranate": 25000,
    "Turmeric": 22000, "Coriander": 10000, "Cumin": 12000, "Ginger": 35000, "Fenugreek": 9000, "Black Pepper": 15000,
    "Coconut": 8000, "Arecanut": 12000, "Rubber": 10000,
}


def _get_state_yield(crop: str, state: str, base_yield: float) -> float:
    """Get state-adjusted yield per acre."""
    state_data = STATE_YIELD_FACTOR.get(state, {})
    factor = state_data.get(crop, state_data.get("_default", 1.0))
    return round(base_yield * factor, 1)

# ──────────────────────────────────────────────────────────────
# EXPONENTIAL SMOOTHING ENGINE
# ──────────────────────────────────────────────────────────────

def _holt_forecast(prices: List[float], alpha: float = 0.4, beta: float = 0.2, steps: int = 1) -> tuple:
    """
    Holt's Double Exponential Smoothing (trend-aware).
    Returns (forecast, trend, forecast_error_pct).
    """
    if len(prices) < 2:
        return prices[-1] if prices else 0, 0, 15.0

    # Initialize
    level = prices[0]
    trend = prices[1] - prices[0]
    errors = []

    for i, actual in enumerate(prices[1:], 1):
        forecast = level + trend
        error = abs(actual - forecast) / actual * 100 if actual > 0 else 0
        errors.append(error)
        level = alpha * actual + (1 - alpha) * (level + trend)
        trend = beta * (level - (alpha * actual + (1 - alpha) * level - trend * (1 - alpha))) + (1 - beta) * trend
        # Simpler trend update
        trend = beta * (level - (level - trend / beta * beta)) + (1 - beta) * trend

    # Re-do with cleaner formulation
    level = prices[0]
    trend = (prices[-1] - prices[0]) / (len(prices) - 1) if len(prices) > 1 else 0
    errors = []

    for actual in prices[1:]:
        prev_level = level
        level = alpha * actual + (1 - alpha) * (level + trend)
        trend = beta * (level - prev_level) + (1 - beta) * trend
        forecast = prev_level + trend
        if actual > 0:
            errors.append(abs(actual - forecast) / actual * 100)

    # Forecast ahead
    prediction = level + trend * steps
    avg_error = sum(errors) / len(errors) if errors else 10.0

    return prediction, trend, avg_error


def predict_harvest_price(
    crop: str,
    state: str = "Maharashtra",
    sowing_date: str = None,
    land_size: float = 1.0,
) -> Dict:
    """
    Predict the price of a crop at harvest time using REAL historical data
    and Holt's Double Exponential Smoothing.
    """
    profile = CROP_PROFILES.get(crop)
    if not profile:
        for k, v in CROP_PROFILES.items():
            if k.lower() == crop.lower():
                crop = k
                profile = v
                break
    if not profile:
        return {"error": f"Crop '{crop}' not found. Available: {len(CROP_PROFILES)} crops."}

    today = datetime.now()
    if sowing_date:
        try:
            sow = datetime.strptime(sowing_date, "%Y-%m-%d")
        except ValueError:
            sow = today
    else:
        sow = today

    growth_days = profile["growth_days"]
    harvest_date = sow + timedelta(days=growth_days)
    harvest_month = harvest_date.month

    # ── Step 1: Get REAL historical prices for harvest month (2015-2025) ──
    all_hist = get_all_monthly_history(crop)
    harvest_month_prices = [r for r in all_hist if r["month"] == harvest_month]
    yearly_prices = [r["price"] for r in harvest_month_prices]

    # ── Step 2: Holt's Exponential Smoothing on 11 years of data ──
    if len(yearly_prices) >= 3:
        predicted, trend, forecast_error = _holt_forecast(yearly_prices, alpha=0.4, beta=0.2, steps=1)
        # Apply seasonal adjustment from REAL AGMARKNET data
        seasonal = REAL_SEASONAL.get(crop)
        if seasonal:
            annual_avg = sum(yearly_prices[-3:]) / 3  # last 3 years avg
            seasonal_factor = seasonal[harvest_month - 1]
            # Blend: 70% exponential smoothing + 30% seasonal-adjusted latest
            latest_year_price = yearly_prices[-1] if yearly_prices else predicted
            seasonal_prediction = latest_year_price * (1 + trend / latest_year_price) * seasonal_factor
            predicted = 0.7 * predicted + 0.3 * seasonal_prediction
        r_squared = max(0, 1 - (forecast_error / 100)) ** 2
    else:
        seasonal_factor = profile["seasonal_curve"][harvest_month - 1]
        predicted = profile["base_price"] * seasonal_factor
        r_squared = 0.5
        forecast_error = 10.0

    # ── Step 3: Apply state multiplier ──
    state_factor = STATE_PRICE_FACTOR.get(state, 1.0)
    predicted *= state_factor

    # ── Step 4: MSP floor ──
    msp = profile.get("msp", 0)
    if msp > 0:
        predicted = max(predicted, msp * 0.98)

    predicted = round(predicted)

    # ── Step 5: Current price from REAL data ──
    current_month = today.month
    current_price_raw = get_monthly_price(crop, 2025, current_month)
    current_price = round(current_price_raw * state_factor) if current_price_raw else round(profile["base_price"] * state_factor)

    # ── Step 6: Peak (best sell) price from REAL data ──
    peak_months = profile.get("peak_months", [])
    if peak_months:
        peak_prices = [get_monthly_price(crop, 2025, m) for m in peak_months]
        peak_prices = [p for p in peak_prices if p > 0]
        if peak_prices:
            peak_price = round(max(peak_prices) * state_factor)
        else:
            peak_idx = peak_months[0] - 1
            peak_price = round(profile["base_price"] * profile["seasonal_curve"][peak_idx] * state_factor)
    else:
        peak_price = predicted

    # ── Step 7: Price change ──
    price_change = predicted - current_price
    price_change_pct = round((price_change / current_price * 100), 1) if current_price else 0

    # ── Step 8: Revenue (state-adjusted yield + cultivation cost) ──
    base_yield = profile["yield_per_acre"]
    yield_per_acre = _get_state_yield(crop, state, base_yield)
    total_yield = round(yield_per_acre * land_size, 1)
    harvest_revenue = round(total_yield * predicted)
    peak_revenue = round(total_yield * peak_price)
    extra_if_held = peak_revenue - harvest_revenue

    # Cultivation cost
    cost_per_acre = CULTIVATION_COST.get(crop, 12000)
    total_cost = round(cost_per_acre * land_size)
    net_profit = harvest_revenue - total_cost
    peak_net_profit = peak_revenue - total_cost

    # ── Step 9: Best sell window ──
    hold_days = profile.get("hold_advice_days", 0)
    best_sell_date = harvest_date + timedelta(days=hold_days)
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    best_sell_months = [month_names[m - 1] for m in peak_months] if peak_months else []

    # ── Step 10: Confidence (based on data years + forecast error) ──
    data_years = len(yearly_prices) if 'yearly_prices' in dir() else 0
    if r_squared > 0.7 and data_years >= 8:
        confidence = "high"
    elif r_squared > 0.4 and data_years >= 5:
        confidence = "medium"
    else:
        confidence = "low"

    # ── Step 11: Advice ──
    storage_loss = profile.get("storage_loss_pct", 1.0)
    if hold_days <= 3 or storage_loss > 10:
        advice = f"Sell immediately after harvest — {crop} is perishable with {storage_loss}% monthly loss."
        sell_strategy = "sell_now"
    elif extra_if_held > 0 and hold_days <= 90:
        net_gain = extra_if_held - (harvest_revenue * storage_loss / 100 * (hold_days / 30))
        if net_gain > 0:
            advice = f"Store for {hold_days} days after harvest. Prices peak in {', '.join(best_sell_months)}. Expected extra revenue: ₹{round(net_gain):,}."
            sell_strategy = "hold"
        else:
            advice = f"Sell at harvest — storage costs outweigh the ₹{extra_if_held:,} price gain."
            sell_strategy = "sell_at_harvest"
    else:
        advice = f"Sell at harvest. Current trend suggests stable prices."
        sell_strategy = "sell_at_harvest"

    # ── Build monthly price curve from REAL data ──
    monthly_curve = []
    for m in range(12):
        real_price = get_monthly_price(crop, 2025, m + 1)
        avg = real_price if real_price > 0 else profile["base_price"] * profile["seasonal_curve"][m]
        monthly_curve.append({
            "month": month_names[m],
            "price": round(avg * state_factor),
            "is_harvest": (m + 1) in profile.get("harvest_months", []),
            "is_peak": (m + 1) in peak_months,
        })

    return {
        "crop": crop,
        "category": profile.get("category", ""),
        "state": state,
        "sowing_date": sow.strftime("%Y-%m-%d"),
        "harvest_date": harvest_date.strftime("%Y-%m-%d"),
        "growth_days": growth_days,
        "days_to_harvest": max(0, (harvest_date - today).days),

        "current_price": current_price,
        "predicted_harvest_price": predicted,
        "price_change": price_change,
        "price_change_pct": price_change_pct,
        "msp": msp,

        "peak_price": peak_price,
        "best_sell_date": best_sell_date.strftime("%Y-%m-%d"),
        "best_sell_months": best_sell_months,
        "hold_days": hold_days,
        "sell_strategy": sell_strategy,

        "yield_per_acre": yield_per_acre,
        "land_size": land_size,
        "total_yield": total_yield,
        "cultivation_cost": total_cost,
        "harvest_revenue": harvest_revenue,
        "net_profit": net_profit,
        "peak_revenue": peak_revenue,
        "peak_net_profit": peak_net_profit,
        "extra_if_held": max(0, extra_if_held),

        "confidence": confidence,
        "r_squared": round(r_squared, 3),
        "advice": advice,

        "monthly_curve": monthly_curve,
    }


def get_bulk_forecast(
    state: str = "Maharashtra",
    land_size: float = 1.0,
    sowing_date: str = None,
    crops: List[str] = None,
) -> Dict:
    """Forecast for multiple crops at once (regional or specified)."""
    if not crops:
        # Use all crops
        crops = list(CROP_PROFILES.keys())

    results = []
    for crop in crops:
        fc = predict_harvest_price(crop, state, sowing_date, land_size)
        if "error" not in fc:
            results.append(fc)

    # Sort by revenue potential (descending)
    results.sort(key=lambda x: x.get("harvest_revenue", 0), reverse=True)

    return {
        "state": state,
        "land_size": land_size,
        "total_crops": len(results),
        "total_categories": len(set(r["category"] for r in results)),
        "forecasts": results,
        "generated_at": datetime.now().isoformat(),
    }


def get_supported_crops() -> List[Dict]:
    """Return list of all crops with their basic info."""
    return [
        {
            "name": name,
            "category": p["category"],
            "growth_days": p["growth_days"],
            "base_price": p["base_price"],
            "msp": p["msp"],
            "yield_per_acre": p["yield_per_acre"],
        }
        for name, p in sorted(CROP_PROFILES.items())
    ]
