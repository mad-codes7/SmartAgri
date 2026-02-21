"""
SmartAgri AI - Soil Report OCR Router
Accepts a photo of a soil health card / soil test report,
uses Google Gemini Vision to extract N, P, K, pH, soil_type.
"""
import os
import logging
import json
import httpx
import base64
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from utils.security import get_current_user_id
from config import get_settings

logger = logging.getLogger("soil_report")
router = APIRouter(prefix="/api/soil", tags=["Soil Report OCR"])

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

MAX_SIZE_MB = 5
MAX_BYTES = MAX_SIZE_MB * 1024 * 1024

EXTRACTION_PROMPT = """You are an expert agricultural soil scientist. 
Analyze this soil health card / soil test report image and extract the following values:

1. N (Nitrogen) - in kg/ha (number only, 0-150 range)
2. P (Phosphorus) - in kg/ha (number only, 0-150 range)  
3. K (Potassium) - in kg/ha (number only, 0-250 range)
4. ph (Soil pH) - number with 1 decimal (3.5-10.0 range)
5. soil_type - one of: Loamy, Clayey, Sandy, Red, Black, Alluvial, Laterite

If the report is in Hindi/Marathi/regional language, still extract the numeric values.
If a value is not clearly visible, make a reasonable estimate based on other values.
If the image is NOT a soil report, set all values to null.

Return ONLY valid JSON in this exact format, nothing else:
{"N": 60, "P": 40, "K": 45, "ph": 6.5, "soil_type": "Loamy"}
"""


@router.post("/parse-report")
async def parse_soil_report(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
):
    """Upload a soil health card image → AI extracts N, P, K, pH, soil type."""
    gemini_key = get_settings().GEMINI_API_KEY
    if not gemini_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured.")

    # Validate content type
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Image too large. Max {MAX_SIZE_MB} MB.")
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Image appears empty or corrupt.")

    logger.info(f"[user={user_id}] Parsing soil report: {file.filename} ({len(image_bytes)//1024} KB)")

    # Encode image to base64
    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    # Determine MIME type
    mime_type = file.content_type or "image/jpeg"

    # Call Gemini Vision API
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": EXTRACTION_PROMPT},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_image,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 200,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{GEMINI_URL}?key={gemini_key}",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        if resp.status_code != 200:
            logger.error(f"Gemini API error: {resp.status_code} — {resp.text[:300]}")
            raise HTTPException(status_code=502, detail="AI service temporarily unavailable.")

        result = resp.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"]

        # Extract JSON from response (handle markdown code blocks)
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        parsed = json.loads(text)

        # Validate and clamp values
        soil_data = {
            "N": _clamp(parsed.get("N"), 0, 150, 60),
            "P": _clamp(parsed.get("P"), 0, 150, 40),
            "K": _clamp(parsed.get("K"), 0, 250, 40),
            "ph": _clamp(parsed.get("ph"), 3.5, 10.0, 6.5),
            "soil_type": parsed.get("soil_type", "Loamy"),
        }

        # Validate soil_type
        valid_types = ["Loamy", "Clayey", "Sandy", "Red", "Black", "Alluvial", "Laterite"]
        if soil_data["soil_type"] not in valid_types:
            soil_data["soil_type"] = "Loamy"

        logger.info(f"[user={user_id}] Extracted soil data: {soil_data}")
        return {"success": True, "soil_data": soil_data}

    except json.JSONDecodeError:
        logger.error(f"Failed to parse Gemini response as JSON: {text[:200]}")
        raise HTTPException(status_code=422, detail="Could not extract soil data from this image. Try a clearer photo.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Soil report parsing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze soil report. Please try again.")


def _clamp(value, min_val, max_val, default):
    """Clamp a value to a range, returning default if None."""
    if value is None:
        return default
    try:
        v = float(value)
        return max(min_val, min(max_val, round(v, 1)))
    except (ValueError, TypeError):
        return default
