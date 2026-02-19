"""
SmartAgri AI - Run all training pipelines
"""
import subprocess
import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def run_script(name):
    script = os.path.join(BASE_DIR, name)
    print(f"\n{'='*60}")
    print(f"Running {name}...")
    print(f"{'='*60}")
    result = subprocess.run([sys.executable, script], cwd=BASE_DIR)
    if result.returncode != 0:
        print(f"❌ {name} failed!")
        sys.exit(1)


if __name__ == "__main__":
    print("🌾 SmartAgri AI - Full Training Pipeline")
    print("=" * 60)

    run_script("preprocess.py")
    run_script("train_crop_model.py")
    run_script("train_yield_model.py")
    run_script("train_price_model.py")

    print("\n" + "=" * 60)
    print("✅ ALL MODELS TRAINED AND EXPORTED SUCCESSFULLY!")
    print("   Models are ready in server/ml_models/")
    print("=" * 60)
