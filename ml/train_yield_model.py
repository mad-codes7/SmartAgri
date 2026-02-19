"""
SmartAgri AI - Yield Prediction Model Training
Trains a Gradient Boosting Regressor to predict crop yield per hectare.
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
    print("🌾 Training Yield Prediction Model")
    print("=" * 60)

    X_train = np.load(os.path.join(PROCESSED_DIR, "X_train_yield.npy"))
    X_test = np.load(os.path.join(PROCESSED_DIR, "X_test_yield.npy"))
    y_train = np.load(os.path.join(PROCESSED_DIR, "y_train_yield.npy"))
    y_test = np.load(os.path.join(PROCESSED_DIR, "y_test_yield.npy"))

    print(f"  Training samples: {len(X_train)}")
    print(f"  Test samples:     {len(X_test)}")
    print(f"  Features:         {X_train.shape[1]}")
    print()

    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        min_samples_split=5,
        min_samples_leaf=3,
        random_state=42,
    )
    print("  🔄 Training Gradient Boosting Regressor...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"\n  📊 Results:")
    print(f"     MAE:     {mae:.4f} tonnes/hectare")
    print(f"     RMSE:    {rmse:.4f}")
    print(f"     R² Score: {r2:.4f}")

    feature_names = ["State", "Crop", "Season", "Area"]
    importances = model.feature_importances_
    print("\n  📈 Feature Importance:")
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"     {name:12s}: {imp:.4f} {bar}")

    model_path = os.path.join(MODEL_DIR, "yield_predictor.joblib")
    joblib.dump(model, model_path)
    print(f"\n  ✅ Model saved to: {model_path}")

    for f in ["label_encoder_state.joblib", "label_encoder_yield_crop.joblib",
              "label_encoder_season.joblib", "scaler_yield.joblib"]:
        src = os.path.join(PROCESSED_DIR, f)
        dst = os.path.join(MODEL_DIR, f)
        joblib.dump(joblib.load(src), dst)
    print("  ✅ Encoders copied to server/ml_models/")

    return model, mae


if __name__ == "__main__":
    train()
