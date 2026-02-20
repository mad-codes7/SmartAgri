"""
SmartAgri AI - Model Evaluation & Visualization
Generates ROC curves, confusion matrices, and regression diagnostics
for all 3 trained models.
"""
import os
import numpy as np
import joblib
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from sklearn.metrics import (
    accuracy_score, f1_score, classification_report,
    confusion_matrix, ConfusionMatrixDisplay,
    roc_curve, auc,
    mean_absolute_error, mean_squared_error, r2_score,
)
from sklearn.preprocessing import label_binarize

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODEL_DIR = os.path.join(BASE_DIR, "server", "ml_models")
OUTPUT_DIR = os.path.join(BASE_DIR, "ml", "evaluation_results")


def setup():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    plt.rcParams.update({
        "figure.dpi": 150,
        "font.size": 10,
        "axes.titlesize": 13,
        "axes.labelsize": 11,
    })


# ═══════════════════════════════════════════════════════════════
#  1. CROP RECOMMENDER  (Multi-class Classification)
# ═══════════════════════════════════════════════════════════════
def evaluate_crop_model():
    print("=" * 60)
    print("🌾 Evaluating Crop Recommendation Model")
    print("=" * 60)

    # Load data & model
    X_test = np.load(os.path.join(PROCESSED_DIR, "X_test_crop.npy"))
    y_test = np.load(os.path.join(PROCESSED_DIR, "y_test_crop.npy"))
    model = joblib.load(os.path.join(MODEL_DIR, "crop_recommender.joblib"))
    le = joblib.load(os.path.join(MODEL_DIR, "label_encoder_crop.joblib"))

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)
    classes = le.classes_
    n_classes = len(classes)

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    print(f"  Accuracy: {acc*100:.1f}%  |  F1: {f1:.4f}  |  Classes: {n_classes}")

    # ── Confusion Matrix ──────────────────────────────────────
    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(16, 14))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=classes)
    disp.plot(ax=ax, cmap="Blues", values_format="d", xticks_rotation=45)
    ax.set_title(f"Crop Recommender — Confusion Matrix\nAccuracy: {acc*100:.1f}%  |  F1: {f1:.4f}", fontweight="bold")
    plt.tight_layout()
    path_cm = os.path.join(OUTPUT_DIR, "crop_confusion_matrix.png")
    fig.savefig(path_cm)
    plt.close(fig)
    print(f"  ✅ Saved: {path_cm}")

    # ── ROC Curve (One-vs-Rest, micro/macro averaged) ─────────
    y_test_bin = label_binarize(y_test, classes=list(range(n_classes)))

    # Compute ROC for each class
    fpr, tpr, roc_auc = {}, {}, {}
    for i in range(n_classes):
        fpr[i], tpr[i], _ = roc_curve(y_test_bin[:, i], y_prob[:, i])
        roc_auc[i] = auc(fpr[i], tpr[i])

    # Micro-average
    fpr["micro"], tpr["micro"], _ = roc_curve(y_test_bin.ravel(), y_prob.ravel())
    roc_auc["micro"] = auc(fpr["micro"], tpr["micro"])

    # Macro-average
    all_fpr = np.unique(np.concatenate([fpr[i] for i in range(n_classes)]))
    mean_tpr = np.zeros_like(all_fpr)
    for i in range(n_classes):
        mean_tpr += np.interp(all_fpr, fpr[i], tpr[i])
    mean_tpr /= n_classes
    fpr["macro"] = all_fpr
    tpr["macro"] = mean_tpr
    roc_auc["macro"] = auc(fpr["macro"], tpr["macro"])

    # Plot
    fig, ax = plt.subplots(figsize=(12, 10))

    # Plot each class curve with transparency
    cmap = plt.cm.get_cmap("tab20", n_classes)
    for i in range(n_classes):
        ax.plot(fpr[i], tpr[i], color=cmap(i), alpha=0.3, linewidth=1)

    # Highlight the averages
    ax.plot(fpr["micro"], tpr["micro"],
            label=f"Micro-avg ROC (AUC = {roc_auc['micro']:.4f})",
            color="deeppink", linewidth=2.5, linestyle="--")
    ax.plot(fpr["macro"], tpr["macro"],
            label=f"Macro-avg ROC (AUC = {roc_auc['macro']:.4f})",
            color="navy", linewidth=2.5, linestyle="--")

    ax.plot([0, 1], [0, 1], "k--", alpha=0.3, linewidth=1)
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([-0.02, 1.02])
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title(f"Crop Recommender — ROC Curve (One-vs-Rest)\n{n_classes} Classes  |  Micro AUC: {roc_auc['micro']:.4f}  |  Macro AUC: {roc_auc['macro']:.4f}", fontweight="bold")
    ax.legend(loc="lower right", fontsize=10)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    path_roc = os.path.join(OUTPUT_DIR, "crop_roc_curve.png")
    fig.savefig(path_roc)
    plt.close(fig)
    print(f"  ✅ Saved: {path_roc}")

    # ── Per-class AUC bar chart ───────────────────────────────
    fig, ax = plt.subplots(figsize=(14, 6))
    aucs = [roc_auc[i] for i in range(n_classes)]
    colors = ["#22c55e" if a >= 0.95 else "#f59e0b" if a >= 0.85 else "#ef4444" for a in aucs]
    bars = ax.barh(range(n_classes), aucs, color=colors, edgecolor="white", height=0.7)
    ax.set_yticks(range(n_classes))
    ax.set_yticklabels(classes, fontsize=9)
    ax.set_xlabel("AUC Score")
    ax.set_title("Crop Recommender — Per-Class AUC Scores", fontweight="bold")
    ax.set_xlim([min(0.8, min(aucs) - 0.05), 1.02])
    ax.axvline(x=0.95, color="gray", linestyle="--", alpha=0.5, label="0.95 threshold")
    ax.legend()
    ax.grid(True, alpha=0.3, axis="x")
    for bar, v in zip(bars, aucs):
        ax.text(v + 0.003, bar.get_y() + bar.get_height()/2, f"{v:.3f}", va="center", fontsize=8)
    plt.tight_layout()
    path_auc = os.path.join(OUTPUT_DIR, "crop_per_class_auc.png")
    fig.savefig(path_auc)
    plt.close(fig)
    print(f"  ✅ Saved: {path_auc}")

    # Save classification report
    report = classification_report(y_test, y_pred, target_names=classes)
    report_path = os.path.join(OUTPUT_DIR, "crop_classification_report.txt")
    with open(report_path, "w") as f:
        f.write(f"Crop Recommendation Model - Classification Report\n")
        f.write(f"{'='*60}\n")
        f.write(f"Accuracy: {acc*100:.1f}% | F1 (weighted): {f1:.4f}\n")
        f.write(f"Classes: {n_classes} | Test samples: {len(y_test)}\n")
        f.write(f"{'='*60}\n\n")
        f.write(report)
    print(f"  ✅ Saved: {report_path}")


# ═══════════════════════════════════════════════════════════════
#  2. YIELD PREDICTOR  (Regression)
# ═══════════════════════════════════════════════════════════════
def evaluate_yield_model():
    print("\n" + "=" * 60)
    print("🌾 Evaluating Yield Prediction Model")
    print("=" * 60)

    X_test = np.load(os.path.join(PROCESSED_DIR, "X_test_yield.npy"))
    y_test = np.load(os.path.join(PROCESSED_DIR, "y_test_yield.npy"))
    model = joblib.load(os.path.join(MODEL_DIR, "yield_predictor.joblib"))

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    print(f"  MAE: {mae:.4f}  |  RMSE: {rmse:.4f}  |  R²: {r2:.4f}")

    # ── Actual vs Predicted ───────────────────────────────────
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    # Scatter plot
    ax = axes[0]
    ax.scatter(y_test, y_pred, alpha=0.6, s=50, c="#3b82f6", edgecolors="white", linewidth=0.5)
    lims = [min(y_test.min(), y_pred.min()) - 1, max(y_test.max(), y_pred.max()) + 1]
    ax.plot(lims, lims, "r--", linewidth=2, label="Perfect Prediction")
    ax.set_xlim(lims)
    ax.set_ylim(lims)
    ax.set_xlabel("Actual Yield (tonnes/ha)")
    ax.set_ylabel("Predicted Yield (tonnes/ha)")
    ax.set_title("Actual vs Predicted", fontweight="bold")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # Residuals
    ax = axes[1]
    residuals = y_test - y_pred
    ax.scatter(y_pred, residuals, alpha=0.6, s=50, c="#f59e0b", edgecolors="white", linewidth=0.5)
    ax.axhline(y=0, color="red", linewidth=2, linestyle="--")
    ax.set_xlabel("Predicted Yield (tonnes/ha)")
    ax.set_ylabel("Residual (Actual - Predicted)")
    ax.set_title("Residual Plot", fontweight="bold")
    ax.grid(True, alpha=0.3)

    fig.suptitle(f"Yield Predictor — Regression Diagnostics\nMAE: {mae:.4f}  |  RMSE: {rmse:.4f}  |  R²: {r2:.4f}", fontweight="bold", fontsize=14)
    plt.tight_layout()
    path_yield = os.path.join(OUTPUT_DIR, "yield_regression_diagnostics.png")
    fig.savefig(path_yield)
    plt.close(fig)
    print(f"  ✅ Saved: {path_yield}")

    # ── Confusion Matrix (binned into yield categories) ───────
    def categorize_yield(y):
        cats = []
        for v in y:
            if v < 2:
                cats.append("Low (<2)")
            elif v < 5:
                cats.append("Medium (2-5)")
            elif v < 15:
                cats.append("High (5-15)")
            elif v < 40:
                cats.append("Very High (15-40)")
            else:
                cats.append("Extreme (40+)")
        return np.array(cats)

    y_test_cat = categorize_yield(y_test)
    y_pred_cat = categorize_yield(y_pred)
    labels = ["Low (<2)", "Medium (2-5)", "High (5-15)", "Very High (15-40)", "Extreme (40+)"]
    # Only use labels that appear in data
    present_labels = sorted(set(y_test_cat) | set(y_pred_cat), key=lambda x: labels.index(x) if x in labels else 99)

    cm = confusion_matrix(y_test_cat, y_pred_cat, labels=present_labels)
    fig, ax = plt.subplots(figsize=(10, 8))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=present_labels)
    disp.plot(ax=ax, cmap="Greens", values_format="d")
    ax.set_title(f"Yield Predictor — Confusion Matrix (Binned Categories)\nR²: {r2:.4f}  |  MAE: {mae:.4f} t/ha", fontweight="bold")
    plt.tight_layout()
    path_yield_cm = os.path.join(OUTPUT_DIR, "yield_confusion_matrix.png")
    fig.savefig(path_yield_cm)
    plt.close(fig)
    print(f"  ✅ Saved: {path_yield_cm}")

    # Save metrics report
    report_path = os.path.join(OUTPUT_DIR, "yield_evaluation_report.txt")
    with open(report_path, "w") as f:
        f.write(f"Yield Prediction Model - Evaluation Report\n")
        f.write(f"{'='*60}\n")
        f.write(f"MAE:  {mae:.4f} tonnes/ha\n")
        f.write(f"RMSE: {rmse:.4f} tonnes/ha\n")
        f.write(f"R²:   {r2:.4f}\n")
        f.write(f"Test samples: {len(y_test)}\n")
        f.write(f"{'='*60}\n")
    print(f"  ✅ Saved: {report_path}")


# ═══════════════════════════════════════════════════════════════
#  3. PRICE FORECASTER  (Regression)
# ═══════════════════════════════════════════════════════════════
def evaluate_price_model():
    print("\n" + "=" * 60)
    print("🌾 Evaluating Price Forecasting Model")
    print("=" * 60)

    X_test = np.load(os.path.join(PROCESSED_DIR, "X_test_price.npy"))
    y_test = np.load(os.path.join(PROCESSED_DIR, "y_test_price.npy"))
    model = joblib.load(os.path.join(MODEL_DIR, "price_forecaster.joblib"))

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    print(f"  MAE: ₹{mae:.2f}  |  RMSE: ₹{rmse:.2f}  |  R²: {r2:.4f}")

    # ── Actual vs Predicted ───────────────────────────────────
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    ax = axes[0]
    ax.scatter(y_test, y_pred, alpha=0.5, s=40, c="#8b5cf6", edgecolors="white", linewidth=0.5)
    lims = [min(y_test.min(), y_pred.min()) - 100, max(y_test.max(), y_pred.max()) + 100]
    ax.plot(lims, lims, "r--", linewidth=2, label="Perfect Prediction")
    ax.set_xlim(lims)
    ax.set_ylim(lims)
    ax.set_xlabel("Actual Price (₹/quintal)")
    ax.set_ylabel("Predicted Price (₹/quintal)")
    ax.set_title("Actual vs Predicted", fontweight="bold")
    ax.legend()
    ax.grid(True, alpha=0.3)

    ax = axes[1]
    residuals = y_test - y_pred
    ax.scatter(y_pred, residuals, alpha=0.5, s=40, c="#ec4899", edgecolors="white", linewidth=0.5)
    ax.axhline(y=0, color="red", linewidth=2, linestyle="--")
    ax.set_xlabel("Predicted Price (₹/quintal)")
    ax.set_ylabel("Residual (Actual - Predicted)")
    ax.set_title("Residual Plot", fontweight="bold")
    ax.grid(True, alpha=0.3)

    fig.suptitle(f"Price Forecaster — Regression Diagnostics\nMAE: ₹{mae:.2f}  |  RMSE: ₹{rmse:.2f}  |  R²: {r2:.4f}", fontweight="bold", fontsize=14)
    plt.tight_layout()
    path_price = os.path.join(OUTPUT_DIR, "price_regression_diagnostics.png")
    fig.savefig(path_price)
    plt.close(fig)
    print(f"  ✅ Saved: {path_price}")

    # ── Confusion Matrix (binned into price tiers) ────────────
    def categorize_price(y):
        cats = []
        for v in y:
            if v < 500:
                cats.append("Very Low (<500)")
            elif v < 2000:
                cats.append("Low (500-2K)")
            elif v < 4000:
                cats.append("Medium (2K-4K)")
            elif v < 6000:
                cats.append("High (4K-6K)")
            elif v < 8000:
                cats.append("Very High (6K-8K)")
            else:
                cats.append("Premium (8K+)")
        return np.array(cats)

    y_test_cat = categorize_price(y_test)
    y_pred_cat = categorize_price(y_pred)
    labels = ["Very Low (<500)", "Low (500-2K)", "Medium (2K-4K)", "High (4K-6K)", "Very High (6K-8K)", "Premium (8K+)"]
    present_labels = sorted(set(y_test_cat) | set(y_pred_cat), key=lambda x: labels.index(x) if x in labels else 99)

    cm = confusion_matrix(y_test_cat, y_pred_cat, labels=present_labels)
    fig, ax = plt.subplots(figsize=(10, 8))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=present_labels)
    disp.plot(ax=ax, cmap="Purples", values_format="d")
    ax.set_title(f"Price Forecaster — Confusion Matrix (Price Tiers)\nR²: {r2:.4f}  |  MAE: ₹{mae:.2f}/quintal", fontweight="bold")
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    path_price_cm = os.path.join(OUTPUT_DIR, "price_confusion_matrix.png")
    fig.savefig(path_price_cm)
    plt.close(fig)
    print(f"  ✅ Saved: {path_price_cm}")

    # ── Error Distribution Histogram ──────────────────────────
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.hist(residuals, bins=30, color="#8b5cf6", edgecolor="white", alpha=0.8)
    ax.axvline(x=0, color="red", linewidth=2, linestyle="--")
    ax.axvline(x=mae, color="orange", linewidth=1.5, linestyle="--", label=f"MAE: ₹{mae:.2f}")
    ax.axvline(x=-mae, color="orange", linewidth=1.5, linestyle="--")
    ax.set_xlabel("Prediction Error (₹/quintal)")
    ax.set_ylabel("Frequency")
    ax.set_title("Price Forecaster — Error Distribution", fontweight="bold")
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    path_err = os.path.join(OUTPUT_DIR, "price_error_distribution.png")
    fig.savefig(path_err)
    plt.close(fig)
    print(f"  ✅ Saved: {path_err}")

    # Save metrics report
    report_path = os.path.join(OUTPUT_DIR, "price_evaluation_report.txt")
    with open(report_path, "w") as f:
        f.write(f"Price Forecasting Model - Evaluation Report\n")
        f.write(f"{'='*60}\n")
        f.write(f"MAE:  Rs {mae:.2f}/quintal\n")
        f.write(f"RMSE: Rs {rmse:.2f}/quintal\n")
        f.write(f"R²:   {r2:.4f}\n")
        f.write(f"Test samples: {len(y_test)}\n")
        f.write(f"{'='*60}\n")
    print(f"  ✅ Saved: {report_path}")


# ═══════════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("🌾 SmartAgri AI - Model Evaluation & Visualization")
    print("=" * 60)
    setup()

    evaluate_crop_model()
    evaluate_yield_model()
    evaluate_price_model()

    print("\n" + "=" * 60)
    print(f"✅ All evaluation charts saved to: {OUTPUT_DIR}")
    print("=" * 60)
