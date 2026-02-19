"""
SmartAgri AI - Price Forecasting Model Training
Trains a model to predict crop market prices based on historical data.
"""
import os
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODEL_DIR = os.path.join(BASE_DIR, "server", "ml_models")


def train():
    os.makedirs(MODEL_DIR, exist_ok=True)

    print("=" * 60)
    print("🌾 Training Price Forecasting Model")
    print("=" * 60)

    X_train = np.load(os.path.join(PROCESSED_DIR, "X_train_price.npy"))
    X_test = np.load(os.path.join(PROCESSED_DIR, "X_test_price.npy"))
    y_train = np.load(os.path.join(PROCESSED_DIR, "y_train_price.npy"))
    y_test = np.load(os.path.join(PROCESSED_DIR, "y_test_price.npy"))

    print(f"  Training samples: {len(X_train)}")
    print(f"  Test samples:     {len(X_test)}")
    print(f"  Features:         {X_train.shape[1]}")
    print()

    model = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.1,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
    )
    print("  🔄 Training Price Forecaster...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"\n  📊 Results:")
    print(f"     MAE:      ₹{mae:.2f}/quintal")
    print(f"     RMSE:     ₹{rmse:.2f}")
    print(f"     R² Score: {r2:.4f}")

    feature_names = ["Commodity", "State", "Month", "Week", "Min Price", "Max Price"]
    importances = model.feature_importances_
    print("\n  📈 Feature Importance:")
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"     {name:12s}: {imp:.4f} {bar}")

    model_path = os.path.join(MODEL_DIR, "price_forecaster.joblib")
    joblib.dump(model, model_path)
    print(f"\n  ✅ Model saved to: {model_path}")

    for f in ["label_encoder_commodity.joblib", "label_encoder_price_state.joblib", "scaler_price.joblib"]:
        src = os.path.join(PROCESSED_DIR, f)
        dst = os.path.join(MODEL_DIR, f)
        joblib.dump(joblib.load(src), dst)
    print("  ✅ Encoders copied to server/ml_models/")

    return model, mae


if __name__ == "__main__":
    train()
