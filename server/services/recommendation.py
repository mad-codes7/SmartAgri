"""
SmartAgri AI - Recommendation Service
Orchestrates the 6-step crop recommendation pipeline.
"""
import os
import json
import numpy as np
import joblib
from typing import List, Dict, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data", "raw")

# ─── Load crop encyclopedia ───────────────────────────────
with open(os.path.join(DATA_DIR, "crop_encyclopedia.json"), "r", encoding="utf-8") as f:
    CROP_DATABASE = json.load(f)
CROP_LOOKUP = {c["name"].lower(): c for c in CROP_DATABASE}


class RecommendationEngine:
    """6-step crop recommendation pipeline."""

    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.crop_model = None
        self.label_encoder = None
        self.scaler = None
        self._load_models()

    def _load_models(self):
        try:
            self.crop_model = joblib.load(os.path.join(self.model_dir, "crop_recommender.joblib"))
            self.label_encoder = joblib.load(os.path.join(self.model_dir, "label_encoder_crop.joblib"))
            self.scaler = joblib.load(os.path.join(self.model_dir, "scaler_crop.joblib"))
            print("✅ ML models loaded successfully")
        except Exception as e:
            print(f"⚠ ML models not found, using rule-based fallback: {e}")
            self.crop_model = None

    def get_recommendation(self, params: dict) -> dict:
        """Run full 6-step pipeline and return structured recommendation."""
        soil = params["soil"]
        weather = params["weather"]
        state = params["state"]
        season = weather["season"]
        irrigation = params.get("irrigation_type", "Rainfed")
        land_size = params.get("land_size_acres", 1.0)

        # Step 1: Crop Suitability Filtering
        suitable_crops = self._filter_crops(soil, weather, season, irrigation)

        # Step 2: ML-based scoring (if model available)
        if self.crop_model and self.scaler:
            ml_scores = self._ml_predict(soil, weather)
            for crop_info in suitable_crops:
                name_lower = crop_info["name"].lower()
                if name_lower in ml_scores:
                    crop_info["ml_score"] = ml_scores[name_lower]
                else:
                    crop_info["ml_score"] = crop_info["suitability_score"] * 0.8
        else:
            for crop_info in suitable_crops:
                crop_info["ml_score"] = crop_info["suitability_score"]

        # Sort by combined score
        suitable_crops.sort(key=lambda x: x["ml_score"], reverse=True)
        top_3 = suitable_crops[:3]

        if not top_3:
            top_3 = self._fallback_recommendations(season)

        # Step 3-6: Enrich each crop
        crop_results = []
        for rank, crop_info in enumerate(top_3, 1):
            crop_name = crop_info["name"]
            db_crop = CROP_LOOKUP.get(crop_name.lower(), {})

            # Step 2: Yield estimation
            base_yield = self._estimate_yield(crop_name, state, season)
            yield_adj = self._adjust_yield(base_yield, soil, weather, db_crop)

            # Step 3: Market evaluation
            price = self._estimate_price(crop_name)

            # Step 4: Risk scoring
            risk = self._calculate_risk(crop_name, weather, irrigation, db_crop)

            # Step 5: Profit calculation
            cost = db_crop.get("avg_cost_per_hectare", 30000)
            cost_total = cost * (land_size * 0.4047)  # acres to hectares
            revenue = yield_adj * (land_size * 0.4047) * price
            profit = revenue - cost_total

            crop_results.append({
                "name": crop_name,
                "suitability_score": round(crop_info["ml_score"] * 100, 1),
                "expected_yield": f"{yield_adj:.1f} tonnes/hectare",
                "predicted_price": f"₹{price:,.0f}/quintal",
                "estimated_cost": f"₹{cost_total:,.0f}",
                "estimated_profit": f"₹{profit:,.0f}",
                "risk_level": risk["level"],
                "why_this_crop": self._generate_reasoning(crop_info, soil, weather, season, db_crop),
            })

        # Market insight (based on top crop)
        market_insight = self._generate_market_insight(top_3[0]["name"], season)

        # Overall risk assessment
        risk_assessment = self._generate_risk_assessment(weather, irrigation, season)

        # Step 6: Productivity tips
        tips = self._generate_productivity_tips(top_3[0]["name"], soil, weather, irrigation)

        return {
            "crops": crop_results,
            "market_insight": market_insight,
            "risk_assessment": risk_assessment,
            "productivity_tips": tips,
            "season": season,
            "state": state,
        }

    def _filter_crops(self, soil: dict, weather: dict, season: str, irrigation: str) -> List[dict]:
        """Step 1: Filter crops based on soil, weather, season compatibility."""
        suitable = []
        for crop in CROP_DATABASE:
            score = 0.0
            checks_passed = 0
            total_checks = 5

            # Season check
            if season in crop.get("seasons", []):
                checks_passed += 1
                score += 0.2

            # Irrigation check
            if irrigation in crop.get("irrigation_types", []):
                checks_passed += 1
                score += 0.15

            # Soil type check
            soil_type = soil.get("soil_type", "Loamy")
            if soil_type in crop.get("soil_types", []):
                checks_passed += 1
                score += 0.15

            # NPK compatibility
            n, p, k = soil["N"], soil["P"], soil["K"]
            n_ok = crop.get("min_n", 0) <= n <= crop.get("max_n", 200)
            p_ok = crop.get("min_p", 0) <= p <= crop.get("max_p", 200)
            k_ok = crop.get("min_k", 0) <= k <= crop.get("max_k", 300)
            npk_score = sum([n_ok, p_ok, k_ok]) / 3
            score += npk_score * 0.25
            if npk_score >= 0.66:
                checks_passed += 1

            # pH compatibility
            ph = soil["ph"]
            if crop.get("min_ph", 4) <= ph <= crop.get("max_ph", 9):
                checks_passed += 1
                score += 0.1
            else:
                ph_dist = min(abs(ph - crop.get("min_ph", 4)), abs(ph - crop.get("max_ph", 9)))
                score += max(0, 0.1 - ph_dist * 0.05)

            # Temperature bonus
            temp = weather.get("temperature", 25)
            if crop.get("min_temp", 10) <= temp <= crop.get("max_temp", 40):
                score += 0.1

            # Rainfall bonus
            rain = weather.get("rainfall", 100)
            if crop.get("min_rainfall", 0) <= rain <= crop.get("max_rainfall", 400):
                score += 0.05

            if checks_passed >= 3 and score >= 0.4:
                suitable.append({
                    "name": crop["name"],
                    "suitability_score": min(score, 1.0),
                    "checks_passed": checks_passed,
                })

        return suitable

    def _ml_predict(self, soil: dict, weather: dict) -> Dict[str, float]:
        """Use ML model to get probability scores for each crop."""
        features = np.array([[
            soil["N"], soil["P"], soil["K"],
            weather["temperature"], weather["humidity"],
            soil["ph"], weather["rainfall"]
        ]])
        features_scaled = self.scaler.transform(features)
        probas = self.crop_model.predict_proba(features_scaled)[0]
        classes = self.label_encoder.classes_

        scores = {}
        for cls, prob in zip(classes, probas):
            scores[cls.lower()] = float(prob)
        return scores

    def _estimate_yield(self, crop: str, state: str, season: str) -> float:
        """Step 2: Estimate yield based on region and crop."""
        yield_map = {
            "rice": 3.0, "wheat": 3.5, "maize": 2.5, "cotton": 1.5,
            "sugarcane": 70.0, "soybean": 1.2, "chickpea": 1.0,
            "mustard": 1.2, "groundnut": 1.5, "banana": 30.0,
            "mango": 10.0, "coffee": 1.0, "coconut": 8.0,
            "jute": 2.5, "lentil": 0.9, "pomegranate": 5.0,
            "grapes": 20.0, "watermelon": 25.0, "muskmelon": 15.0,
            "apple": 12.0, "orange": 10.0, "papaya": 40.0,
            "pigeon peas": 0.8, "kidney beans": 0.9, "moth beans": 0.6,
            "mung bean": 0.7, "black gram": 0.6,
        }
        return yield_map.get(crop.lower(), 2.0)

    def _adjust_yield(self, base_yield: float, soil: dict, weather: dict, crop_db: dict) -> float:
        """Adjust yield based on soil nutrient adequacy and weather deviation."""
        adj = 1.0

        # Nutrient adequacy adjustment
        if crop_db:
            n_mid = (crop_db.get("min_n", 0) + crop_db.get("max_n", 100)) / 2
            if soil["N"] < crop_db.get("min_n", 0):
                adj *= 0.85
            elif abs(soil["N"] - n_mid) < 10:
                adj *= 1.05

        # Temperature adjustment
        temp = weather.get("temperature", 25)
        if crop_db:
            ideal_temp = (crop_db.get("min_temp", 20) + crop_db.get("max_temp", 30)) / 2
            temp_dev = abs(temp - ideal_temp)
            if temp_dev > 5:
                adj *= 0.9
            elif temp_dev < 2:
                adj *= 1.05

        # Rainfall adjustment
        rain = weather.get("rainfall", 100)
        if crop_db:
            ideal_rain = (crop_db.get("min_rainfall", 50) + crop_db.get("max_rainfall", 200)) / 2
            if rain < crop_db.get("min_rainfall", 50):
                adj *= 0.8
            elif rain > crop_db.get("max_rainfall", 300):
                adj *= 0.85

        return round(base_yield * adj, 2)

    def _estimate_price(self, crop: str) -> float:
        """Step 3: Estimate selling price per quintal."""
        price_map = {
            "rice": 2200, "wheat": 2350, "maize": 2000, "cotton": 6300,
            "sugarcane": 345, "soybean": 4600, "chickpea": 5100,
            "mustard": 5400, "groundnut": 5300, "banana": 1550,
            "mango": 4200, "coffee": 9400, "coconut": 3000,
            "jute": 4400, "lentil": 6000, "pomegranate": 8000,
            "grapes": 5000, "watermelon": 1200, "muskmelon": 1500,
            "apple": 6000, "orange": 3500, "papaya": 1800,
            "pigeon peas": 6500, "kidney beans": 7000, "moth beans": 5500,
            "mung bean": 7200, "black gram": 6200,
        }
        return price_map.get(crop.lower(), 3000)

    def _calculate_risk(self, crop: str, weather: dict, irrigation: str, crop_db: dict) -> dict:
        """Step 4: Calculate multi-factor risk score."""
        climate_risk = 0.3
        water_risk = 0.3
        market_risk = 0.3
        pest_risk = 0.2

        # Climate risk
        temp = weather.get("temperature", 25)
        if crop_db:
            if temp < crop_db.get("min_temp", 15) or temp > crop_db.get("max_temp", 35):
                climate_risk = 0.8

        # Water risk
        if irrigation == "Rainfed":
            water_risk = 0.6
        elif irrigation == "Borewell":
            water_risk = 0.3
        else:
            water_risk = 0.2

        # Market risk (volatile crops)
        volatile_crops = ["cotton", "soybean", "mango", "grapes", "coffee"]
        if crop.lower() in volatile_crops:
            market_risk = 0.6

        # Pest risk
        if crop_db and len(crop_db.get("pest_info", [])) > 3:
            pest_risk = 0.5

        overall = (climate_risk * 0.3 + water_risk * 0.3 + market_risk * 0.25 + pest_risk * 0.15)

        if overall < 0.35:
            level = "Low Risk"
        elif overall < 0.55:
            level = "Medium Risk"
        else:
            level = "High Risk"

        return {"score": round(overall, 2), "level": level}

    def _generate_reasoning(self, crop_info: dict, soil: dict, weather: dict,
                           season: str, crop_db: dict) -> str:
        """Generate human-readable reasoning for crop recommendation."""
        crop = crop_info["name"]
        reasons = []

        if crop_db:
            if season in crop_db.get("seasons", []):
                reasons.append(f"Well-suited for {season} season")

            n_ok = crop_db.get("min_n", 0) <= soil["N"] <= crop_db.get("max_n", 200)
            p_ok = crop_db.get("min_p", 0) <= soil["P"] <= crop_db.get("max_p", 200)
            k_ok = crop_db.get("min_k", 0) <= soil["K"] <= crop_db.get("max_k", 300)
            if n_ok and p_ok and k_ok:
                reasons.append("Soil nutrients are within ideal range")
            elif sum([n_ok, p_ok, k_ok]) >= 2:
                reasons.append("Most soil nutrients match requirements")

            if crop_db.get("min_ph", 4) <= soil["ph"] <= crop_db.get("max_ph", 9):
                reasons.append(f"Soil pH {soil['ph']} is compatible")

        score_pct = crop_info["ml_score"] * 100
        if score_pct > 80:
            reasons.append(f"High suitability score ({score_pct:.0f}%)")
        elif score_pct > 60:
            reasons.append(f"Good suitability score ({score_pct:.0f}%)")

        return ". ".join(reasons) if reasons else f"{crop} is a suitable crop for your conditions"

    def _generate_market_insight(self, crop: str, season: str) -> dict:
        """Generate market insight for the top recommended crop."""
        trends = {
            "rice": ("Stable with slight upward trend", "Strong", "Oct-Dec"),
            "wheat": ("Rising due to winter demand", "High", "Mar-May"),
            "cotton": ("Volatile, watch global trends", "Moderate", "Nov-Jan"),
            "maize": ("Stable domestic demand", "Moderate", "Sep-Nov"),
            "soybean": ("Seasonal fluctuation expected", "High", "Nov-Feb"),
            "chickpea": ("Upward trend pre-festival", "Strong", "Feb-Apr"),
            "sugarcane": ("Government MSP ensures stability", "Strong", "Dec-Mar"),
            "mustard": ("Good demand, rising prices", "High", "Mar-May"),
        }
        crop_lower = crop.lower()
        if crop_lower in trends:
            t = trends[crop_lower]
            return {
                "current_trend": t[0],
                "demand_outlook": t[1],
                "best_selling_window": t[2],
                "volatility_level": "Low" if t[1] == "Strong" else "Medium",
                "price_range": f"₹{self._estimate_price(crop) * 0.9:,.0f} - ₹{self._estimate_price(crop) * 1.1:,.0f}/quintal",
            }
        return {
            "current_trend": "Stable market conditions",
            "demand_outlook": "Moderate",
            "best_selling_window": "Post-harvest peak demand",
            "volatility_level": "Medium",
            "price_range": f"₹{self._estimate_price(crop) * 0.9:,.0f} - ₹{self._estimate_price(crop) * 1.1:,.0f}/quintal",
        }

    def _generate_risk_assessment(self, weather: dict, irrigation: str, season: str) -> dict:
        """Generate overall risk assessment."""
        climate_risk = "Medium"
        water_risk = "Low" if irrigation != "Rainfed" else "Medium"
        market_risk = "Medium"
        pest_risk = "Low"

        rain = weather.get("rainfall", 100)
        temp = weather.get("temperature", 25)

        if rain < 50:
            climate_risk = "High"
            water_risk = "High"
        elif rain > 250:
            climate_risk = "High"

        if temp > 35 or temp < 15:
            climate_risk = "High"

        risk_scores = {"Low": 1, "Medium": 2, "High": 3}
        avg_score = np.mean([
            risk_scores[climate_risk],
            risk_scores[water_risk],
            risk_scores[market_risk],
            risk_scores[pest_risk],
        ])

        overall_level = "Low Risk" if avg_score < 1.5 else "Medium Risk" if avg_score < 2.5 else "High Risk"

        return {
            "climate_risk": climate_risk,
            "water_risk": water_risk,
            "market_risk": market_risk,
            "pest_risk": pest_risk,
            "overall_score": round(avg_score / 3, 2),
            "overall_level": overall_level,
        }

    def _generate_productivity_tips(self, crop: str, soil: dict, weather: dict,
                                    irrigation: str) -> List[dict]:
        """Step 6: Generate low-cost productivity improvement tips."""
        tips = []
        crop_db = CROP_LOOKUP.get(crop.lower(), {})

        # Soil-based tips
        if soil["N"] < 40:
            tips.append({
                "title": "Boost Nitrogen Naturally",
                "description": "Intercrop with legumes (moong, urad) to fix atmospheric nitrogen. Apply green manure before sowing.",
                "category": "nutrient",
            })
        if soil["ph"] < 5.5:
            tips.append({
                "title": "Correct Acidic Soil",
                "description": "Apply lime or wood ash to raise pH. Use 2-4 kg lime per 100 sq meters.",
                "category": "soil",
            })
        elif soil["ph"] > 8.0:
            tips.append({
                "title": "Manage Alkaline Soil",
                "description": "Add organic matter or gypsum to lower pH. Apply compost regularly.",
                "category": "soil",
            })

        # Water management
        if irrigation == "Rainfed":
            tips.append({
                "title": "Rainwater Harvesting",
                "description": "Create farm ponds to capture monsoon runoff. Mulch fields to retain soil moisture.",
                "category": "water",
            })
        tips.append({
            "title": "Optimal Irrigation Timing",
            "description": "Irrigate during early morning or evening to minimize evaporation loss.",
            "category": "water",
        })

        # Crop rotation
        tips.append({
            "title": "Practice Crop Rotation",
            "description": f"Alternate {crop} with a legume crop in the next season to restore soil nutrients naturally.",
            "category": "rotation",
        })

        # Sowing tips from crop database
        if crop_db and crop_db.get("cultivation_tips"):
            for tip_text in crop_db["cultivation_tips"][:2]:
                tips.append({
                    "title": "Cultivation Best Practice",
                    "description": tip_text,
                    "category": "sowing",
                })

        # Intercropping
        tips.append({
            "title": "Try Intercropping",
            "description": f"Intercrop {crop} with compatible short-duration crops to maximize land utilization and reduce pest pressure.",
            "category": "intercropping",
        })

        return tips[:8]

    def _fallback_recommendations(self, season: str) -> List[dict]:
        """Fallback recommendations when no crop passes filtering."""
        season_crops = {
            "Kharif": [
                {"name": "Rice", "suitability_score": 0.7, "ml_score": 0.7, "checks_passed": 3},
                {"name": "Maize", "suitability_score": 0.65, "ml_score": 0.65, "checks_passed": 3},
                {"name": "Cotton", "suitability_score": 0.6, "ml_score": 0.6, "checks_passed": 3},
            ],
            "Rabi": [
                {"name": "Wheat", "suitability_score": 0.7, "ml_score": 0.7, "checks_passed": 3},
                {"name": "Chickpea", "suitability_score": 0.65, "ml_score": 0.65, "checks_passed": 3},
                {"name": "Mustard", "suitability_score": 0.6, "ml_score": 0.6, "checks_passed": 3},
            ],
            "Summer": [
                {"name": "Watermelon", "suitability_score": 0.7, "ml_score": 0.7, "checks_passed": 3},
                {"name": "Muskmelon", "suitability_score": 0.65, "ml_score": 0.65, "checks_passed": 3},
                {"name": "Mung Bean", "suitability_score": 0.6, "ml_score": 0.6, "checks_passed": 3},
            ],
        }
        return season_crops.get(season, season_crops["Kharif"])


# Singleton engine instance
_engine_instance: Optional[RecommendationEngine] = None


def get_engine(model_dir: str) -> RecommendationEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = RecommendationEngine(model_dir)
    return _engine_instance
