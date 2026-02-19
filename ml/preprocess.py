"""
SmartAgri AI - Data Preprocessing Pipeline
Cleans, encodes, and splits datasets for ML training.
"""
import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")


def ensure_dirs():
    os.makedirs(PROCESSED_DIR, exist_ok=True)


def preprocess_crop_recommendation():
    """Clean and prepare crop recommendation dataset."""
    print("📦 Processing crop recommendation dataset...")
    df = pd.read_csv(os.path.join(RAW_DIR, "crop_recommendation.csv"))

    # Check for missing values
    if df.isnull().sum().sum() > 0:
        print(f"  ⚠ Found {df.isnull().sum().sum()} missing values, filling with median")
        for col in df.select_dtypes(include=[np.number]).columns:
            df[col].fillna(df[col].median(), inplace=True)

    # Encode crop labels
    le_crop = LabelEncoder()
    df["label_encoded"] = le_crop.fit_transform(df["label"])

    # Feature columns
    feature_cols = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    X = df[feature_cols].values
    y = df["label_encoded"].values

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    # Save processed data
    np.save(os.path.join(PROCESSED_DIR, "X_train_crop.npy"), X_train)
    np.save(os.path.join(PROCESSED_DIR, "X_test_crop.npy"), X_test)
    np.save(os.path.join(PROCESSED_DIR, "y_train_crop.npy"), y_train)
    np.save(os.path.join(PROCESSED_DIR, "y_test_crop.npy"), y_test)

    # Save encoders and scaler
    joblib.dump(le_crop, os.path.join(PROCESSED_DIR, "label_encoder_crop.joblib"))
    joblib.dump(scaler, os.path.join(PROCESSED_DIR, "scaler_crop.joblib"))

    print(f"  ✅ Crop dataset: {len(df)} samples, {len(le_crop.classes_)} classes")
    print(f"     Classes: {list(le_crop.classes_)}")
    print(f"     Train: {len(X_train)}, Test: {len(X_test)}")
    return df


def preprocess_yield_data():
    """Clean and prepare yield prediction dataset."""
    print("📦 Processing yield dataset...")
    df = pd.read_csv(os.path.join(RAW_DIR, "crop_yield_india.csv"))

    # Encode categorical columns
    le_state = LabelEncoder()
    le_crop = LabelEncoder()
    le_season = LabelEncoder()

    df["state_encoded"] = le_state.fit_transform(df["state"])
    df["crop_encoded"] = le_crop.fit_transform(df["crop"])
    df["season_encoded"] = le_season.fit_transform(df["season"])

    feature_cols = ["state_encoded", "crop_encoded", "season_encoded", "area_hectares"]
    X = df[feature_cols].values
    y = df["yield_tonnes_per_hectare"].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    np.save(os.path.join(PROCESSED_DIR, "X_train_yield.npy"), X_train)
    np.save(os.path.join(PROCESSED_DIR, "X_test_yield.npy"), X_test)
    np.save(os.path.join(PROCESSED_DIR, "y_train_yield.npy"), y_train)
    np.save(os.path.join(PROCESSED_DIR, "y_test_yield.npy"), y_test)

    joblib.dump(le_state, os.path.join(PROCESSED_DIR, "label_encoder_state.joblib"))
    joblib.dump(le_crop, os.path.join(PROCESSED_DIR, "label_encoder_yield_crop.joblib"))
    joblib.dump(le_season, os.path.join(PROCESSED_DIR, "label_encoder_season.joblib"))
    joblib.dump(scaler, os.path.join(PROCESSED_DIR, "scaler_yield.joblib"))

    print(f"  ✅ Yield dataset: {len(df)} samples")
    print(f"     States: {len(le_state.classes_)}, Crops: {len(le_crop.classes_)}")
    print(f"     Train: {len(X_train)}, Test: {len(X_test)}")
    return df


def preprocess_price_data():
    """Clean and prepare market price dataset."""
    print("📦 Processing market price dataset...")
    df = pd.read_csv(os.path.join(RAW_DIR, "mandi_prices.csv"))

    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month
    df["week"] = df["date"].dt.isocalendar().week.astype(int)
    df["day_of_year"] = df["date"].dt.dayofyear

    le_commodity = LabelEncoder()
    le_state = LabelEncoder()

    df["commodity_encoded"] = le_commodity.fit_transform(df["commodity"])
    df["state_encoded"] = le_state.fit_transform(df["state"])

    feature_cols = ["commodity_encoded", "state_encoded", "month", "week", "min_price", "max_price"]
    X = df[feature_cols].values
    y = df["modal_price"].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    np.save(os.path.join(PROCESSED_DIR, "X_train_price.npy"), X_train)
    np.save(os.path.join(PROCESSED_DIR, "X_test_price.npy"), X_test)
    np.save(os.path.join(PROCESSED_DIR, "y_train_price.npy"), y_train)
    np.save(os.path.join(PROCESSED_DIR, "y_test_price.npy"), y_test)

    joblib.dump(le_commodity, os.path.join(PROCESSED_DIR, "label_encoder_commodity.joblib"))
    joblib.dump(le_state, os.path.join(PROCESSED_DIR, "label_encoder_price_state.joblib"))
    joblib.dump(scaler, os.path.join(PROCESSED_DIR, "scaler_price.joblib"))

    print(f"  ✅ Price dataset: {len(df)} samples")
    print(f"     Commodities: {list(le_commodity.classes_)}")
    print(f"     Train: {len(X_train)}, Test: {len(X_test)}")
    return df


if __name__ == "__main__":
    print("=" * 60)
    print("🌾 SmartAgri AI - Data Preprocessing Pipeline")
    print("=" * 60)
    ensure_dirs()
    preprocess_crop_recommendation()
    print()
    preprocess_yield_data()
    print()
    preprocess_price_data()
    print()
    print("✅ All datasets processed successfully!")
    print(f"   Output directory: {PROCESSED_DIR}")
