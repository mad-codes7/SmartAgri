"""
SmartAgri AI - Market Service
Handles mandi price data, trends, volatility analysis.
"""
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List, Dict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data", "raw")


class MarketService:
    def __init__(self):
        self._price_data = None
        self._load_data()

    def _load_data(self):
        try:
            csv_path = os.path.join(DATA_DIR, "mandi_prices.csv")
            self._price_data = pd.read_csv(csv_path)
            self._price_data["date"] = pd.to_datetime(self._price_data["date"])
            print(f"✅ Market data loaded: {len(self._price_data)} records")
        except Exception as e:
            print(f"⚠ Could not load market data: {e}")
            self._price_data = pd.DataFrame()

    def get_all_prices(self, state: Optional[str] = None) -> List[Dict]:
        """Get latest prices for all commodities, optionally filtered by state."""
        if self._price_data.empty:
            return []
        df = self._price_data.copy()
        if state:
            df = df[df["state"].str.lower() == state.lower()]
        # Get the latest record per commodity
        latest = df.sort_values("date", ascending=False).groupby("commodity").first().reset_index()
        records = latest.to_dict("records")
        for r in records:
            if "date" in r and hasattr(r["date"], "strftime"):
                r["date"] = r["date"].strftime("%Y-%m-%d")
        return records

    def get_prices(self, crop: str, state: Optional[str] = None) -> List[Dict]:
        """Get current prices for a crop."""
        if self._price_data.empty:
            return []
        mask = self._price_data["commodity"].str.lower() == crop.lower()
        if state:
            mask &= self._price_data["state"].str.lower() == state.lower()
        df = self._price_data[mask].sort_values("date", ascending=False)
        return df.head(10).to_dict("records")

    def get_price_history(self, crop: str, days: int = 90) -> List[Dict]:
        """Get historical price data for a crop."""
        if self._price_data.empty:
            return []
        mask = self._price_data["commodity"].str.lower() == crop.lower()
        df = self._price_data[mask].sort_values("date")
        records = df.to_dict("records")
        for r in records:
            r["date"] = r["date"].strftime("%Y-%m-%d")
        return records

    def get_trend(self, crop: str) -> Dict:
        """Analyze price trend for a crop."""
        if self._price_data.empty:
            return {"trend_direction": "stable", "price_change_pct": 0}

        mask = self._price_data["commodity"].str.lower() == crop.lower()
        df = self._price_data[mask].sort_values("date")
        if len(df) < 2:
            return {"trend_direction": "stable", "price_change_pct": 0}

        recent = df.tail(3)["modal_price"].mean()
        older = df.head(3)["modal_price"].mean()
        change = ((recent - older) / older) * 100 if older > 0 else 0

        if change > 3:
            direction = "up"
        elif change < -3:
            direction = "down"
        else:
            direction = "stable"

        data_points = []
        for _, row in df.iterrows():
            data_points.append({
                "date": row["date"].strftime("%Y-%m-%d"),
                "min_price": row["min_price"],
                "max_price": row["max_price"],
                "modal_price": row["modal_price"],
            })

        return {
            "crop": crop,
            "state": df["state"].iloc[0] if len(df) > 0 else "",
            "current_price": float(recent),
            "price_change_pct": round(change, 2),
            "trend_direction": direction,
            "data_points": data_points,
        }

    def get_volatility(self, crop: str) -> Dict:
        """Calculate price volatility for a crop."""
        if self._price_data.empty:
            return {"volatility_index": 0, "risk_level": "Low"}

        mask = self._price_data["commodity"].str.lower() == crop.lower()
        df = self._price_data[mask]
        if len(df) < 2:
            return {"volatility_index": 0, "risk_level": "Low"}

        prices = df["modal_price"]
        avg = prices.mean()
        std = prices.std()
        volatility = (std / avg) * 100 if avg > 0 else 0

        if volatility < 5:
            level = "Low"
        elif volatility < 15:
            level = "Medium"
        else:
            level = "High"

        return {
            "crop": crop,
            "volatility_index": round(volatility, 2),
            "risk_level": level,
            "avg_price": round(avg, 2),
            "std_dev": round(std, 2),
        }

    def get_top_movers(self, direction: str = "gainers") -> List[Dict]:
        """Get crops with highest price changes."""
        if self._price_data.empty:
            return []

        results = []
        for crop in self._price_data["commodity"].unique():
            trend = self.get_trend(crop)
            results.append({
                "crop": crop,
                "state": trend.get("state", ""),
                "current_price": trend.get("current_price", 0),
                "change_pct": trend.get("price_change_pct", 0),
            })

        results.sort(
            key=lambda x: x["change_pct"],
            reverse=(direction == "gainers"),
        )
        return results[:5]


_market_instance: Optional[MarketService] = None


def get_market_service() -> MarketService:
    global _market_instance
    if _market_instance is None:
        _market_instance = MarketService()
    return _market_instance
