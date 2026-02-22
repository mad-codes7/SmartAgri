"""
SmartAgri AI - Weather Service
Fetches real weather from OpenWeatherMap API with fallback to simulated data.
"""
import random
import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from config import get_settings

# City coordinates for Indian states (state capitals)
STATE_COORDS = {
    "Punjab":           {"lat": 30.73, "lon": 76.78, "city": "Chandigarh"},
    "Uttar Pradesh":    {"lat": 26.85, "lon": 80.95, "city": "Lucknow"},
    "Madhya Pradesh":   {"lat": 23.26, "lon": 77.41, "city": "Bhopal"},
    "Maharashtra":      {"lat": 19.08, "lon": 72.88, "city": "Mumbai"},
    "Rajasthan":        {"lat": 26.92, "lon": 75.79, "city": "Jaipur"},
    "Karnataka":        {"lat": 12.97, "lon": 77.59, "city": "Bangalore"},
    "Tamil Nadu":       {"lat": 13.08, "lon": 80.27, "city": "Chennai"},
    "Gujarat":          {"lat": 23.02, "lon": 72.57, "city": "Ahmedabad"},
    "West Bengal":      {"lat": 22.57, "lon": 88.36, "city": "Kolkata"},
    "Haryana":          {"lat": 30.73, "lon": 76.78, "city": "Chandigarh"},
    "Kerala":           {"lat": 8.52,  "lon": 76.94, "city": "Thiruvananthapuram"},
    "Bihar":            {"lat": 25.60, "lon": 85.10, "city": "Patna"},
    "Andhra Pradesh":   {"lat": 16.51, "lon": 80.63, "city": "Vijayawada"},
    "Telangana":        {"lat": 17.39, "lon": 78.49, "city": "Hyderabad"},
    "Odisha":           {"lat": 20.30, "lon": 85.83, "city": "Bhubaneswar"},
}

# Fallback regional averages (original mock data)
REGIONAL_WEATHER = {
    "Punjab":           {"Kharif": {"temp": 33, "humidity": 72, "rainfall": 180}, "Rabi": {"temp": 15, "humidity": 55, "rainfall": 30}},
    "Uttar Pradesh":    {"Kharif": {"temp": 32, "humidity": 75, "rainfall": 200}, "Rabi": {"temp": 16, "humidity": 60, "rainfall": 25}},
    "Madhya Pradesh":   {"Kharif": {"temp": 30, "humidity": 70, "rainfall": 160}, "Rabi": {"temp": 18, "humidity": 50, "rainfall": 20}},
    "Maharashtra":      {"Kharif": {"temp": 28, "humidity": 78, "rainfall": 220}, "Rabi": {"temp": 22, "humidity": 45, "rainfall": 15}},
    "Rajasthan":        {"Kharif": {"temp": 35, "humidity": 55, "rainfall": 90},  "Rabi": {"temp": 17, "humidity": 40, "rainfall": 10}},
    "Karnataka":        {"Kharif": {"temp": 27, "humidity": 80, "rainfall": 250}, "Rabi": {"temp": 23, "humidity": 55, "rainfall": 30}},
    "Tamil Nadu":       {"Kharif": {"temp": 32, "humidity": 75, "rainfall": 180}, "Rabi": {"temp": 26, "humidity": 70, "rainfall": 150}},
    "Gujarat":          {"Kharif": {"temp": 33, "humidity": 70, "rainfall": 150}, "Rabi": {"temp": 20, "humidity": 45, "rainfall": 10}},
    "West Bengal":      {"Kharif": {"temp": 30, "humidity": 85, "rainfall": 280}, "Rabi": {"temp": 18, "humidity": 60, "rainfall": 20}},
    "Haryana":          {"Kharif": {"temp": 34, "humidity": 68, "rainfall": 160}, "Rabi": {"temp": 14, "humidity": 55, "rainfall": 25}},
    "Kerala":           {"Kharif": {"temp": 28, "humidity": 88, "rainfall": 350}, "Rabi": {"temp": 27, "humidity": 75, "rainfall": 60}},
    "Bihar":            {"Kharif": {"temp": 31, "humidity": 80, "rainfall": 250}, "Rabi": {"temp": 17, "humidity": 60, "rainfall": 20}},
    "Andhra Pradesh":   {"Kharif": {"temp": 31, "humidity": 76, "rainfall": 200}, "Rabi": {"temp": 25, "humidity": 60, "rainfall": 40}},
    "Telangana":        {"Kharif": {"temp": 30, "humidity": 74, "rainfall": 180}, "Rabi": {"temp": 24, "humidity": 55, "rainfall": 25}},
    "Odisha":           {"Kharif": {"temp": 30, "humidity": 82, "rainfall": 260}, "Rabi": {"temp": 21, "humidity": 55, "rainfall": 15}},
}

OWM_BASE = "https://api.openweathermap.org/data/2.5"


class WeatherService:
    """Weather data service — real OpenWeatherMap data with simulated fallback."""

    def __init__(self):
        self.api_key = get_settings().OPENWEATHER_API_KEY
        self._has_key = bool(self.api_key) and self.api_key != "your-openweathermap-key-here"
        if self._has_key:
            print(f"  ✅ OpenWeatherMap API key configured")
        else:
            print(f"  ⚠️  No OpenWeatherMap API key — using simulated weather data")

    # ── Public API ──────────────────────────────────────

    def get_current(self, state: str, district: str = "") -> Dict:
        """Current weather (real or fallback)."""
        if self._has_key:
            try:
                return self._fetch_current(state)
            except Exception as e:
                print(f"  ⚠️  OpenWeatherMap current failed: {e}, using fallback")
        return self._mock_current(state)

    def get_forecast(self, state: str, days: int = 7) -> List[Dict]:
        """Multi-day forecast (real or fallback)."""
        if self._has_key:
            try:
                return self._fetch_forecast(state, days)
            except Exception as e:
                print(f"  ⚠️  OpenWeatherMap forecast failed: {e}, using fallback")
        return self._mock_forecast(state, days)

    def get_impact(self, state: str, season: str, crops: List[str] = None) -> Dict:
        """Analyze weather impact on crops (uses current weather data)."""
        current = self.get_current(state)
        temp = current.get("temperature", 28)
        humidity = current.get("humidity", 70)
        rainfall = current.get("rainfall", 5)

        impact_level = "Low"
        recommendations = []

        if temp > 35:
            impact_level = "High"
            recommendations.append("Apply mulch to reduce soil temperature")
            recommendations.append("Increase irrigation frequency")
        elif temp < 10:
            impact_level = "Medium"
            recommendations.append("Protect sensitive crops from frost")

        monthly_rainfall = rainfall * 30
        if monthly_rainfall > 250:
            impact_level = "Medium" if impact_level != "High" else "High"
            recommendations.append("Ensure proper drainage to prevent waterlogging")
        elif monthly_rainfall < 50:
            impact_level = "Medium" if impact_level != "High" else "High"
            recommendations.append("Arrange supplemental irrigation")

        if humidity > 85:
            recommendations.append("Watch for fungal disease outbreaks")

        if not recommendations:
            recommendations.append("Weather conditions are favorable for farming")

        return {
            "impact_level": impact_level,
            "summary": f"{'Favorable' if impact_level == 'Low' else 'Challenging'} conditions for {season} crops in {state}",
            "affected_crops": crops or [],
            "recommendations": recommendations,
            "current_weather": current,
        }

    def _get_base_weather(self, state: str, season: str) -> Dict:
        default = {"temp": 28, "humidity": 70, "rainfall": 150}
        state_data = REGIONAL_WEATHER.get(state, {})
        return state_data.get(season, state_data.get("Kharif", default))

    # ── Real OpenWeatherMap API ─────────────────────────

    def _get_coords(self, state: str) -> dict:
        return STATE_COORDS.get(state, {"lat": 22.5, "lon": 82.0, "city": "India"})

    def _fetch_current(self, state: str) -> Dict:
        coords = self._get_coords(state)
        url = f"{OWM_BASE}/weather"
        params = {
            "lat": coords["lat"],
            "lon": coords["lon"],
            "appid": self.api_key,
            "units": "metric",
        }
        r = httpx.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()

        main = data.get("main", {})
        weather = data.get("weather", [{}])[0]
        wind = data.get("wind", {})
        rain = data.get("rain", {})

        temp = main.get("temp", 28)
        humidity = main.get("humidity", 70)

        return {
            "temperature": round(temp, 1),
            "feels_like": round(main.get("feels_like", temp), 1),
            "humidity": humidity,
            "description": weather.get("description", "").title(),
            "wind_speed": round(wind.get("speed", 0) * 3.6, 1),  # m/s → km/h
            "rainfall": round(rain.get("1h", rain.get("3h", 0)), 1),
            "pressure": main.get("pressure", 1013),
            "visibility": round(data.get("visibility", 10000) / 1000, 1),
            "icon": self._owm_icon(weather.get("icon", "01d")),
            "owm_icon": weather.get("icon", "01d"),
            "city": data.get("name", coords["city"]),
            "source": "openweathermap",
            "timestamp": datetime.now().isoformat(),
            "time_of_day": self._time_of_day(),
        }

    def _fetch_forecast(self, state: str, days: int) -> List[Dict]:
        coords = self._get_coords(state)
        url = f"{OWM_BASE}/forecast"
        params = {
            "lat": coords["lat"],
            "lon": coords["lon"],
            "appid": self.api_key,
            "units": "metric",
        }
        r = httpx.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()

        # OWM returns 3-hour intervals. Aggregate into daily.
        daily = {}
        for item in data.get("list", []):
            dt_txt = item["dt_txt"]
            date = dt_txt.split(" ")[0]
            if date not in daily:
                daily[date] = {"temps": [], "humidities": [], "rain": 0.0, "desc": "", "icon": ""}
            main = item.get("main", {})
            daily[date]["temps"].append(main.get("temp", 28))
            daily[date]["humidities"].append(main.get("humidity", 70))
            daily[date]["rain"] += item.get("rain", {}).get("3h", 0)
            # Use noon description if available
            if "12:00:00" in dt_txt:
                daily[date]["desc"] = item.get("weather", [{}])[0].get("description", "").title()
                daily[date]["icon"] = item.get("weather", [{}])[0].get("icon", "01d")

        forecast = []
        today_str = datetime.now().strftime("%Y-%m-%d")
        for date, info in sorted(daily.items()):
            if date == today_str:
                continue
            if len(forecast) >= days:
                break
            temps = info["temps"]
            forecast.append({
                "date": date,
                "temp_min": round(min(temps), 1),
                "temp_max": round(max(temps), 1),
                "humidity": round(sum(info["humidities"]) / len(info["humidities"]), 1),
                "rainfall": round(info["rain"], 1),
                "description": info["desc"] or "Partly Cloudy",
                "icon": info["icon"] or "02d",
                "source": "openweathermap",
            })
        return forecast

    def _owm_icon(self, icon_code: str) -> str:
        mapping = {
            "01": "sunny", "02": "partly-cloudy", "03": "cloudy",
            "04": "cloudy", "09": "rainy", "10": "rainy",
            "11": "thunderstorm", "13": "snowy", "50": "foggy",
        }
        return mapping.get(icon_code[:2], "partly-cloudy")

    # ── Fallback Mock Data ──────────────────────────────

    def _mock_current(self, state: str) -> Dict:
        base = self._get_base_weather(state, "Kharif")
        v = lambda val: round(val + random.uniform(-2, 2), 1)
        temp = v(base["temp"])
        return {
            "temperature": temp,
            "feels_like": round(temp + random.uniform(0, 3), 1),
            "humidity": v(base["humidity"]),
            "description": self._desc(base["temp"], base["humidity"]),
            "wind_speed": round(random.uniform(5, 20), 1),
            "rainfall": round(max(0, base["rainfall"] / 30 + random.uniform(-2, 5)), 1),
            "pressure": random.randint(1005, 1020),
            "visibility": round(random.uniform(5, 15), 1),
            "icon": self._icon(base["humidity"]),
            "city": STATE_COORDS.get(state, {}).get("city", state),
            "source": "simulated",
            "timestamp": datetime.now().isoformat(),
            "time_of_day": self._time_of_day(),
        }

    def _mock_forecast(self, state: str, days: int) -> List[Dict]:
        base = self._get_base_weather(state, "Kharif")
        forecast = []
        today = datetime.now()
        for i in range(days):
            day = today + timedelta(days=i + 1)
            temp_var = random.uniform(-3, 3)
            forecast.append({
                "date": day.strftime("%Y-%m-%d"),
                "temp_min": round(base["temp"] - 4 + temp_var, 1),
                "temp_max": round(base["temp"] + 4 + temp_var, 1),
                "humidity": round(base["humidity"] + random.uniform(-5, 5), 1),
                "rainfall": round(max(0, base["rainfall"] / 30 + random.uniform(-5, 10)), 1),
                "description": self._desc(base["temp"] + temp_var, base["humidity"]),
                "source": "simulated",
            })
        return forecast

    def _desc(self, temp: float, hum: float) -> str:
        if hum > 80:
            return "Partly Cloudy" if temp > 28 else "Overcast"
        elif hum > 60:
            return "Mostly Sunny"
        return "Clear Sky"

    def _icon(self, hum: float) -> str:
        if hum > 80: return "cloudy"
        if hum > 60: return "partly-cloudy"
        return "sunny"

    def _time_of_day(self) -> str:
        h = datetime.now().hour
        if 5 <= h < 12:  return "morning"
        if 12 <= h < 17: return "afternoon"
        if 17 <= h < 20: return "evening"
        return "night"


_weather_instance: Optional[WeatherService] = None


def get_weather_service() -> WeatherService:
    global _weather_instance
    if _weather_instance is None:
        _weather_instance = WeatherService()
    return _weather_instance
