"""
SmartAgri AI - Fertilizer & Pesticide Recommendation Service
Scientifically accurate recommendations based on Indian agricultural guidelines (ICAR).
"""

# ─── Fertilizer Database (per hectare) ─────────────────────
# Based on ICAR Package of Practices and state agriculture university recommendations
FERTILIZER_DB = {
    "rice": {
        "basal": [
            {"name": "DAP (Di-Ammonium Phosphate)", "type": "Phosphatic", "dosage_kg_per_ha": 130, "dosage_kg_per_acre": 52, "method": "Broadcast and incorporate before transplanting", "nutrient": "N:18%, P2O5:46%"},
            {"name": "MOP (Muriate of Potash)", "type": "Potassic", "dosage_kg_per_ha": 67, "dosage_kg_per_acre": 27, "method": "Broadcast and incorporate before transplanting", "nutrient": "K2O:60%"},
            {"name": "Zinc Sulphate (ZnSO4)", "type": "Micronutrient", "dosage_kg_per_ha": 25, "dosage_kg_per_acre": 10, "method": "Mix with soil before transplanting", "nutrient": "Zn:21%"},
        ],
        "seedling": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 43, "dosage_kg_per_acre": 17, "method": "Broadcast in standing water (1st split - 20 DAT)", "nutrient": "N:46%"},
        ],
        "vegetative": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 43, "dosage_kg_per_acre": 17, "method": "Broadcast at active tillering stage (40 DAT)", "nutrient": "N:46%"},
        ],
        "flowering": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 43, "dosage_kg_per_acre": 17, "method": "Broadcast at panicle initiation stage", "nutrient": "N:46%"},
        ],
        "fruiting": [],
        "maturity": [],
        "total_npk": "120:60:40 kg/ha (N:P2O5:K2O)",
    },
    "wheat": {
        "basal": [
            {"name": "DAP", "type": "Phosphatic", "dosage_kg_per_ha": 130, "dosage_kg_per_acre": 52, "method": "Drill or broadcast before sowing", "nutrient": "N:18%, P2O5:46%"},
            {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 50, "dosage_kg_per_acre": 20, "method": "Broadcast before sowing", "nutrient": "K2O:60%"},
        ],
        "seedling": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 65, "dosage_kg_per_acre": 26, "method": "Top dress at first irrigation (CRI stage, 21 DAS)", "nutrient": "N:46%"},
        ],
        "vegetative": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 65, "dosage_kg_per_acre": 26, "method": "Top dress at tillering (45 DAS) with irrigation", "nutrient": "N:46%"},
        ],
        "flowering": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 32, "dosage_kg_per_acre": 13, "method": "Foliar spray (2% solution) at heading if needed", "nutrient": "N:46%"},
        ],
        "fruiting": [],
        "maturity": [],
        "total_npk": "120:60:30 kg/ha (N:P2O5:K2O)",
    },
    "maize": {
        "basal": [
            {"name": "DAP", "type": "Phosphatic", "dosage_kg_per_ha": 130, "dosage_kg_per_acre": 52, "method": "Band placement 5cm below seed", "nutrient": "N:18%, P2O5:46%"},
            {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 67, "dosage_kg_per_acre": 27, "method": "Broadcast before sowing", "nutrient": "K2O:60%"},
            {"name": "Zinc Sulphate", "type": "Micronutrient", "dosage_kg_per_ha": 25, "dosage_kg_per_acre": 10, "method": "Mix with soil at sowing", "nutrient": "Zn:21%"},
        ],
        "seedling": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 55, "dosage_kg_per_acre": 22, "method": "Side dress at knee-high stage (25-30 DAS)", "nutrient": "N:46%"},
        ],
        "vegetative": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 55, "dosage_kg_per_acre": 22, "method": "Side dress before tasseling (45 DAS)", "nutrient": "N:46%"},
        ],
        "flowering": [],
        "fruiting": [],
        "maturity": [],
        "total_npk": "120:60:40 kg/ha (N:P2O5:K2O)",
    },
    "cotton": {
        "basal": [
            {"name": "SSP (Single Super Phosphate)", "type": "Phosphatic", "dosage_kg_per_ha": 375, "dosage_kg_per_acre": 150, "method": "Apply in furrows before sowing", "nutrient": "P2O5:16%, S:11%"},
            {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 100, "dosage_kg_per_acre": 40, "method": "Broadcast before sowing", "nutrient": "K2O:60%"},
        ],
        "seedling": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 54, "dosage_kg_per_acre": 22, "method": "Ring application around plants (30 DAS)", "nutrient": "N:46%"},
        ],
        "vegetative": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 54, "dosage_kg_per_acre": 22, "method": "Side dress at squaring stage (60 DAS)", "nutrient": "N:46%"},
        ],
        "flowering": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 54, "dosage_kg_per_acre": 22, "method": "Side dress at flowering (90 DAS)", "nutrient": "N:46%"},
            {"name": "MgSO4 (Magnesium Sulphate)", "type": "Micronutrient", "dosage_kg_per_ha": 10, "dosage_kg_per_acre": 4, "method": "Foliar spray (1% solution)", "nutrient": "Mg:10%, S:13%"},
        ],
        "fruiting": [
            {"name": "KNO3 (Potassium Nitrate)", "type": "Specialty", "dosage_kg_per_ha": 10, "dosage_kg_per_acre": 4, "method": "Foliar spray (1% solution) for boll development", "nutrient": "K2O:46%, N:13%"},
        ],
        "maturity": [],
        "total_npk": "120:60:60 kg/ha (N:P2O5:K2O)",
    },
    "sugarcane": {
        "basal": [
            {"name": "SSP", "type": "Phosphatic", "dosage_kg_per_ha": 500, "dosage_kg_per_acre": 200, "method": "Apply in furrows at planting", "nutrient": "P2O5:16%, S:11%"},
            {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 133, "dosage_kg_per_acre": 54, "method": "Apply in furrows at planting", "nutrient": "K2O:60%"},
        ],
        "seedling": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 109, "dosage_kg_per_acre": 44, "method": "Side dress at 30 DAP, earthing up", "nutrient": "N:46%"},
        ],
        "vegetative": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 109, "dosage_kg_per_acre": 44, "method": "Side dress at grand growth (60 DAP)", "nutrient": "N:46%"},
            {"name": "FeSO4 (Ferrous Sulphate)", "type": "Micronutrient", "dosage_kg_per_ha": 10, "dosage_kg_per_acre": 4, "method": "Foliar spray (0.5% solution) if yellowing seen", "nutrient": "Fe:19%"},
        ],
        "flowering": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 109, "dosage_kg_per_acre": 44, "method": "Final split at 90 DAP with earthing up", "nutrient": "N:46%"},
        ],
        "fruiting": [],
        "maturity": [],
        "total_npk": "250:80:80 kg/ha (N:P2O5:K2O)",
    },
    "soybean": {
        "basal": [
            {"name": "DAP", "type": "Phosphatic", "dosage_kg_per_ha": 130, "dosage_kg_per_acre": 52, "method": "Drill at sowing, 5cm away from seed", "nutrient": "N:18%, P2O5:46%"},
            {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 33, "dosage_kg_per_acre": 13, "method": "Broadcast before sowing", "nutrient": "K2O:60%"},
            {"name": "Sulphur (Gypsum)", "type": "Secondary", "dosage_kg_per_ha": 200, "dosage_kg_per_acre": 80, "method": "Broadcast and mix in soil", "nutrient": "S:13%, Ca:23%"},
        ],
        "seedling": [],
        "vegetative": [],
        "flowering": [
            {"name": "DAP", "type": "Phosphatic", "dosage_kg_per_ha": 20, "dosage_kg_per_acre": 8, "method": "Foliar spray (2% solution) at pod filling", "nutrient": "N:18%, P2O5:46%"},
        ],
        "fruiting": [],
        "maturity": [],
        "total_npk": "30:60:20 kg/ha (N:P2O5:K2O) + Rhizobium seed treatment",
    },
    "chickpea": {
        "basal": [
            {"name": "DAP", "type": "Phosphatic", "dosage_kg_per_ha": 100, "dosage_kg_per_acre": 40, "method": "Drill at sowing", "nutrient": "N:18%, P2O5:46%"},
            {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 33, "dosage_kg_per_acre": 13, "method": "Broadcast before sowing", "nutrient": "K2O:60%"},
        ],
        "seedling": [],
        "vegetative": [],
        "flowering": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 22, "dosage_kg_per_acre": 9, "method": "Foliar spray (2% urea) at flowering for yield boost", "nutrient": "N:46%"},
        ],
        "fruiting": [],
        "maturity": [],
        "total_npk": "20:40:20 kg/ha (N:P2O5:K2O) + Rhizobium + PSB",
    },
    "mustard": {
        "basal": [
            {"name": "DAP", "type": "Phosphatic", "dosage_kg_per_ha": 87, "dosage_kg_per_acre": 35, "method": "Drill at sowing", "nutrient": "N:18%, P2O5:46%"},
            {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 25, "dosage_kg_per_acre": 10, "method": "Broadcast at sowing", "nutrient": "K2O:60%"},
            {"name": "Sulphur (Gypsum)", "type": "Secondary", "dosage_kg_per_ha": 200, "dosage_kg_per_acre": 80, "method": "Mix in soil before sowing", "nutrient": "S:13%"},
        ],
        "seedling": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 65, "dosage_kg_per_acre": 26, "method": "Top dress at first irrigation (25-30 DAS)", "nutrient": "N:46%"},
        ],
        "vegetative": [],
        "flowering": [],
        "fruiting": [],
        "maturity": [],
        "total_npk": "80:40:15 kg/ha (N:P2O5:K2O) + 20 kg S/ha",
    },
    "groundnut": {
        "basal": [
            {"name": "SSP", "type": "Phosphatic", "dosage_kg_per_ha": 250, "dosage_kg_per_acre": 100, "method": "Apply in furrows at sowing", "nutrient": "P2O5:16%, S:11%, Ca:20%"},
            {"name": "Gypsum", "type": "Secondary", "dosage_kg_per_ha": 500, "dosage_kg_per_acre": 200, "method": "Apply at flowering (45 DAS) near base", "nutrient": "Ca:23%, S:18%"},
        ],
        "seedling": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 22, "dosage_kg_per_acre": 9, "method": "Top dress (if needed) at 20 DAS", "nutrient": "N:46%"},
        ],
        "vegetative": [],
        "flowering": [
            {"name": "Borax", "type": "Micronutrient", "dosage_kg_per_ha": 10, "dosage_kg_per_acre": 4, "method": "Soil application at pegging", "nutrient": "B:11%"},
        ],
        "fruiting": [],
        "maturity": [],
        "total_npk": "10:40:0 kg/ha + 200 kg Gypsum/ha",
    },
    "banana": {
        "basal": [
            {"name": "SSP", "type": "Phosphatic", "dosage_kg_per_ha": 500, "dosage_kg_per_acre": 200, "method": "Mix in pit filling at planting", "nutrient": "P2O5:16%"},
            {"name": "FYM (Farm Yard Manure)", "type": "Organic", "dosage_kg_per_ha": 25000, "dosage_kg_per_acre": 10000, "method": "Fill in pits before planting", "nutrient": "Organic"},
        ],
        "seedling": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 72, "dosage_kg_per_acre": 29, "method": "Ring application at 2 months after planting", "nutrient": "N:46%"},
            {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 67, "dosage_kg_per_acre": 27, "method": "Ring application at 2 months", "nutrient": "K2O:60%"},
        ],
        "vegetative": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 145, "dosage_kg_per_acre": 58, "method": "Split application at 4 and 6 months", "nutrient": "N:46%"},
            {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 167, "dosage_kg_per_acre": 67, "method": "Split application with urea", "nutrient": "K2O:60%"},
        ],
        "flowering": [
            {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 72, "dosage_kg_per_acre": 29, "method": "Drench around pseudostem at shooting", "nutrient": "N:46%"},
            {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 100, "dosage_kg_per_acre": 40, "method": "Bunch feeding stage", "nutrient": "K2O:60%"},
        ],
        "fruiting": [],
        "maturity": [],
        "total_npk": "200:80:200 kg/ha (N:P2O5:K2O)",
    },
}

# Default fertilizer for crops not in the database
DEFAULT_FERTILIZER = {
    "basal": [
        {"name": "DAP", "type": "Phosphatic", "dosage_kg_per_ha": 100, "dosage_kg_per_acre": 40, "method": "Broadcast and incorporate before sowing", "nutrient": "N:18%, P2O5:46%"},
        {"name": "MOP", "type": "Potassic", "dosage_kg_per_ha": 50, "dosage_kg_per_acre": 20, "method": "Broadcast before sowing", "nutrient": "K2O:60%"},
    ],
    "seedling": [
        {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 55, "dosage_kg_per_acre": 22, "method": "Top dress at 20-25 DAS", "nutrient": "N:46%"},
    ],
    "vegetative": [
        {"name": "Urea", "type": "Nitrogenous", "dosage_kg_per_ha": 55, "dosage_kg_per_acre": 22, "method": "Top dress at 40-45 DAS", "nutrient": "N:46%"},
    ],
    "flowering": [],
    "fruiting": [],
    "maturity": [],
    "total_npk": "80:40:30 kg/ha (N:P2O5:K2O)",
}


# ─── Pest & Disease Risk Database ──────────────────────────
# Weather-triggered pest/disease risks per crop
PEST_RISK_DB = {
    "rice": [
        {"pest": "Blast (Magnaporthe oryzae)", "type": "Fungal Disease", "trigger": "high_humidity_moderate_temp", "trigger_desc": "Humidity >85%, Temperature 20-25 C with cloudy weather", "stages": ["Seedling", "Vegetative", "Flowering"], "severity": "High"},
        {"pest": "Brown Plant Hopper (BPH)", "type": "Insect", "trigger": "high_humidity_high_temp", "trigger_desc": "Humidity >80%, Temperature >28 C, excessive nitrogen use", "stages": ["Vegetative", "Flowering"], "severity": "High"},
        {"pest": "Stem Borer (Scirpophaga incertulas)", "type": "Insect", "trigger": "moderate_conditions", "trigger_desc": "Warm humid conditions, continuous rice cultivation", "stages": ["Seedling", "Vegetative"], "severity": "Medium"},
        {"pest": "Bacterial Leaf Blight", "type": "Bacterial Disease", "trigger": "high_humidity_high_temp", "trigger_desc": "Temperature >30 C with heavy rain and wind", "stages": ["Vegetative", "Flowering", "Fruiting"], "severity": "High"},
        {"pest": "Sheath Blight (Rhizoctonia solani)", "type": "Fungal Disease", "trigger": "high_humidity_high_temp", "trigger_desc": "Temperature 28-32 C, Humidity >90%, dense canopy", "stages": ["Vegetative", "Flowering"], "severity": "Medium"},
    ],
    "wheat": [
        {"pest": "Yellow Rust (Puccinia striiformis)", "type": "Fungal Disease", "trigger": "cool_humid", "trigger_desc": "Temperature 10-15 C, high humidity, cloudy weather", "stages": ["Vegetative", "Flowering"], "severity": "High"},
        {"pest": "Brown Rust (Puccinia recondita)", "type": "Fungal Disease", "trigger": "moderate_humid", "trigger_desc": "Temperature 15-25 C, humidity >70%", "stages": ["Flowering", "Fruiting"], "severity": "Medium"},
        {"pest": "Aphids (Sitobion avenae)", "type": "Insect", "trigger": "warm_dry", "trigger_desc": "Temperature 20-28 C, dry spells, late sown crops", "stages": ["Flowering", "Fruiting"], "severity": "Medium"},
        {"pest": "Karnal Bunt (Tilletia indica)", "type": "Fungal Disease", "trigger": "high_humidity_moderate_temp", "trigger_desc": "Temperature 18-24 C, humidity >80%, cloudy at heading", "stages": ["Flowering"], "severity": "Medium"},
        {"pest": "Termites", "type": "Insect", "trigger": "dry_conditions", "trigger_desc": "Dry soil, sandy soils, rainfed conditions", "stages": ["Sowing", "Seedling", "Vegetative"], "severity": "Medium"},
    ],
    "maize": [
        {"pest": "Fall Armyworm (Spodoptera frugiperda)", "type": "Insect", "trigger": "warm_humid", "trigger_desc": "Temperature >25 C, intermittent rain, monsoon season", "stages": ["Seedling", "Vegetative"], "severity": "High"},
        {"pest": "Stem Borer (Chilo partellus)", "type": "Insect", "trigger": "moderate_conditions", "trigger_desc": "Warm conditions, late sowing", "stages": ["Seedling", "Vegetative"], "severity": "Medium"},
        {"pest": "Turcicum Leaf Blight", "type": "Fungal Disease", "trigger": "high_humidity_moderate_temp", "trigger_desc": "Temperature 18-27 C, humidity >80%, prolonged wetness", "stages": ["Vegetative", "Flowering"], "severity": "Medium"},
        {"pest": "Downy Mildew", "type": "Fungal Disease", "trigger": "high_humidity_cool", "trigger_desc": "Temperature 20-25 C, high morning dew, infected seed", "stages": ["Seedling"], "severity": "High"},
    ],
    "cotton": [
        {"pest": "Pink Bollworm (Pectinophora gossypiella)", "type": "Insect", "trigger": "warm_moderate_humidity", "trigger_desc": "Temperature 25-30 C, moderate humidity, late season", "stages": ["Flowering", "Fruiting"], "severity": "High"},
        {"pest": "Whitefly (Bemisia tabaci)", "type": "Insect", "trigger": "hot_dry", "trigger_desc": "Temperature >30 C, dry conditions, vector for leaf curl virus", "stages": ["Vegetative", "Flowering"], "severity": "High"},
        {"pest": "American Bollworm (Helicoverpa armigera)", "type": "Insect", "trigger": "warm_humid", "trigger_desc": "Temperature 25-28 C, humidity 60-80%", "stages": ["Flowering", "Fruiting"], "severity": "High"},
        {"pest": "Bacterial Blight", "type": "Bacterial Disease", "trigger": "high_humidity_high_temp", "trigger_desc": "Heavy rain + wind, temperature 25-35 C", "stages": ["Vegetative", "Flowering"], "severity": "Medium"},
    ],
    "sugarcane": [
        {"pest": "Early Shoot Borer (Chilo infuscatellus)", "type": "Insect", "trigger": "hot_dry", "trigger_desc": "Hot dry weather, March-June", "stages": ["Seedling", "Vegetative"], "severity": "High"},
        {"pest": "Top Borer (Scirpophaga excerptalis)", "type": "Insect", "trigger": "warm_humid", "trigger_desc": "Monsoon period, humid conditions", "stages": ["Vegetative", "Flowering"], "severity": "Medium"},
        {"pest": "Red Rot (Colletotrichum falcatum)", "type": "Fungal Disease", "trigger": "high_humidity_moderate_temp", "trigger_desc": "Waterlogged conditions, temperature 25-30 C", "stages": ["Vegetative", "Maturity"], "severity": "High"},
        {"pest": "Woolly Aphid", "type": "Insect", "trigger": "cool_humid", "trigger_desc": "Temperature 15-25 C, October-January", "stages": ["Vegetative", "Maturity"], "severity": "Medium"},
    ],
    "soybean": [
        {"pest": "Girdle Beetle", "type": "Insect", "trigger": "warm_humid", "trigger_desc": "Monsoon season, warm humid weather", "stages": ["Vegetative", "Flowering"], "severity": "High"},
        {"pest": "Stem Fly", "type": "Insect", "trigger": "moderate_conditions", "trigger_desc": "Early sowing, warm conditions", "stages": ["Seedling", "Vegetative"], "severity": "Medium"},
        {"pest": "Yellow Mosaic Virus (YMV)", "type": "Viral Disease", "trigger": "whitefly_vector", "trigger_desc": "Whitefly population high, temperature >30 C", "stages": ["Seedling", "Vegetative"], "severity": "High"},
        {"pest": "Rust (Phakopsora pachyrhizi)", "type": "Fungal Disease", "trigger": "high_humidity_moderate_temp", "trigger_desc": "Humidity >80%, temperature 18-28 C, prolonged wetness", "stages": ["Flowering", "Fruiting"], "severity": "High"},
    ],
    "chickpea": [
        {"pest": "Pod Borer (Helicoverpa armigera)", "type": "Insect", "trigger": "warm_moderate_humidity", "trigger_desc": "Temperature 20-28 C, clear nights, flowering stage", "stages": ["Flowering", "Fruiting"], "severity": "High"},
        {"pest": "Wilt (Fusarium oxysporum)", "type": "Fungal Disease", "trigger": "warm_moist_soil", "trigger_desc": "Soil temperature 25-30 C, excess moisture", "stages": ["Seedling", "Vegetative"], "severity": "High"},
        {"pest": "Ascochyta Blight", "type": "Fungal Disease", "trigger": "cool_wet", "trigger_desc": "Temperature 15-20 C, continued rain, dense canopy", "stages": ["Vegetative", "Flowering"], "severity": "Medium"},
        {"pest": "Cutworm", "type": "Insect", "trigger": "early_season", "trigger_desc": "Early crop stage, heavy soils", "stages": ["Sowing", "Seedling"], "severity": "Low"},
    ],
}

# Default pest risks for crops not in the database
DEFAULT_PEST_RISKS = [
    {"pest": "Aphids", "type": "Insect", "trigger": "warm_dry", "trigger_desc": "Warm dry conditions, temperature 20-30 C", "stages": ["Vegetative", "Flowering"], "severity": "Medium"},
    {"pest": "Powdery Mildew", "type": "Fungal Disease", "trigger": "moderate_humid", "trigger_desc": "Moderate temperature, high humidity", "stages": ["Vegetative", "Flowering"], "severity": "Medium"},
]


# ─── Pesticide & Bio-control Database ─────────────────────
# Only CIB&RC (India) approved products
PESTICIDE_DB = {
    "Stem Borer": [
        {"product": "Cartap Hydrochloride 4G", "type": "Chemical", "dosage": "25 kg granules/ha in leaf whorl", "target": "Stem Borer (Rice/Sugarcane)", "phi_days": 40, "precautions": "Do not apply near water bodies. Use granule applicator."},
        {"product": "Trichogramma japonicum", "type": "Bio-control", "dosage": "1 lakh eggs (5 cards)/ha, 3 releases at weekly interval", "target": "Stem Borer eggs", "phi_days": 0, "precautions": "Release in the evening. No chemical spray 5 days before/after release."},
    ],
    "Brown Plant Hopper": [
        {"product": "Pymetrozine 50% WG", "type": "Chemical", "dosage": "300 g/ha in 500L water", "target": "BPH, WBPH", "phi_days": 14, "precautions": "Avoid broad-spectrum insecticides that kill BPH predators."},
        {"product": "Neem Oil (Azadirachtin 0.15%)", "type": "Bio-control", "dosage": "2.5 L/ha in 500L water", "target": "BPH (repellent/anti-feedant)", "phi_days": 0, "precautions": "Apply in evening. Repeat every 7-10 days."},
    ],
    "Blast": [
        {"product": "Tricyclazole 75% WP", "type": "Chemical", "dosage": "300 g/ha in 500L water", "target": "Rice Blast", "phi_days": 21, "precautions": "Preventive spray more effective. Apply before expected infection."},
        {"product": "Pseudomonas fluorescens", "type": "Bio-control", "dosage": "2.5 kg/ha as foliar spray in 500L water", "target": "Blast, Sheath Blight", "phi_days": 0, "precautions": "Apply in evening. Avoid mixing with chemical fungicides."},
    ],
    "Yellow Rust": [
        {"product": "Propiconazole 25% EC", "type": "Chemical", "dosage": "500 ml/ha in 500L water", "target": "All rusts (Yellow/Brown/Black)", "phi_days": 30, "precautions": "Apply at first sign of pustules. Max 2 sprays per season."},
    ],
    "Fall Armyworm": [
        {"product": "Emamectin Benzoate 5% SG", "type": "Chemical", "dosage": "200 g/ha in 500L water", "target": "Fall Armyworm, Bollworms", "phi_days": 14, "precautions": "Target whorl application. Apply in early morning or evening."},
        {"product": "Nomuraea rileyi (1x10^8 CFU/g)", "type": "Bio-control", "dosage": "4 kg/ha in 500L water", "target": "Fall Armyworm, Spodoptera", "phi_days": 0, "precautions": "Apply in humid conditions. Avoid fungicide sprays."},
        {"product": "Neem Seed Kernel Extract (NSKE 5%)", "type": "Bio-control", "dosage": "25 kg neem seed in 500L water/ha", "target": "Early instar larvae", "phi_days": 0, "precautions": "Prepare fresh. Apply in the evening only."},
    ],
    "Pod Borer": [
        {"product": "Indoxacarb 14.5% SC", "type": "Chemical", "dosage": "500 ml/ha in 500L water", "target": "Helicoverpa armigera", "phi_days": 14, "precautions": "Apply at ETL (1 larva/meter row). Rotate with other MOA."},
        {"product": "HaNPV (Helicoverpa Nuclear Polyhedrosis Virus)", "type": "Bio-control", "dosage": "250 LE/ha in 500L water + 0.1% jaggery", "target": "Helicoverpa larvae", "phi_days": 0, "precautions": "Apply in evening. Add UV protectant. Effective on early instars."},
        {"product": "Pheromone Traps (Helilure)", "type": "Bio-control", "dosage": "5 traps/ha", "target": "Helicoverpa monitoring and mass trapping", "phi_days": 0, "precautions": "Install at crop canopy level. Replace lures every 21 days."},
    ],
    "Aphids": [
        {"product": "Imidacloprid 17.8% SL", "type": "Chemical", "dosage": "125 ml/ha in 500L water", "target": "Aphids, Jassids, Thrips", "phi_days": 21, "precautions": "Avoid during pollination. Toxic to bees."},
        {"product": "Neem Oil 1500 ppm", "type": "Bio-control", "dosage": "3 L/ha in 500L water", "target": "Aphids (anti-feedant)", "phi_days": 0, "precautions": "Apply in evening. Repeat every 7-10 days if infestation persists."},
    ],
    "Whitefly": [
        {"product": "Spiromesifen 22.9% SC", "type": "Chemical", "dosage": "500 ml/ha", "target": "Whitefly (all stages)", "phi_days": 21, "precautions": "Cover undersides of leaves. Max 2 sprays per season."},
        {"product": "Yellow Sticky Traps", "type": "Bio-control", "dosage": "20 traps/ha", "target": "Whitefly adults monitoring", "phi_days": 0, "precautions": "Install at canopy level. Replace when fully covered."},
    ],
    "Pink Bollworm": [
        {"product": "Profenophos 50% EC", "type": "Chemical", "dosage": "1 L/ha in 500L water", "target": "Pink Bollworm, American Bollworm", "phi_days": 30, "precautions": "Apply at rosette flower (symptom) stage. Use PPE."},
        {"product": "Pheromone Traps (PBR-1)", "type": "Bio-control", "dosage": "5 traps/ha", "target": "Pink Bollworm monitoring/mass trapping", "phi_days": 0, "precautions": "Install at boll formation stage. Replace lures monthly."},
    ],
    "Powdery Mildew": [
        {"product": "Sulphur 80% WP (Wettable Sulphur)", "type": "Chemical", "dosage": "2 kg/ha in 500L water", "target": "Powdery Mildew", "phi_days": 14, "precautions": "Avoid in temperatures >35 C (phytotoxic). Do not mix with oils."},
    ],
    "Wilt": [
        {"product": "Trichoderma viride (1x10^8 CFU/g)", "type": "Bio-control", "dosage": "4 kg/ha as seed treatment (10g/kg seed) + soil drench", "target": "Fusarium Wilt, Root Rot", "phi_days": 0, "precautions": "Apply to moist soil. Avoid chemical fungicide contact."},
    ],
    "Downy Mildew": [
        {"product": "Metalaxyl 8% + Mancozeb 64% WP", "type": "Chemical", "dosage": "2.5 kg/ha in 500L water", "target": "Downy Mildew", "phi_days": 21, "precautions": "Preventive spray recommended. Max 3 sprays per season. Use alternate chemistry."},
    ],
}


# ─── Safety Precautions ───────────────────────────────────
SAFETY_PRECAUTIONS = [
    "Always wear PPE (gloves, mask, goggles, long-sleeved clothing) while handling and spraying pesticides.",
    "Do not eat, drink or smoke during pesticide application.",
    "Spray in early morning or late evening to protect pollinators (bees, butterflies).",
    "Follow the Pre-Harvest Interval (PHI) strictly before harvesting the crop.",
    "Triple-rinse empty pesticide containers and dispose safely. Never reuse for food/water.",
    "Store pesticides in original containers, away from food, water, children, and animals.",
    "Prefer Integrated Pest Management (IPM): bio-control first, chemical only at ETL (Economic Threshold Level).",
    "Do not mix pesticides unless compatibility is confirmed. Read the label carefully.",
    "Wash hands and exposed skin thoroughly with soap and water after spraying.",
    "In case of poisoning, contact nearest health centre immediately. Carry the pesticide label.",
]


# ─── Helper Functions ─────────────────────────────────────

def _assess_weather_risk(temperature, humidity, rainfall):
    """Classify weather conditions for pest/disease risk assessment."""
    conditions = set()
    if humidity > 80:
        conditions.add("high_humidity")
    if humidity > 60:
        conditions.add("moderate_humidity")
    if temperature > 30:
        conditions.add("hot")
        conditions.add("high_temp")
    if temperature > 25:
        conditions.add("warm")
    if 15 <= temperature <= 25:
        conditions.add("moderate_temp")
    if temperature < 20:
        conditions.add("cool")
    if rainfall < 30:
        conditions.add("dry")
    if rainfall > 100:
        conditions.add("wet")
    return conditions


def _match_trigger(trigger_key, weather_conditions):
    """Check if weather conditions match a pest trigger."""
    trigger_map = {
        "high_humidity_moderate_temp": {"high_humidity", "moderate_temp"},
        "high_humidity_high_temp": {"high_humidity", "high_temp"},
        "moderate_conditions": {"warm"},
        "cool_humid": {"cool", "moderate_humidity"},
        "moderate_humid": {"moderate_humidity"},
        "warm_dry": {"warm", "dry"},
        "dry_conditions": {"dry"},
        "warm_humid": {"warm", "moderate_humidity"},
        "hot_dry": {"hot", "dry"},
        "warm_moderate_humidity": {"warm", "moderate_humidity"},
        "whitefly_vector": {"hot"},
        "warm_moist_soil": {"warm", "wet"},
        "cool_wet": {"cool", "wet"},
        "early_season": set(),  # Always possible in early stages
        "high_humidity_cool": {"high_humidity", "cool"},
    }
    required = trigger_map.get(trigger_key, set())
    if not required:
        return True  # Non-weather triggers are always possible
    return required.issubset(weather_conditions)


def get_fertilizer_recommendation(crop, growth_stage, soil_type=None):
    """Get stage-wise fertilizer recommendation for a crop."""
    crop_lower = crop.lower()
    fert_data = FERTILIZER_DB.get(crop_lower, DEFAULT_FERTILIZER)

    stage_lower = growth_stage.lower()
    # Always include basal recommendations as reference
    result = {
        "current_stage_fertilizers": fert_data.get(stage_lower, []),
        "basal_reference": fert_data.get("basal", []),
        "total_npk": fert_data.get("total_npk", "Refer to local agriculture department"),
        "soil_amendment": None,
    }

    # Soil-specific amendments
    if soil_type:
        st = soil_type.lower()
        if st in ("sandy", "sandy loam"):
            result["soil_amendment"] = "Sandy soils: Apply fertilizer in splits (not all at once) to reduce leaching. Add organic matter (FYM/compost 5-10 t/ha) to improve nutrient retention."
        elif st in ("clayey", "clay"):
            result["soil_amendment"] = "Clayey soils: Reduce MOP dosage by 10-15% as clay retains potassium. Ensure good drainage to prevent waterlogging after fertilizer application."
        elif st in ("red soil", "laterite"):
            result["soil_amendment"] = "Red/Laterite soils: Apply lime (2-4 q/ha) if pH < 5.5. These soils are often deficient in phosphorus - use SSP which also provides sulphur."
        elif st in ("black soil", "black cotton soil"):
            result["soil_amendment"] = "Black soils: Rich in potassium - reduce MOP by 20-25%. Apply gypsum (2 q/ha) to improve drainage and provide calcium/sulphur."

    return result


def get_pest_risk_analysis(crop, growth_stage, temperature, humidity, rainfall):
    """Analyze pest/disease risks based on crop, stage, and weather."""
    crop_lower = crop.lower()
    stage_title = growth_stage.title()
    weather_conditions = _assess_weather_risk(temperature, humidity, rainfall)

    pest_list = PEST_RISK_DB.get(crop_lower, DEFAULT_PEST_RISKS)
    risks = []

    for pest_entry in pest_list:
        # Check if pest is relevant for current growth stage
        if isinstance(pest_entry.get("stages"), list) and stage_title not in pest_entry["stages"]:
            # Include but mark as low risk if not in current stage
            risk_level = "Low"
            weather_match = False
        else:
            weather_match = _match_trigger(pest_entry.get("trigger", ""), weather_conditions)
            base_severity = pest_entry.get("severity", "Medium")
            if weather_match:
                risk_level = base_severity
            else:
                risk_level = "Low" if base_severity != "High" else "Medium"

        risks.append({
            "pest_name": pest_entry["pest"],
            "pest_type": pest_entry["type"],
            "risk_level": risk_level,
            "weather_match": weather_match,
            "trigger_description": pest_entry.get("trigger_desc", ""),
            "affected_stages": pest_entry.get("stages", []),
        })

    # Sort: High risk first
    risk_order = {"High": 0, "Medium": 1, "Low": 2}
    risks.sort(key=lambda x: risk_order.get(x["risk_level"], 3))

    return risks


def get_pesticide_recommendations(crop, pest_risks):
    """Get pesticide recommendations only for medium/high risk pests."""
    recommendations = []
    seen_products = set()

    for risk in pest_risks:
        if risk["risk_level"] in ("Medium", "High"):
            # Extract base pest name for lookup
            pest_name = risk["pest_name"].split("(")[0].strip()
            # Try exact match first, then partial
            products = PESTICIDE_DB.get(pest_name, [])
            if not products:
                for key in PESTICIDE_DB:
                    if key.lower() in pest_name.lower() or pest_name.lower() in key.lower():
                        products = PESTICIDE_DB[key]
                        break

            for product in products:
                if product["product"] not in seen_products:
                    seen_products.add(product["product"])
                    recommendations.append({
                        "product_name": product["product"],
                        "type": product["type"],
                        "dosage": product["dosage"],
                        "target_pest": product["target"],
                        "safety_interval_days": product["phi_days"],
                        "precautions": product["precautions"],
                        "for_pest": risk["pest_name"],
                        "risk_level": risk["risk_level"],
                    })

    # Sort: bio-control first, then chemical
    type_order = {"Bio-control": 0, "Chemical": 1}
    recommendations.sort(key=lambda x: type_order.get(x["type"], 2))

    return recommendations


def get_full_recommendation(request_data):
    """Orchestrate all recommendations into a single response."""
    crop = request_data["crop"]
    growth_stage = request_data["growth_stage"]
    soil_type = request_data.get("soil_type")
    temperature = request_data.get("temperature", 25)
    humidity = request_data.get("humidity", 70)
    rainfall = request_data.get("rainfall", 100)
    state = request_data.get("state", "")
    district = request_data.get("district", "")

    # 1. Fertilizer recommendations
    fert_result = get_fertilizer_recommendation(crop, growth_stage, soil_type)

    # 2. Pest/disease risk analysis
    pest_risks = get_pest_risk_analysis(crop, growth_stage, temperature, humidity, rainfall)

    # 3. Pesticide recommendations (only if risks exist)
    pesticide_recs = get_pesticide_recommendations(crop, pest_risks)

    # Count risks by level
    high_risks = sum(1 for r in pest_risks if r["risk_level"] == "High")
    medium_risks = sum(1 for r in pest_risks if r["risk_level"] == "Medium")

    # Build overall risk summary
    if high_risks > 0:
        overall_risk = "High"
        risk_summary = f"{high_risks} high-risk and {medium_risks} medium-risk pest/disease threats detected for your current conditions."
    elif medium_risks > 0:
        overall_risk = "Medium"
        risk_summary = f"{medium_risks} medium-risk pest/disease threats detected. Monitor closely."
    else:
        overall_risk = "Low"
        risk_summary = "Low pest/disease pressure expected under current weather conditions."

    return {
        "crop": crop,
        "growth_stage": growth_stage,
        "state": state,
        "district": district,
        "soil_type": soil_type or "Not specified",
        "fertilizers": {
            "current_stage": fert_result["current_stage_fertilizers"],
            "basal_reference": fert_result["basal_reference"],
            "total_npk": fert_result["total_npk"],
            "soil_amendment": fert_result["soil_amendment"],
        },
        "pest_risks": pest_risks,
        "overall_risk": overall_risk,
        "risk_summary": risk_summary,
        "pesticides": pesticide_recs,
        "safety_precautions": SAFETY_PRECAUTIONS,
    }
