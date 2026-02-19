"""
SmartAgri AI - Weather Service
Provides weather data (simulated/mock for offline use).
"""
import random
from typing import Dict, List, Optional


class WeatherService:
    """Weather data service with simulated regional data."""

    # Regional weather averages by state + season
    REGIONAL_WEATHER = {
        "Punjab": {"Kharif": {"temp": 33, "humidity": 72, "rainfall": 180}, "Rabi": {"temp": 15, "humidity": 55, "rainfall": 30}},
        "Uttar Pradesh": {"Kharif": {"temp": 32, "humidity": 75, "rainfall": 200}, "Rabi": {"temp": 16, "humidity": 60, "rainfall": 25}},
        "Madhya Pradesh": {"Kharif": {"temp": 30, "humidity": 70, "rainfall": 160}, "Rabi": {"temp": 18, "humidity": 50, "rainfall": 20}},
        "Maharashtra": {"Kharif": {"temp": 28, "humidity": 78, "rainfall": 220}, "Rabi": {"temp": 22, "humidity": 45, "rainfall": 15}},
        "Rajasthan": {"Kharif": {"temp": 35, "humidity": 55, "rainfall": 90}, "Rabi": {"temp": 17, "humidity": 40, "rainfall": 10}},
        "Karnataka": {"Kharif": {"temp": 27, "humidity": 80, "rainfall": 250}, "Rabi": {"temp": 23, "humidity": 55, "rainfall": 30}},
        "Tamil Nadu": {"Kharif": {"temp": 32, "humidity": 75, "rainfall": 180}, "Rabi": {"temp": 26, "humidity": 70, "rainfall": 150}},
        "Gujarat": {"Kharif": {"temp": 33, "humidity": 70, "rainfall": 150}, "Rabi": {"temp": 20, "humidity": 45, "rainfall": 10}},
        "West Bengal": {"Kharif": {"temp": 30, "humidity": 85, "rainfall": 280}, "Rabi": {"temp": 18, "humidity": 60, "rainfall": 20}},
        "Haryana": {"Kharif": {"temp": 34, "humidity": 68, "rainfall": 160}, "Rabi": {"temp": 14, "humidity": 55, "rainfall": 25}},
        "Kerala": {"Kharif": {"temp": 28, "humidity": 88, "rainfall": 350}, "Rabi": {"temp": 27, "humidity": 75, "rainfall": 60}},
        "Bihar": {"Kharif": {"temp": 31, "humidity": 80, "rainfall": 250}, "Rabi": {"temp": 17, "humidity": 60, "rainfall": 20}},
        "Andhra Pradesh": {"Kharif": {"temp": 31, "humidity": 76, "rainfall": 200}, "Rabi": {"temp": 25, "humidity": 60, "rainfall": 40}},
        "Telangana": {"Kharif": {"temp": 30, "humidity": 74, "rainfall": 180}, "Rabi": {"temp": 24, "humidity": 55, "rainfall": 25}},
        "Odisha": {"Kharif": {"temp": 30, "humidity": 82, "rainfall": 260}, "Rabi": {"temp": 21, "humidity": 55, "rainfall": 15}},
    }

    def get_current(self, state: str, district: str = "") -> Dict:
        """Get current weather for location."""
        base = self._get_base_weather(state, "Kharif")
        variation = lambda v: round(v + random.uniform(-2, 2), 1)
        return {
            "temperature": variation(base["temp"]),
            "humidity": variation(base["humidity"]),
            "description": self._get_description(base["temp"], base["humidity"]),
            "wind_speed": round(random.uniform(5, 20), 1),
            "rainfall": round(base["rainfall"] / 30 + random.uniform(-2, 5), 1),
            "icon": self._get_icon(base["humidity"]),
        }

    def get_forecast(self, state: str, days: int = 7) -> List[Dict]:
        """Get multi-day forecast."""
        base = self._get_base_weather(state, "Kharif")
        forecast = []
        from datetime import datetime, timedelta
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
                "description": self._get_description(base["temp"] + temp_var, base["humidity"]),
            })
        return forecast

    def get_impact(self, state: str, season: str, crops: List[str] = None) -> Dict:
        """Analyze weather impact on crops."""
        base = self._get_base_weather(state, season)
        impact_level = "Low"
        recommendations = []

        if base["temp"] > 35:
            impact_level = "High"
            recommendations.append("Apply mulch to reduce soil temperature")
            recommendations.append("Increase irrigation frequency")
        elif base["temp"] < 10:
            impact_level = "Medium"
            recommendations.append("Protect sensitive crops from frost")

        if base["rainfall"] > 250:
            impact_level = "Medium" if impact_level != "High" else "High"
            recommendations.append("Ensure proper drainage to prevent waterlogging")
        elif base["rainfall"] < 50:
            impact_level = "Medium" if impact_level != "High" else "High"
            recommendations.append("Arrange supplemental irrigation")

        if base["humidity"] > 85:
            recommendations.append("Watch for fungal disease outbreaks")

        if not recommendations:
            recommendations.append("Weather conditions are favorable for farming")

        return {
            "impact_level": impact_level,
            "summary": f"{'Favorable' if impact_level == 'Low' else 'Challenging'} conditions for {season} crops in {state}",
            "affected_crops": crops or [],
            "recommendations": recommendations,
        }

    def _get_base_weather(self, state: str, season: str) -> Dict:
        default = {"temp": 28, "humidity": 70, "rainfall": 150}
        state_data = self.REGIONAL_WEATHER.get(state, {})
        return state_data.get(season, state_data.get("Kharif", default))

    def _get_description(self, temp: float, humidity: float) -> str:
        if humidity > 80:
            return "Partly Cloudy" if temp > 28 else "Overcast"
        elif humidity > 60:
            return "Mostly Sunny"
        else:
            return "Clear Sky"

    def _get_icon(self, humidity: float) -> str:
        if humidity > 80:
            return "cloudy"
        elif humidity > 60:
            return "partly-cloudy"
        else:
            return "sunny"


_weather_instance: Optional[WeatherService] = None


def get_weather_service() -> WeatherService:
    global _weather_instance
    if _weather_instance is None:
        _weather_instance = WeatherService()
    return _weather_instance
