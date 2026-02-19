"""
SmartAgri AI - Crop Recommendation Model Training
Trains a Random Forest Classifier to predict suitable crops based on soil and weather data.
"""
import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODEL_DIR = os.path.join(BASE_DIR, "server", "ml_models")


def train():
    os.makedirs(MODEL_DIR, exist_ok=True)

    print("=" * 60)
    print("🌾 Training Crop Recommendation Model")
    print("=" * 60)

    # Load processed data
    X_train = np.load(os.path.join(PROCESSED_DIR, "X_train_crop.npy"))
    X_test = np.load(os.path.join(PROCESSED_DIR, "X_test_crop.npy"))
    y_train = np.load(os.path.join(PROCESSED_DIR, "y_train_crop.npy"))
    y_test = np.load(os.path.join(PROCESSED_DIR, "y_test_crop.npy"))

    le_crop = joblib.load(os.path.join(PROCESSED_DIR, "label_encoder_crop.joblib"))

    print(f"  Training samples: {len(X_train)}")
    print(f"  Test samples:     {len(X_test)}")
    print(f"  Features:         {X_train.shape[1]}")
    print(f"  Classes:          {len(le_crop.classes_)}")
    print()

    # Train Random Forest
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    print("  🔄 Training Random Forest Classifier...")
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")

    print(f"\n  📊 Results:")
    print(f"     Accuracy:   {accuracy:.4f} ({accuracy*100:.1f}%)")
    print(f"     F1 Score:   {f1:.4f}")
    print()

    # Feature importance
    feature_names = ["N", "P", "K", "Temperature", "Humidity", "pH", "Rainfall"]
    importances = model.feature_importances_
    print("  📈 Feature Importance:")
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"     {name:12s}: {imp:.4f} {bar}")

    # Save model
    model_path = os.path.join(MODEL_DIR, "crop_recommender.joblib")
    joblib.dump(model, model_path)
    print(f"\n  ✅ Model saved to: {model_path}")

    # Also copy encoders to server for inference
    for f in ["label_encoder_crop.joblib", "scaler_crop.joblib"]:
        src = os.path.join(PROCESSED_DIR, f)
        dst = os.path.join(MODEL_DIR, f)
        joblib.dump(joblib.load(src), dst)
    print("  ✅ Encoders copied to server/ml_models/")

    return model, accuracy


if __name__ == "__main__":
    train()
