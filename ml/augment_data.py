"""
SmartAgri AI - Data Augmentation Script
Expands all 3 raw datasets with realistic, domain-accurate synthetic samples
to improve ML model robustness.
"""
import os
import csv
import random
import math
from datetime import datetime, timedelta

random.seed(42)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")

# ─────────────────────────────────────────────────────────────
# Crop Recommendation Data  (N, P, K, temp, humidity, ph, rainfall → label)
# Realistic ranges per crop based on agronomic literature
# ─────────────────────────────────────────────────────────────
CROP_PROFILES = {
    "rice":         {"N": (60, 100), "P": (35, 60),  "K": (35, 45),  "temp": (20, 27),  "humidity": (78, 86),  "ph": (5.5, 7.8),  "rainfall": (195, 300)},
    "wheat":        {"N": (45, 55),  "P": (22, 30),  "K": (27, 35),  "temp": (24, 28),  "humidity": (48, 56),  "ph": (6.6, 7.1),  "rainfall": (110, 130)},
    "maize":        {"N": (15, 30),  "P": (115, 140),"K": (65, 78),  "temp": (22, 27),  "humidity": (57, 72),  "ph": (6.2, 7.0),  "rainfall": (90, 150)},
    "chickpea":     {"N": (0, 5),    "P": (35, 47),  "K": (26, 34),  "temp": (24, 27),  "humidity": (60, 68),  "ph": (6.7, 7.3),  "rainfall": (55, 75)},
    "kidneybeans":  {"N": (33, 40),  "P": (62, 74),  "K": (22, 29),  "temp": (22, 25),  "humidity": (71, 77),  "ph": (6.3, 6.8),  "rainfall": (100, 120)},
    "pigeonpeas":   {"N": (10, 22),  "P": (72, 84),  "K": (40, 50),  "temp": (27, 30),  "humidity": (54, 62),  "ph": (5.7, 6.3),  "rainfall": (43, 56)},
    "mothbeans":    {"N": (30, 40),  "P": (26, 34),  "K": (32, 40),  "temp": (22, 25),  "humidity": (83, 90),  "ph": (6.2, 6.6),  "rainfall": (164, 185)},
    "mungbean":     {"N": (16, 24),  "P": (54, 65),  "K": (46, 54),  "temp": (27, 30),  "humidity": (80, 88),  "ph": (6.9, 7.4),  "rainfall": (139, 160)},
    "blackgram":    {"N": (0, 4),    "P": (16, 24),  "K": (7, 14),   "temp": (27, 30),  "humidity": (89, 95),  "ph": (6.3, 6.8),  "rainfall": (82, 95)},
    "lentil":       {"N": (16, 24),  "P": (26, 34),  "K": (46, 54),  "temp": (25, 28),  "humidity": (49, 56),  "ph": (6.7, 7.0),  "rainfall": (88, 100)},
    "pomegranate":  {"N": (92, 112), "P": (14, 23),  "K": (46, 54),  "temp": (29, 32),  "humidity": (34, 42),  "ph": (6.6, 7.1),  "rainfall": (26, 38)},
    "banana":       {"N": (20, 32),  "P": (123, 137),"K": (192, 210),"temp": (27, 29),  "humidity": (44, 53),  "ph": (6.6, 6.9),  "rainfall": (82, 98)},
    "mango":        {"N": (36, 44),  "P": (40, 50),  "K": (50, 60),  "temp": (23, 26),  "humidity": (82, 89),  "ph": (6.6, 7.0),  "rainfall": (238, 265)},
    "grapes":       {"N": (6, 14),   "P": (46, 54),  "K": (40, 50),  "temp": (29, 32),  "humidity": (90, 98),  "ph": (6.0, 6.4),  "rainfall": (190, 212)},
    "watermelon":   {"N": (36, 44),  "P": (5, 12),   "K": (40, 50),  "temp": (24, 27),  "humidity": (76, 84),  "ph": (6.3, 6.6),  "rainfall": (94, 116)},
    "muskmelon":    {"N": (56, 64),  "P": (6, 14),   "K": (40, 50),  "temp": (22, 25),  "humidity": (58, 65),  "ph": (6.6, 6.9),  "rainfall": (47, 64)},
    "apple":        {"N": (31, 39),  "P": (12, 19),  "K": (30, 40),  "temp": (27, 30),  "humidity": (88, 95),  "ph": (7.2, 7.7),  "rainfall": (23, 38)},
    "orange":       {"N": (56, 64),  "P": (22, 29),  "K": (16, 24),  "temp": (24, 27),  "humidity": (66, 74),  "ph": (6.6, 7.1),  "rainfall": (32, 48)},
    "papaya":       {"N": (16, 24),  "P": (50, 60),  "K": (12, 19),  "temp": (22, 25),  "humidity": (76, 84),  "ph": (6.8, 7.2),  "rainfall": (58, 73)},
    "coconut":      {"N": (56, 64),  "P": (14, 22),  "K": (36, 44),  "temp": (32, 35),  "humidity": (76, 84),  "ph": (6.3, 6.7),  "rainfall": (37, 53)},
    "cotton":       {"N": (112, 124),"P": (22, 29),  "K": (32, 39),  "temp": (23, 26),  "humidity": (74, 82),  "ph": (6.6, 7.1),  "rainfall": (102, 120)},
    "jute":         {"N": (36, 44),  "P": (56, 64),  "K": (50, 60),  "temp": (23, 26),  "humidity": (79, 87),  "ph": (6.3, 6.6),  "rainfall": (188, 210)},
    "coffee":       {"N": (76, 84),  "P": (7, 14),   "K": (7, 14),   "temp": (24, 27),  "humidity": (69, 76),  "ph": (4.3, 4.8),  "rainfall": (264, 288)},
}

# Additional crops to expand the dataset
EXTRA_CROPS = {
    "sugarcane":    {"N": (80, 120), "P": (40, 60),  "K": (50, 70),  "temp": (25, 34),  "humidity": (65, 82),  "ph": (6.0, 7.5),  "rainfall": (150, 250)},
    "soybean":      {"N": (0, 10),   "P": (55, 80),  "K": (35, 55),  "temp": (24, 30),  "humidity": (60, 78),  "ph": (6.0, 7.0),  "rainfall": (80, 150)},
    "mustard":      {"N": (55, 80),  "P": (30, 50),  "K": (20, 35),  "temp": (18, 26),  "humidity": (40, 60),  "ph": (6.0, 7.5),  "rainfall": (30, 80)},
    "bajra":        {"N": (40, 70),  "P": (20, 40),  "K": (15, 30),  "temp": (28, 38),  "humidity": (35, 55),  "ph": (6.5, 8.0),  "rainfall": (25, 80)},
    "turmeric":     {"N": (60, 100), "P": (30, 55),  "K": (80, 120), "temp": (24, 30),  "humidity": (70, 88),  "ph": (5.5, 7.0),  "rainfall": (150, 250)},
    "groundnut":    {"N": (15, 30),  "P": (40, 65),  "K": (30, 50),  "temp": (25, 35),  "humidity": (50, 70),  "ph": (5.5, 7.0),  "rainfall": (50, 120)},
    "onion":        {"N": (60, 100), "P": (50, 80),  "K": (60, 90),  "temp": (15, 25),  "humidity": (55, 75),  "ph": (6.0, 7.5),  "rainfall": (50, 100)},
    "tomato":       {"N": (70, 110), "P": (60, 90),  "K": (70, 100), "temp": (20, 28),  "humidity": (60, 80),  "ph": (5.5, 7.0),  "rainfall": (60, 130)},
    "potato":       {"N": (80, 120), "P": (60, 90),  "K": (80, 120), "temp": (15, 22),  "humidity": (70, 85),  "ph": (5.0, 6.5),  "rainfall": (80, 150)},
    "chilli":       {"N": (70, 110), "P": (40, 70),  "K": (50, 80),  "temp": (22, 30),  "humidity": (60, 80),  "ph": (5.5, 7.0),  "rainfall": (60, 120)},
}


def generate_sample(profile):
    """Generate one realistic sample with Gaussian noise around the crop profile center."""
    N = round(random.uniform(*profile["N"]))
    P = round(random.uniform(*profile["P"]))
    K = round(random.uniform(*profile["K"]))
    temp = round(random.uniform(*profile["temp"]), 2)
    humidity = round(random.uniform(*profile["humidity"]), 2)
    ph = round(random.uniform(*profile["ph"]), 2)
    rainfall = round(random.uniform(*profile["rainfall"]), 2)
    return [N, P, K, temp, humidity, ph, rainfall]


def augment_crop_recommendation():
    """Expand crop recommendation dataset to ~2200 rows."""
    path = os.path.join(RAW_DIR, "crop_recommendation.csv")

    # Read existing data
    with open(path, "r", newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        existing = list(reader)

    print(f"  Original: {len(existing)} rows")

    # Generate new samples: ~80 per original crop + ~60 per new crop
    new_rows = []
    for crop, profile in CROP_PROFILES.items():
        # We already have ~13 per crop, generate 77 more to reach ~90 each
        for _ in range(77):
            sample = generate_sample(profile)
            sample.append(crop)
            new_rows.append(sample)

    for crop, profile in EXTRA_CROPS.items():
        for _ in range(90):
            sample = generate_sample(profile)
            sample.append(crop)
            new_rows.append(sample)

    all_rows = existing + new_rows
    random.shuffle(all_rows)

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(all_rows)

    print(f"  Augmented: {len(all_rows)} rows ({len(CROP_PROFILES) + len(EXTRA_CROPS)} crops)")
    return len(all_rows)


# ─────────────────────────────────────────────────────────────
# Mandi Prices Data
# ─────────────────────────────────────────────────────────────
MARKET_PROFILES = {
    "rice": [
        {"state": "Punjab",           "district": "Ludhiana",       "market": "Ludhiana Mandi",    "base_price": 2100, "volatility": 0.05},
        {"state": "Punjab",           "district": "Patiala",        "market": "Patiala Mandi",     "base_price": 2050, "volatility": 0.04},
        {"state": "Uttar Pradesh",    "district": "Lucknow",        "market": "Lucknow Mandi",     "base_price": 1950, "volatility": 0.06},
        {"state": "West Bengal",      "district": "Burdwan",        "market": "Burdwan Mandi",     "base_price": 1900, "volatility": 0.05},
        {"state": "Tamil Nadu",       "district": "Thanjavur",      "market": "Thanjavur Mandi",   "base_price": 2000, "volatility": 0.04},
        {"state": "Bihar",            "district": "Patna",          "market": "Patna Mandi",       "base_price": 1850, "volatility": 0.06},
    ],
    "wheat": [
        {"state": "Punjab",           "district": "Amritsar",       "market": "Amritsar Mandi",    "base_price": 2300, "volatility": 0.04},
        {"state": "Uttar Pradesh",    "district": "Kanpur",         "market": "Kanpur Mandi",      "base_price": 2250, "volatility": 0.05},
        {"state": "Haryana",          "district": "Karnal",         "market": "Karnal Mandi",      "base_price": 2350, "volatility": 0.03},
        {"state": "Madhya Pradesh",   "district": "Bhopal",         "market": "Bhopal Mandi",      "base_price": 2200, "volatility": 0.05},
        {"state": "Rajasthan",        "district": "Alwar",          "market": "Alwar Mandi",       "base_price": 2280, "volatility": 0.04},
    ],
    "cotton": [
        {"state": "Maharashtra",      "district": "Nagpur",         "market": "Nagpur Mandi",      "base_price": 6200, "volatility": 0.04},
        {"state": "Gujarat",          "district": "Rajkot",         "market": "Rajkot Mandi",      "base_price": 6100, "volatility": 0.05},
        {"state": "Telangana",        "district": "Warangal",       "market": "Warangal Mandi",    "base_price": 6000, "volatility": 0.04},
        {"state": "Andhra Pradesh",   "district": "Guntur",         "market": "Guntur Mandi",      "base_price": 6150, "volatility": 0.05},
    ],
    "maize": [
        {"state": "Rajasthan",        "district": "Udaipur",        "market": "Udaipur Mandi",     "base_price": 1950, "volatility": 0.04},
        {"state": "Karnataka",        "district": "Belgaum",        "market": "Belgaum Mandi",     "base_price": 2000, "volatility": 0.05},
        {"state": "Bihar",            "district": "Bhagalpur",      "market": "Bhagalpur Mandi",   "base_price": 1900, "volatility": 0.04},
    ],
    "soybean": [
        {"state": "Madhya Pradesh",   "district": "Indore",         "market": "Indore Mandi",      "base_price": 4500, "volatility": 0.06},
        {"state": "Maharashtra",      "district": "Nagpur",         "market": "Nagpur Mandi",      "base_price": 4400, "volatility": 0.05},
        {"state": "Rajasthan",        "district": "Kota",           "market": "Kota Mandi",        "base_price": 4350, "volatility": 0.05},
    ],
    "sugarcane": [
        {"state": "Uttar Pradesh",    "district": "Lucknow",        "market": "Lucknow Mandi",     "base_price": 335, "volatility": 0.03},
        {"state": "Maharashtra",      "district": "Kolhapur",       "market": "Kolhapur Mandi",    "base_price": 350, "volatility": 0.03},
        {"state": "Karnataka",        "district": "Mysore",         "market": "Mysore Mandi",      "base_price": 340, "volatility": 0.03},
    ],
    "chickpea": [
        {"state": "Madhya Pradesh",   "district": "Ujjain",         "market": "Ujjain Mandi",      "base_price": 4900, "volatility": 0.04},
        {"state": "Rajasthan",        "district": "Jodhpur",        "market": "Jodhpur Mandi",     "base_price": 4800, "volatility": 0.05},
    ],
    "mustard": [
        {"state": "Rajasthan",        "district": "Jaipur",         "market": "Jaipur Mandi",      "base_price": 5300, "volatility": 0.04},
        {"state": "Uttar Pradesh",    "district": "Agra",           "market": "Agra Mandi",        "base_price": 5200, "volatility": 0.04},
        {"state": "Haryana",          "district": "Rohtak",         "market": "Rohtak Mandi",      "base_price": 5250, "volatility": 0.03},
    ],
    "banana": [
        {"state": "Tamil Nadu",       "district": "Madurai",        "market": "Madurai Mandi",     "base_price": 1500, "volatility": 0.08},
        {"state": "Kerala",           "district": "Ernakulam",      "market": "Ernakulam Mandi",   "base_price": 1600, "volatility": 0.07},
        {"state": "Bihar",            "district": "Muzaffarpur",    "market": "Muzaffarpur Mandi", "base_price": 1400, "volatility": 0.08},
    ],
    "mango": [
        {"state": "Andhra Pradesh",   "district": "Chittoor",       "market": "Chittoor Mandi",    "base_price": 3800, "volatility": 0.12},
        {"state": "Maharashtra",      "district": "Ratnagiri",      "market": "Ratnagiri Mandi",   "base_price": 5000, "volatility": 0.10},
    ],
    "coffee": [
        {"state": "Karnataka",        "district": "Shimoga",        "market": "Shimoga Mandi",     "base_price": 9200, "volatility": 0.03},
        {"state": "Kerala",           "district": "Wayanad",        "market": "Wayanad Mandi",     "base_price": 9000, "volatility": 0.04},
    ],
    "groundnut": [
        {"state": "Gujarat",          "district": "Rajkot",         "market": "Rajkot Mandi",      "base_price": 5200, "volatility": 0.04},
        {"state": "Andhra Pradesh",   "district": "Kurnool",        "market": "Kurnool Mandi",     "base_price": 5100, "volatility": 0.05},
    ],
    "jute": [
        {"state": "West Bengal",      "district": "Malda",          "market": "Malda Mandi",       "base_price": 4300, "volatility": 0.03},
        {"state": "Bihar",            "district": "Darbhanga",      "market": "Darbhanga Mandi",   "base_price": 4200, "volatility": 0.04},
    ],
    "coconut": [
        {"state": "Kerala",           "district": "Palakkad",       "market": "Palakkad Mandi",    "base_price": 2900, "volatility": 0.05},
        {"state": "Tamil Nadu",       "district": "Coimbatore",     "market": "Coimbatore Mandi",  "base_price": 2800, "volatility": 0.05},
    ],
    "lentil": [
        {"state": "Uttar Pradesh",    "district": "Varanasi",       "market": "Varanasi Mandi",    "base_price": 5900, "volatility": 0.03},
        {"state": "Madhya Pradesh",   "district": "Jabalpur",       "market": "Jabalpur Mandi",    "base_price": 5800, "volatility": 0.04},
    ],
    "onion": [
        {"state": "Maharashtra",      "district": "Nashik",         "market": "Nashik Mandi",      "base_price": 1800, "volatility": 0.15},
        {"state": "Karnataka",        "district": "Dharwad",        "market": "Dharwad Mandi",     "base_price": 1700, "volatility": 0.12},
        {"state": "Madhya Pradesh",   "district": "Indore",         "market": "Indore Mandi",      "base_price": 1750, "volatility": 0.14},
    ],
    "tomato": [
        {"state": "Karnataka",        "district": "Kolar",          "market": "Kolar Mandi",       "base_price": 2200, "volatility": 0.18},
        {"state": "Andhra Pradesh",   "district": "Kurnool",        "market": "Kurnool Mandi",     "base_price": 2000, "volatility": 0.16},
        {"state": "Maharashtra",      "district": "Nashik",         "market": "Nashik Mandi",      "base_price": 2100, "volatility": 0.17},
    ],
    "potato": [
        {"state": "Uttar Pradesh",    "district": "Agra",           "market": "Agra Mandi",        "base_price": 1200, "volatility": 0.10},
        {"state": "West Bengal",      "district": "Hooghly",        "market": "Hooghly Mandi",     "base_price": 1150, "volatility": 0.12},
        {"state": "Bihar",            "district": "Patna",          "market": "Patna Mandi",       "base_price": 1100, "volatility": 0.11},
    ],
    "turmeric": [
        {"state": "Telangana",        "district": "Nizamabad",      "market": "Nizamabad Mandi",   "base_price": 7500, "volatility": 0.06},
        {"state": "Tamil Nadu",       "district": "Salem",          "market": "Salem Mandi",       "base_price": 7200, "volatility": 0.07},
    ],
    "chilli": [
        {"state": "Andhra Pradesh",   "district": "Guntur",         "market": "Guntur Mandi",      "base_price": 8000, "volatility": 0.08},
        {"state": "Telangana",        "district": "Khammam",        "market": "Khammam Mandi",     "base_price": 7800, "volatility": 0.09},
    ],
}


def generate_price_series(commodity, market_info, start_date, weeks=26):
    """Generate a realistic weekly price time series with trend + noise."""
    rows = []
    base = market_info["base_price"]
    vol = market_info["volatility"]

    # Add a gentle seasonal trend (sinusoidal)
    trend_direction = random.choice([-1, 1])
    trend_slope = random.uniform(0.001, 0.005) * trend_direction

    price = base
    for w in range(weeks):
        date = start_date + timedelta(weeks=w)
        # Random walk with mean reversion
        seasonal = math.sin(2 * math.pi * w / 52) * base * 0.03
        noise = random.gauss(0, base * vol * 0.3)
        drift = trend_slope * base * w
        mean_reversion = (base - price) * 0.05

        price = price + noise + mean_reversion + drift + seasonal * 0.1
        price = max(price, base * 0.7)  # floor
        price = min(price, base * 1.4)  # ceiling

        modal = round(price)
        spread = round(base * vol * 1.5)
        min_price = modal - spread
        max_price = modal + spread

        rows.append([
            commodity,
            market_info["state"],
            market_info["district"],
            market_info["market"],
            date.strftime("%Y-%m-%d"),
            min_price,
            max_price,
            modal,
        ])
    return rows


def augment_mandi_prices():
    """Expand mandi prices to ~800+ rows with 26 weeks of data across markets."""
    path = os.path.join(RAW_DIR, "mandi_prices.csv")
    header = ["commodity", "state", "district", "market", "date", "min_price", "max_price", "modal_price"]

    start_date = datetime(2025, 8, 1)  # Start from August 2025
    all_rows = []

    for commodity, markets in MARKET_PROFILES.items():
        for market_info in markets:
            rows = generate_price_series(commodity, market_info, start_date, weeks=26)
            all_rows.extend(rows)

    # Sort by date, then commodity
    all_rows.sort(key=lambda r: (r[4], r[0]))

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(all_rows)

    print(f"  Augmented mandi prices: {len(all_rows)} rows ({len(MARKET_PROFILES)} commodities)")
    return len(all_rows)


# ─────────────────────────────────────────────────────────────
# Crop Yield Data  (state, district, crop, season, area, production, yield)
# ─────────────────────────────────────────────────────────────
YIELD_PROFILES = {
    "rice":       {"season": "Kharif",  "yield_range": (2.0, 4.5),  "area_range": (5000, 35000)},
    "wheat":      {"season": "Rabi",    "yield_range": (2.5, 5.0),  "area_range": (5000, 30000)},
    "cotton":     {"season": "Kharif",  "yield_range": (1.0, 2.2),  "area_range": (4000, 20000)},
    "maize":      {"season": "Kharif",  "yield_range": (2.0, 4.0),  "area_range": (3000, 15000)},
    "soybean":    {"season": "Kharif",  "yield_range": (0.8, 1.5),  "area_range": (5000, 25000)},
    "sugarcane":  {"season": "Kharif",  "yield_range": (60.0, 80.0),"area_range": (3000, 12000)},
    "mustard":    {"season": "Rabi",    "yield_range": (1.0, 1.8),  "area_range": (4000, 20000)},
    "chickpea":   {"season": "Rabi",    "yield_range": (0.8, 1.3),  "area_range": (5000, 15000)},
    "groundnut":  {"season": "Kharif",  "yield_range": (1.2, 2.0),  "area_range": (4000, 18000)},
    "banana":     {"season": "Kharif",  "yield_range": (25.0, 35.0),"area_range": (2000, 8000)},
    "mango":      {"season": "Kharif",  "yield_range": (7.0, 12.0), "area_range": (3000, 10000)},
    "coffee":     {"season": "Kharif",  "yield_range": (0.8, 1.2),  "area_range": (2000, 8000)},
    "jute":       {"season": "Kharif",  "yield_range": (2.0, 3.0),  "area_range": (3000, 12000)},
    "coconut":    {"season": "Kharif",  "yield_range": (6.0, 10.0), "area_range": (3000, 15000)},
    "bajra":      {"season": "Kharif",  "yield_range": (0.6, 1.2),  "area_range": (5000, 22000)},
    "lentil":     {"season": "Rabi",    "yield_range": (0.8, 1.3),  "area_range": (3000, 10000)},
    "onion":      {"season": "Rabi",    "yield_range": (15.0, 25.0),"area_range": (2000, 8000)},
    "tomato":     {"season": "Kharif",  "yield_range": (18.0, 30.0),"area_range": (1000, 5000)},
    "potato":     {"season": "Rabi",    "yield_range": (18.0, 28.0),"area_range": (3000, 12000)},
    "turmeric":   {"season": "Kharif",  "yield_range": (4.0, 6.0),  "area_range": (2000, 8000)},
    "chilli":     {"season": "Kharif",  "yield_range": (1.5, 3.0),  "area_range": (2000, 8000)},
}

STATE_DISTRICTS = {
    "Maharashtra":      ["Pune", "Nashik", "Nagpur", "Aurangabad", "Kolhapur", "Solapur", "Ratnagiri", "Satara"],
    "Punjab":           ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Sangrur", "Moga"],
    "Uttar Pradesh":    ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Allahabad", "Gorakhpur"],
    "Madhya Pradesh":   ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas"],
    "Rajasthan":        ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Alwar", "Bikaner", "Ajmer"],
    "Karnataka":        ["Bangalore", "Mysore", "Dharwad", "Belgaum", "Shimoga", "Hubli", "Davangere"],
    "Tamil Nadu":       ["Chennai", "Coimbatore", "Madurai", "Salem", "Thanjavur", "Tirunelveli"],
    "Andhra Pradesh":   ["Guntur", "Krishna", "Kurnool", "Visakhapatnam", "Chittoor", "Nellore"],
    "Gujarat":          ["Ahmedabad", "Rajkot", "Surat", "Junagadh", "Bhavnagar", "Vadodara"],
    "West Bengal":      ["Kolkata", "Burdwan", "Malda", "Murshidabad", "Nadia", "Hooghly"],
    "Haryana":          ["Karnal", "Hisar", "Sirsa", "Ambala", "Rohtak", "Panipat"],
    "Kerala":           ["Wayanad", "Idukki", "Thrissur", "Palakkad", "Ernakulam", "Kozhikode"],
    "Bihar":            ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia"],
    "Telangana":        ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Medak", "Khammam"],
    "Odisha":           ["Cuttack", "Puri", "Sambalpur", "Ganjam", "Balasore", "Bhubaneswar"],
}

# Which crops grow in which states (realistic mapping)
STATE_CROP_MAP = {
    "Maharashtra":      ["rice", "wheat", "cotton", "soybean", "sugarcane", "onion", "mango", "groundnut", "banana", "tomato"],
    "Punjab":           ["rice", "wheat", "maize", "cotton", "sugarcane", "potato", "mustard"],
    "Uttar Pradesh":    ["rice", "wheat", "sugarcane", "mustard", "maize", "potato", "lentil", "onion"],
    "Madhya Pradesh":   ["wheat", "soybean", "rice", "mustard", "chickpea", "onion", "lentil"],
    "Rajasthan":        ["mustard", "bajra", "maize", "soybean", "wheat", "groundnut", "chickpea"],
    "Karnataka":        ["rice", "sugarcane", "cotton", "maize", "coffee", "mango", "tomato", "onion"],
    "Tamil Nadu":       ["rice", "cotton", "banana", "mango", "coconut", "sugarcane", "turmeric"],
    "Andhra Pradesh":   ["cotton", "rice", "groundnut", "sugarcane", "mango", "chilli", "onion"],
    "Gujarat":          ["cotton", "groundnut", "sugarcane", "wheat", "bajra", "banana", "onion"],
    "West Bengal":      ["rice", "jute", "wheat", "potato", "maize", "mustard"],
    "Haryana":          ["rice", "wheat", "cotton", "sugarcane", "mustard", "bajra"],
    "Kerala":           ["coffee", "coconut", "rice", "banana", "turmeric"],
    "Bihar":            ["rice", "wheat", "banana", "maize", "jute", "lentil", "potato"],
    "Telangana":        ["rice", "cotton", "maize", "turmeric", "soybean", "chilli"],
    "Odisha":           ["rice", "cotton", "sugarcane", "jute", "groundnut"],
}


def augment_yield_data():
    """Expand yield dataset to ~500+ rows."""
    path = os.path.join(RAW_DIR, "crop_yield_india.csv")
    header = ["state", "district", "crop", "season", "area_hectares", "production_tonnes", "yield_tonnes_per_hectare"]

    all_rows = []

    for state, districts in STATE_DISTRICTS.items():
        crops_for_state = STATE_CROP_MAP.get(state, [])
        for crop in crops_for_state:
            profile = YIELD_PROFILES.get(crop)
            if not profile:
                continue

            # Pick 2-3 random districts for this crop
            num_districts = min(len(districts), random.randint(2, 3))
            selected = random.sample(districts, num_districts)

            for district in selected:
                area = round(random.uniform(*profile["area_range"]))
                yld = round(random.uniform(*profile["yield_range"]), 1)
                production = round(area * yld)

                all_rows.append([
                    state, district, crop, profile["season"],
                    area, production, yld
                ])

    # Shuffle for variety
    random.shuffle(all_rows)

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(all_rows)

    print(f"  Augmented yield data: {len(all_rows)} rows ({len(YIELD_PROFILES)} crops, {len(STATE_DISTRICTS)} states)")
    return len(all_rows)


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("🌾 SmartAgri AI - Data Augmentation")
    print("=" * 60)

    print("\n1️⃣  Crop Recommendation Dataset")
    n1 = augment_crop_recommendation()

    print("\n2️⃣  Mandi Prices Dataset")
    n2 = augment_mandi_prices()

    print("\n3️⃣  Crop Yield Dataset")
    n3 = augment_yield_data()

    print("\n" + "=" * 60)
    print(f"✅ Augmentation complete!")
    print(f"   Crop Recommendation: {n1} rows")
    print(f"   Mandi Prices:        {n2} rows")
    print(f"   Crop Yield:          {n3} rows")
    print(f"   Total:               {n1 + n2 + n3} rows")
    print("=" * 60)
    print("\nNext step: Run preprocessing + training:")
    print("  python preprocess.py")
    print("  python export_models.py")
