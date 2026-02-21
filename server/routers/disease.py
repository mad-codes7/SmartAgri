"""
SmartAgri AI - Disease Detection API Routes
Accepts image upload, runs dual-model HF ensemble, returns enriched result.
"""
import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from utils.security import get_current_user_id
from services.disease_service import diagnose_image_bytes

logger = logging.getLogger("disease_router")
router = APIRouter(prefix="/api/disease", tags=["Disease Detection"])

MAX_SIZE_MB = 5
MAX_BYTES   = MAX_SIZE_MB * 1024 * 1024


@router.post("/diagnose")
async def diagnose(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
):
    """
    Upload a leaf/plant image and receive disease diagnosis.
    Runs dual HF model ensemble (MobileNetV2 38-class + ViT-Tiny 15-class).
    Returns: disease name, confidence, severity, symptoms, treatment, prevention, top-3 predictions.
    """
    # Validate content type
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted (JPEG, PNG, WEBP).")

    # Read bytes (limit size)
    image_bytes = await file.read()
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Image too large. Max size is {MAX_SIZE_MB} MB.")
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Image file appears to be empty or corrupt.")

    logger.info(f"[user={user_id}] Diagnosing image: {file.filename} ({len(image_bytes)//1024} KB)")

    try:
        result = diagnose_image_bytes(image_bytes, filename=file.filename or "leaf.jpg")
    except ValueError as ve:
        # Non-plant image detected by confidence guard
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Diagnosis error for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Diagnosis failed. Please try with a clearer image.")

    result["filename"] = file.filename
    return result


@router.get("/diseases")
async def list_diseases():
    """Return the full disease knowledge base (no auth required — informational)."""
    from services.disease_service import DISEASE_DB, SEVERITY_META
    diseases = []
    for key, info in DISEASE_DB.items():
        sev = info.get("severity", "moderate")
        diseases.append({
            "id":            key,
            "disease":       info["disease"],
            "crops":         info["crops"],
            "severity":      sev,
            "severity_label": SEVERITY_META[sev]["label"],
            "severity_emoji": SEVERITY_META[sev]["emoji"],
            "description":   info["description"][:120] + "..." if len(info["description"]) > 120 else info["description"],
        })
    return {"diseases": diseases, "total": len(diseases)}


@router.get("/status")
async def model_status():
    """Check if HF models are loaded and ready."""
    from services.disease_service import _hf_ready, _hf_error
    return {
        "models_ready": _hf_ready,
        "error": _hf_error,
        "primary_model":   "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
        "secondary_model": "wambugu71/crop_leaf_diseases_vit",
        "disease_classes": 38,
        "inference_mode":  "dual_model_ensemble" if _hf_ready else "simulation_fallback",
    }
