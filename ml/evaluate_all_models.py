"""
SmartAgri AI — Comprehensive ML Model Evaluation Dashboard
Generates professional charts and accuracy reports for all 3 models:
  1. Crop Recommendation (Classification)
  2. Price Forecasting (Regression)
  3. Yield Prediction (Regression)
"""
import os
import numpy as np
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from matplotlib.gridspec import GridSpec
from sklearn.metrics import (
    accuracy_score, f1_score, classification_report, confusion_matrix,
    mean_absolute_error, mean_squared_error, r2_score,
    precision_score, recall_score,
)
import warnings
warnings.filterwarnings("ignore")

# ── Paths ────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODEL_DIR = os.path.join(BASE_DIR, "server", "ml_models")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "evaluation_results")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Colour Palette (dark premium) ────────────────────────────────────
BG_DARK      = "#0f172a"
BG_CARD      = "#1e293b"
BG_LIGHTER   = "#334155"
GREEN_MAIN   = "#22c55e"
GREEN_LIGHT  = "#4ade80"
GREEN_DIM    = "#166534"
BLUE_MAIN    = "#3b82f6"
BLUE_LIGHT   = "#60a5fa"
AMBER_MAIN   = "#f59e0b"
AMBER_LIGHT  = "#fbbf24"
RED_MAIN     = "#ef4444"
TEXT_WHITE    = "#f1f5f9"
TEXT_MUTED    = "#94a3b8"
TEXT_DIM      = "#64748b"
GRID_COLOR    = "#1e293b"

def _dark_style():
    """Apply premium dark theme globally."""
    plt.rcParams.update({
        "figure.facecolor": BG_DARK,
        "axes.facecolor": BG_CARD,
        "axes.edgecolor": BG_LIGHTER,
        "axes.labelcolor": TEXT_MUTED,
        "text.color": TEXT_WHITE,
        "xtick.color": TEXT_DIM,
        "ytick.color": TEXT_DIM,
        "grid.color": BG_LIGHTER,
        "grid.alpha": 0.3,
        "font.family": "sans-serif",
        "font.size": 11,
        "axes.titlesize": 14,
        "axes.titleweight": "bold",
    })


# =====================================================================
# 1. CROP RECOMMENDATION MODEL
# =====================================================================
def evaluate_crop_model():
    print("\n" + "=" * 70)
    print("  🌾 CROP RECOMMENDATION MODEL — Evaluation")
    print("=" * 70)

    X_test = np.load(os.path.join(PROCESSED_DIR, "X_test_crop.npy"))
    y_test = np.load(os.path.join(PROCESSED_DIR, "y_test_crop.npy"))
    model = joblib.load(os.path.join(MODEL_DIR, "crop_recommender.joblib"))
    le = joblib.load(os.path.join(MODEL_DIR, "label_encoder_crop.joblib"))

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    prec = precision_score(y_test, y_pred, average="weighted")
    rec = recall_score(y_test, y_pred, average="weighted")

    print(f"  Accuracy:   {acc*100:.2f}%")
    print(f"  F1 Score:   {f1*100:.2f}%")
    print(f"  Precision:  {prec*100:.2f}%")
    print(f"  Recall:     {rec*100:.2f}%")

    # ── Figure: 2-panel (confusion matrix + metrics summary) ─────────
    _dark_style()
    fig = plt.figure(figsize=(18, 9))
    fig.suptitle("SmartAgri AI — Crop Recommendation Model", fontsize=20, fontweight="bold",
                 color=GREEN_LIGHT, y=0.98)

    gs = GridSpec(1, 2, width_ratios=[1.4, 1], wspace=0.25)

    # ── Panel 1: Confusion Matrix ────────────────────────────────────
    ax1 = fig.add_subplot(gs[0])
    cm = confusion_matrix(y_test, y_pred)
    classes = le.classes_

    im = ax1.imshow(cm, cmap="Greens", aspect="auto")
    ax1.set_xticks(range(len(classes)))
    ax1.set_yticks(range(len(classes)))
    ax1.set_xticklabels(classes, rotation=45, ha="right", fontsize=7)
    ax1.set_yticklabels(classes, fontsize=7)
    ax1.set_xlabel("Predicted", fontsize=11, color=TEXT_MUTED)
    ax1.set_ylabel("Actual", fontsize=11, color=TEXT_MUTED)
    ax1.set_title("Confusion Matrix", fontsize=14, color=TEXT_WHITE, pad=10)

    # Annotate cells
    for i in range(len(classes)):
        for j in range(len(classes)):
            val = cm[i, j]
            if val > 0:
                ax1.text(j, i, str(val), ha="center", va="center",
                         fontsize=6, fontweight="bold",
                         color="white" if val > cm.max() * 0.5 else GREEN_LIGHT)

    # ── Panel 2: Big metrics cards ───────────────────────────────────
    ax2 = fig.add_subplot(gs[1])
    ax2.axis("off")

    metrics = [
        ("ACCURACY", f"{acc*100:.1f}%", GREEN_MAIN, "Correct predictions out of total"),
        ("F1 SCORE", f"{f1*100:.1f}%", BLUE_MAIN, "Harmonic mean of precision & recall"),
        ("PRECISION", f"{prec*100:.1f}%", AMBER_MAIN, "True positives / predicted positives"),
        ("RECALL", f"{rec*100:.1f}%", "#a855f7", "True positives / actual positives"),
    ]

    for i, (label, value, color, desc) in enumerate(metrics):
        y_pos = 0.88 - i * 0.23
        # Card background
        card = plt.Rectangle((0.02, y_pos - 0.06), 0.96, 0.20,
                              transform=ax2.transAxes, facecolor=BG_LIGHTER,
                              edgecolor=color, linewidth=2, alpha=0.8,
                              zorder=2, clip_on=False)
        card.set_joinstyle("round")
        ax2.add_patch(card)
        ax2.text(0.08, y_pos + 0.06, label, transform=ax2.transAxes,
                 fontsize=10, fontweight="bold", color=TEXT_DIM, va="center")
        ax2.text(0.85, y_pos + 0.06, value, transform=ax2.transAxes,
                 fontsize=26, fontweight="900", color=color, ha="right", va="center")
        ax2.text(0.08, y_pos - 0.02, desc, transform=ax2.transAxes,
                 fontsize=8, color=TEXT_DIM, va="center")

    # Model info
    ax2.text(0.5, 0.01, f"Random Forest · {len(le.classes_)} crop classes · {len(X_test)} test samples",
             transform=ax2.transAxes, fontsize=9, color=TEXT_DIM, ha="center")

    fig.savefig(os.path.join(OUTPUT_DIR, "crop_evaluation_dashboard.png"),
                dpi=200, bbox_inches="tight", facecolor=BG_DARK)
    plt.close(fig)
    print(f"  ✅ Saved: crop_evaluation_dashboard.png")

    return {"accuracy": acc, "f1": f1, "precision": prec, "recall": rec}


# =====================================================================
# 2. PRICE FORECASTING MODEL
# =====================================================================
def evaluate_price_model():
    print("\n" + "=" * 70)
    print("  💰 PRICE FORECASTING MODEL — Evaluation")
    print("=" * 70)

    X_test = np.load(os.path.join(PROCESSED_DIR, "X_test_price.npy"))
    y_test = np.load(os.path.join(PROCESSED_DIR, "y_test_price.npy"))
    model = joblib.load(os.path.join(MODEL_DIR, "price_forecaster.joblib"))

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    # Percentage accuracy: MAPE-based
    # Avoid division by zero
    mask = y_test > 0
    mape = np.mean(np.abs((y_test[mask] - y_pred[mask]) / y_test[mask])) * 100
    pct_accuracy = 100 - mape

    print(f"  R² Score:        {r2:.4f} ({r2*100:.2f}%)")
    print(f"  MAE:             ₹{mae:.2f}/quintal")
    print(f"  RMSE:            ₹{rmse:.2f}/quintal")
    print(f"  MAPE:            {mape:.2f}%")
    print(f"  Accuracy (100-MAPE): {pct_accuracy:.2f}%")

    _dark_style()
    fig = plt.figure(figsize=(20, 10))
    fig.suptitle("SmartAgri AI — Price Forecasting Model", fontsize=20, fontweight="bold",
                 color=AMBER_LIGHT, y=0.98)

    gs = GridSpec(2, 3, hspace=0.35, wspace=0.3)

    # ── Panel 1: Actual vs Predicted (scatter) ───────────────────────
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.scatter(y_test, y_pred, c=GREEN_MAIN, alpha=0.4, s=20, edgecolors="none")
    lims = [min(y_test.min(), y_pred.min()) - 100, max(y_test.max(), y_pred.max()) + 100]
    ax1.plot(lims, lims, "--", color=RED_MAIN, linewidth=2, label="Perfect fit")
    ax1.set_xlim(lims)
    ax1.set_ylim(lims)
    ax1.set_xlabel("Actual Price (₹/q)")
    ax1.set_ylabel("Predicted Price (₹/q)")
    ax1.set_title("Actual vs Predicted", color=TEXT_WHITE)
    ax1.legend(loc="upper left", fontsize=9, facecolor=BG_CARD, edgecolor=BG_LIGHTER)
    ax1.grid(True, alpha=0.2)

    # ── Panel 2: Residuals ───────────────────────────────────────────
    ax2 = fig.add_subplot(gs[0, 1])
    residuals = y_test - y_pred
    ax2.scatter(y_pred, residuals, c=BLUE_MAIN, alpha=0.4, s=20, edgecolors="none")
    ax2.axhline(0, color=RED_MAIN, linewidth=2, linestyle="--")
    ax2.set_xlabel("Predicted Price (₹/q)")
    ax2.set_ylabel("Residual (₹)")
    ax2.set_title("Residual Analysis", color=TEXT_WHITE)
    ax2.grid(True, alpha=0.2)

    # ── Panel 3: Error Distribution ──────────────────────────────────
    ax3 = fig.add_subplot(gs[0, 2])
    ax3.hist(residuals, bins=40, color=GREEN_MAIN, alpha=0.7, edgecolor=GREEN_DIM)
    ax3.axvline(0, color=RED_MAIN, linewidth=2, linestyle="--")
    ax3.set_xlabel("Prediction Error (₹)")
    ax3.set_ylabel("Frequency")
    ax3.set_title("Error Distribution", color=TEXT_WHITE)
    ax3.grid(True, alpha=0.2)

    # ── Panel 4: Feature Importance ──────────────────────────────────
    ax4 = fig.add_subplot(gs[1, 0])
    feature_names = ["Commodity", "State", "Month", "Week", "Min Price", "Max Price"]
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)
    colors = [GREEN_MAIN if imp > 0.1 else BLUE_MAIN for imp in importances[sorted_idx]]
    ax4.barh([feature_names[i] for i in sorted_idx], importances[sorted_idx],
             color=colors, edgecolor="none", height=0.6)
    ax4.set_xlabel("Importance")
    ax4.set_title("Feature Importance", color=TEXT_WHITE)
    ax4.grid(True, axis="x", alpha=0.2)

    # ── Panel 5-6: Big Metrics Cards ─────────────────────────────────
    ax5 = fig.add_subplot(gs[1, 1:])
    ax5.axis("off")

    cards = [
        ("ACCURACY", f"{pct_accuracy:.1f}%", GREEN_MAIN, "100% − MAPE (Mean Absolute % Error)"),
        ("R² SCORE", f"{r2*100:.2f}%", BLUE_MAIN, "Variance explained by the model"),
        ("MAE", f"₹{mae:.2f}/q", AMBER_MAIN, "Average absolute prediction error"),
        ("RMSE", f"₹{rmse:.2f}/q", "#a855f7", "Root mean squared error"),
    ]

    for i, (label, value, color, desc) in enumerate(cards):
        row, col = divmod(i, 2)
        x_start = 0.02 + col * 0.50
        y_pos = 0.70 - row * 0.45

        card = plt.Rectangle((x_start, y_pos - 0.08), 0.46, 0.38,
                              transform=ax5.transAxes, facecolor=BG_LIGHTER,
                              edgecolor=color, linewidth=2.5, alpha=0.85,
                              zorder=2, clip_on=False)
        card.set_joinstyle("round")
        ax5.add_patch(card)
        ax5.text(x_start + 0.23, y_pos + 0.18, value, transform=ax5.transAxes,
                 fontsize=32, fontweight="900", color=color, ha="center", va="center")
        ax5.text(x_start + 0.23, y_pos + 0.03, label, transform=ax5.transAxes,
                 fontsize=11, fontweight="bold", color=TEXT_MUTED, ha="center", va="center")
        ax5.text(x_start + 0.23, y_pos - 0.05, desc, transform=ax5.transAxes,
                 fontsize=8, color=TEXT_DIM, ha="center", va="center")

    fig.savefig(os.path.join(OUTPUT_DIR, "price_evaluation_dashboard.png"),
                dpi=200, bbox_inches="tight", facecolor=BG_DARK)
    plt.close(fig)
    print(f"  ✅ Saved: price_evaluation_dashboard.png")

    return {"r2": r2, "mae": mae, "rmse": rmse, "mape": mape, "accuracy_pct": pct_accuracy}


# =====================================================================
# 3. YIELD PREDICTION MODEL
# =====================================================================
def evaluate_yield_model():
    print("\n" + "=" * 70)
    print("  📈 YIELD PREDICTION MODEL — Evaluation")
    print("=" * 70)

    X_test = np.load(os.path.join(PROCESSED_DIR, "X_test_yield.npy"))
    y_test = np.load(os.path.join(PROCESSED_DIR, "y_test_yield.npy"))
    model = joblib.load(os.path.join(MODEL_DIR, "yield_predictor.joblib"))

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    mask = y_test > 0
    mape = np.mean(np.abs((y_test[mask] - y_pred[mask]) / y_test[mask])) * 100
    pct_accuracy = 100 - mape

    print(f"  R² Score:        {r2:.4f} ({r2*100:.2f}%)")
    print(f"  MAE:             {mae:.4f} tonnes/ha")
    print(f"  RMSE:            {rmse:.4f} tonnes/ha")
    print(f"  MAPE:            {mape:.2f}%")
    print(f"  Accuracy (100-MAPE): {pct_accuracy:.2f}%")

    _dark_style()
    fig = plt.figure(figsize=(18, 8))
    fig.suptitle("SmartAgri AI — Yield Prediction Model", fontsize=20, fontweight="bold",
                 color=BLUE_LIGHT, y=0.98)

    gs = GridSpec(1, 3, wspace=0.3)

    # ── Panel 1: Actual vs Predicted ─────────────────────────────────
    ax1 = fig.add_subplot(gs[0])
    ax1.scatter(y_test, y_pred, c=BLUE_MAIN, alpha=0.45, s=25, edgecolors="none")
    lims = [min(y_test.min(), y_pred.min()) - 1, max(y_test.max(), y_pred.max()) + 1]
    ax1.plot(lims, lims, "--", color=RED_MAIN, linewidth=2, label="Perfect fit")
    ax1.set_xlim(lims)
    ax1.set_ylim(lims)
    ax1.set_xlabel("Actual Yield (tonnes/ha)")
    ax1.set_ylabel("Predicted Yield (tonnes/ha)")
    ax1.set_title("Actual vs Predicted", color=TEXT_WHITE)
    ax1.legend(loc="upper left", fontsize=9, facecolor=BG_CARD, edgecolor=BG_LIGHTER)
    ax1.grid(True, alpha=0.2)

    # ── Panel 2: Feature Importance ──────────────────────────────────
    ax2 = fig.add_subplot(gs[1])
    feature_names = ["State", "Crop", "Season", "Area"]
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)
    colors = [BLUE_MAIN if imp > 0.1 else AMBER_MAIN for imp in importances[sorted_idx]]
    ax2.barh([feature_names[i] for i in sorted_idx], importances[sorted_idx],
             color=colors, edgecolor="none", height=0.5)
    ax2.set_xlabel("Importance")
    ax2.set_title("Feature Importance", color=TEXT_WHITE)
    ax2.grid(True, axis="x", alpha=0.2)

    # ── Panel 3: Metrics Cards ───────────────────────────────────────
    ax3 = fig.add_subplot(gs[2])
    ax3.axis("off")

    cards = [
        ("ACCURACY", f"{pct_accuracy:.1f}%", GREEN_MAIN),
        ("R² SCORE", f"{r2*100:.2f}%", BLUE_MAIN),
        ("MAE", f"{mae:.2f} t/ha", AMBER_MAIN),
        ("RMSE", f"{rmse:.2f} t/ha", "#a855f7"),
    ]

    for i, (label, value, color) in enumerate(cards):
        y_pos = 0.85 - i * 0.22
        card = plt.Rectangle((0.02, y_pos - 0.06), 0.96, 0.19,
                              transform=ax3.transAxes, facecolor=BG_LIGHTER,
                              edgecolor=color, linewidth=2, alpha=0.8,
                              zorder=2, clip_on=False)
        card.set_joinstyle("round")
        ax3.add_patch(card)
        ax3.text(0.08, y_pos + 0.04, label, transform=ax3.transAxes,
                 fontsize=10, fontweight="bold", color=TEXT_DIM, va="center")
        ax3.text(0.88, y_pos + 0.04, value, transform=ax3.transAxes,
                 fontsize=24, fontweight="900", color=color, ha="right", va="center")

    ax3.text(0.5, 0.01, f"Gradient Boosting · {len(X_test)} test samples",
             transform=ax3.transAxes, fontsize=9, color=TEXT_DIM, ha="center")

    fig.savefig(os.path.join(OUTPUT_DIR, "yield_evaluation_dashboard.png"),
                dpi=200, bbox_inches="tight", facecolor=BG_DARK)
    plt.close(fig)
    print(f"  ✅ Saved: yield_evaluation_dashboard.png")

    return {"r2": r2, "mae": mae, "rmse": rmse, "accuracy_pct": pct_accuracy}


# =====================================================================
# 4. COMBINED SUMMARY DASHBOARD
# =====================================================================
def generate_summary(crop_metrics, price_metrics, yield_metrics):
    print("\n" + "=" * 70)
    print("  📊 GENERATING COMBINED SUMMARY DASHBOARD")
    print("=" * 70)

    _dark_style()
    fig = plt.figure(figsize=(20, 11))
    fig.suptitle("SmartAgri AI — ML Model Performance Summary",
                 fontsize=24, fontweight="bold", color=GREEN_LIGHT, y=0.97)
    fig.text(0.5, 0.935, "3 Production Models  •  Agriculture Decision Support System",
             ha="center", fontsize=12, color=TEXT_DIM)

    # 3-column layout: one per model
    gs = GridSpec(3, 3, hspace=0.45, wspace=0.35,
                  left=0.06, right=0.94, top=0.90, bottom=0.06)

    models = [
        {
            "name": "🌾 Crop Recommendation",
            "type": "Classification",
            "algo": "Random Forest",
            "color": GREEN_MAIN,
            "color_light": GREEN_LIGHT,
            "metrics": [
                ("Accuracy",  f"{crop_metrics['accuracy']*100:.1f}%"),
                ("F1 Score",  f"{crop_metrics['f1']*100:.1f}%"),
                ("Precision", f"{crop_metrics['precision']*100:.1f}%"),
                ("Recall",    f"{crop_metrics['recall']*100:.1f}%"),
            ],
            "main_value": f"{crop_metrics['accuracy']*100:.1f}%",
            "main_label": "ACCURACY",
        },
        {
            "name": "💰 Price Forecasting",
            "type": "Regression",
            "algo": "Gradient Boosting",
            "color": AMBER_MAIN,
            "color_light": AMBER_LIGHT,
            "metrics": [
                ("Accuracy",  f"{price_metrics['accuracy_pct']:.1f}%"),
                ("R² Score",  f"{price_metrics['r2']*100:.2f}%"),
                ("MAE",       f"₹{price_metrics['mae']:.2f}/q"),
                ("RMSE",      f"₹{price_metrics['rmse']:.2f}/q"),
            ],
            "main_value": f"{price_metrics['accuracy_pct']:.1f}%",
            "main_label": "ACCURACY",
        },
        {
            "name": "📈 Yield Prediction",
            "type": "Regression",
            "algo": "Gradient Boosting",
            "color": BLUE_MAIN,
            "color_light": BLUE_LIGHT,
            "metrics": [
                ("Accuracy",  f"{yield_metrics['accuracy_pct']:.1f}%"),
                ("R² Score",  f"{yield_metrics['r2']*100:.2f}%"),
                ("MAE",       f"{yield_metrics['mae']:.2f} t/ha"),
                ("RMSE",      f"{yield_metrics['rmse']:.2f} t/ha"),
            ],
            "main_value": f"{yield_metrics['accuracy_pct']:.1f}%",
            "main_label": "ACCURACY",
        },
    ]

    for col, m in enumerate(models):
        # ── Row 0: Model header card ─────────────────────────────────
        ax = fig.add_subplot(gs[0, col])
        ax.axis("off")

        # Big accuracy ring (simulated)
        ax.text(0.5, 0.72, m["main_value"], transform=ax.transAxes,
                fontsize=42, fontweight="900", color=m["color"],
                ha="center", va="center")
        ax.text(0.5, 0.40, m["main_label"], transform=ax.transAxes,
                fontsize=12, fontweight="bold", color=TEXT_MUTED, ha="center", va="center")
        ax.text(0.5, 0.18, m["name"], transform=ax.transAxes,
                fontsize=13, fontweight="bold", color=TEXT_WHITE, ha="center", va="center")
        ax.text(0.5, 0.04, f"{m['algo']}  •  {m['type']}", transform=ax.transAxes,
                fontsize=9, color=TEXT_DIM, ha="center", va="center")

        # Border
        for spine in ax.spines.values():
            spine.set_visible(True)
            spine.set_color(m["color"])
            spine.set_linewidth(2)

        # ── Row 1-2: Metrics list ────────────────────────────────────
        ax2 = fig.add_subplot(gs[1:, col])
        ax2.axis("off")

        for i, (label, value) in enumerate(m["metrics"]):
            y_pos = 0.85 - i * 0.22
            # Card
            card = plt.Rectangle((0.03, y_pos - 0.05), 0.94, 0.18,
                                  transform=ax2.transAxes, facecolor=BG_LIGHTER,
                                  edgecolor=m["color"] if i == 0 else BG_LIGHTER,
                                  linewidth=2 if i == 0 else 1,
                                  alpha=0.85, zorder=2, clip_on=False)
            card.set_joinstyle("round")
            ax2.add_patch(card)
            ax2.text(0.10, y_pos + 0.04, label, transform=ax2.transAxes,
                     fontsize=11, fontweight="600", color=TEXT_MUTED, va="center")
            ax2.text(0.90, y_pos + 0.04, value, transform=ax2.transAxes,
                     fontsize=18, fontweight="800",
                     color=m["color"] if i == 0 else TEXT_WHITE,
                     ha="right", va="center")

    fig.savefig(os.path.join(OUTPUT_DIR, "model_summary_dashboard.png"),
                dpi=200, bbox_inches="tight", facecolor=BG_DARK)
    plt.close(fig)
    print(f"  ✅ Saved: model_summary_dashboard.png")

    # ── Text report ──────────────────────────────────────────────────
    report = f"""SmartAgri AI — ML Model Evaluation Report
{'=' * 60}

1. CROP RECOMMENDATION (Random Forest Classifier)
   Accuracy:   {crop_metrics['accuracy']*100:.2f}%
   F1 Score:   {crop_metrics['f1']*100:.2f}%
   Precision:  {crop_metrics['precision']*100:.2f}%
   Recall:     {crop_metrics['recall']*100:.2f}%

2. PRICE FORECASTING (Gradient Boosting Regressor)
   Accuracy:   {price_metrics['accuracy_pct']:.2f}%   (100% - MAPE)
   R² Score:   {price_metrics['r2']*100:.4f}%
   MAE:        ₹{price_metrics['mae']:.2f}/quintal
   RMSE:       ₹{price_metrics['rmse']:.2f}/quintal
   MAPE:       {price_metrics['mape']:.2f}%

3. YIELD PREDICTION (Gradient Boosting Regressor)
   Accuracy:   {yield_metrics['accuracy_pct']:.2f}%   (100% - MAPE)
   R² Score:   {yield_metrics['r2']*100:.4f}%
   MAE:        {yield_metrics['mae']:.4f} tonnes/ha
   RMSE:       {yield_metrics['rmse']:.4f} tonnes/ha
"""
    with open(os.path.join(OUTPUT_DIR, "full_evaluation_report.txt"), "w", encoding="utf-8") as f:
        f.write(report)
    print(f"  ✅ Saved: full_evaluation_report.txt")
    print(report)


# =====================================================================
# MAIN
# =====================================================================
if __name__ == "__main__":
    crop_m  = evaluate_crop_model()
    price_m = evaluate_price_model()
    yield_m = evaluate_yield_model()
    generate_summary(crop_m, price_m, yield_m)

    print("\n" + "=" * 70)
    print("  🎉 ALL EVALUATIONS COMPLETE!")
    print(f"  📁 Results saved to: {OUTPUT_DIR}")
    print("=" * 70)
