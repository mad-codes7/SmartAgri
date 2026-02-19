"""
SmartAgri AI - Disease Detection Service
Simulated plant disease classifier with treatment database.
"""
import random

DISEASES = {
    "bacterial_blight": {
        "disease": "Bacterial Blight",
        "confidence": round(random.uniform(0.85, 0.97), 2),
        "crops": ["Rice", "Cotton", "Beans"],
        "description": "Bacterial blight causes water-soaked lesions that turn yellow and dry up. Highly contagious in humid conditions.",
        "symptoms": ["Yellow-brown streaks on leaves", "Water-soaked lesions", "Leaf margins turning white", "Wilting of young leaves"],
        "treatment": ["Apply streptomycin sulphate (500 ppm)", "Use copper oxychloride spray", "Remove and destroy infected plant material", "Improve field drainage"],
        "prevention": ["Use disease-resistant varieties (e.g., Rajendra Dhan)", "Seed treatment with Pseudomonas fluorescens", "Avoid excess nitrogen fertilizer", "Maintain proper spacing for air circulation"],
    },
    "leaf_rust": {
        "disease": "Leaf Rust",
        "confidence": round(random.uniform(0.80, 0.95), 2),
        "crops": ["Wheat", "Barley", "Oats"],
        "description": "Leaf rust forms circular orange-brown pustules on leaf surfaces, reducing photosynthesis and grain quality.",
        "symptoms": ["Orange-brown circular pustules", "Yellowing around pustules", "Premature leaf drying", "Reduced grain size"],
        "treatment": ["Apply propiconazole (25% EC) at 0.1%", "Spray mancozeb at 2.5 g/L", "Apply tebuconazole if severe", "Remove heavily infected plant debris"],
        "prevention": ["Plant rust-resistant varieties", "Early sowing to escape disease", "Balanced NPK fertilization", "Monitor fields weekly during winter"],
    },
    "powdery_mildew": {
        "disease": "Powdery Mildew",
        "confidence": round(random.uniform(0.82, 0.96), 2),
        "crops": ["Wheat", "Peas", "Mustard", "Grapes"],
        "description": "White powdery fungal growth on leaves and stems that reduces photosynthesis and yield.",
        "symptoms": ["White powdery patches on leaves", "Curling of leaves", "Stunted growth", "Premature leaf fall"],
        "treatment": ["Dust with sulphur powder (25 kg/ha)", "Spray karathane (0.05%)", "Apply hexaconazole spray", "Use potassium bicarbonate solution"],
        "prevention": ["Grow resistant varieties", "Proper plant spacing", "Avoid excess nitrogen", "Prune for good air circulation"],
    },
    "fusarium_wilt": {
        "disease": "Fusarium Wilt",
        "confidence": round(random.uniform(0.78, 0.93), 2),
        "crops": ["Tomato", "Chickpea", "Banana", "Cotton"],
        "description": "Soil-borne fungal disease causing yellowing, wilting, and death of plants from the base upward.",
        "symptoms": ["Yellowing of lower leaves first", "Unilateral wilting", "Brown discoloration of vascular tissue", "Stunted growth and death"],
        "treatment": ["Apply carbendazim soil drench", "Use Trichoderma viride (2 kg/acre)", "Solarize soil before planting", "Remove and burn infected plants"],
        "prevention": ["Use wilt-resistant varieties", "Practice 3-4 year crop rotation", "Treat seeds with fungicide", "Maintain soil pH above 6.5"],
    },
    "late_blight": {
        "disease": "Late Blight",
        "confidence": round(random.uniform(0.83, 0.96), 2),
        "crops": ["Potato", "Tomato"],
        "description": "Devastating disease causing rapid destruction of leaves, stems, and tubers in cool wet conditions.",
        "symptoms": ["Dark water-soaked lesions on leaves", "White mold on leaf undersides", "Rapid browning of entire foliage", "Rotting of tubers/fruits"],
        "treatment": ["Spray metalaxyl + mancozeb at first sign", "Apply cymoxanil-based fungicide", "Harvest tubers immediately in severe cases", "Destroy all infected plant material"],
        "prevention": ["Plant certified disease-free seed", "Use resistant varieties (Kufri Jyoti)", "Avoid overhead irrigation", "Apply preventive fungicide before rains"],
    },
    "healthy": {
        "disease": "Healthy Plant",
        "confidence": round(random.uniform(0.90, 0.99), 2),
        "crops": [],
        "description": "The plant appears healthy with no visible signs of disease.",
        "symptoms": [],
        "treatment": ["No treatment required"],
        "prevention": ["Continue regular monitoring", "Maintain good agricultural practices", "Keep soil health checks updated"],
    },
}


def diagnose_image(filename: str) -> dict:
    """Simulate disease detection from uploaded image."""
    # In production, this would use a trained CNN model (ResNet, EfficientNet)
    # For demo, we select based on filename hints or random
    fn = filename.lower()

    if "healthy" in fn or "good" in fn:
        disease_key = "healthy"
    elif "rust" in fn:
        disease_key = "leaf_rust"
    elif "blight" in fn:
        disease_key = random.choice(["bacterial_blight", "late_blight"])
    elif "mildew" in fn:
        disease_key = "powdery_mildew"
    elif "wilt" in fn:
        disease_key = "fusarium_wilt"
    else:
        disease_key = random.choice(list(DISEASES.keys()))

    d = DISEASES[disease_key].copy()
    d["confidence"] = round(random.uniform(0.78, 0.97), 2)
    return d
