"""
SmartAgri AI - Disease Detection API Routes
"""
import os, shutil
from fastapi import APIRouter, UploadFile, File, Depends
from utils.security import get_current_user_id
from services.disease_service import diagnose_image

router = APIRouter(prefix="/api/disease", tags=["Disease Detection"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/diagnose")
async def diagnose(file: UploadFile = File(...), user_id: int = Depends(get_current_user_id)):
    # Save uploaded image
    filepath = os.path.join(UPLOAD_DIR, file.filename)
    with open(filepath, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    # Run diagnosis
    result = diagnose_image(file.filename)
    result["filename"] = file.filename

    # Cleanup
    try:
        os.remove(filepath)
    except:
        pass

    return result
