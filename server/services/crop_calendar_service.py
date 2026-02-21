"""
SmartAgri AI - Crop Calendar & Task Scheduler Service
===========================================================
Layer 1: Crop Knowledge  — Real scientific growth timelines
Layer 2: Personalization — Sowing date → real calendar dates
Layer 3: Intelligence    — Weather-adjusted task modification
Layer 4: Action          — Prioritized, actionable task list
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from services.weather_service import get_weather_service


# ──────────────────────────────────────────────────────────────
# LAYER 1: CROP KNOWLEDGE — Scientific task timelines
# Based on ICAR (Indian Council of Agricultural Research) data
# ──────────────────────────────────────────────────────────────

# Task urgency categories
URGENT = "urgent"       # Do it today / tomorrow
UPCOMING = "upcoming"   # Do it within 3 days
SCHEDULED = "scheduled" # Planned ahead
DONE = "done"           # Past tasks (completed)

CROP_TIMELINES: Dict[str, Dict] = {
    "Wheat": {
        "growth_days": 120,
        "water_source_factor": {"Canal": 0.9, "Borewell": 1.0, "Rainfed": 1.2},
        "tasks": [
            {"day": 0,   "type": "sowing",      "title": "Sowing Day",            "desc": "Complete sowing with seed rate 100–125 kg/ha. Ensure soil moisture.", "icon": "🌱", "category": "planting"},
            {"day": 5,   "type": "check",       "title": "Germination Check",     "desc": "Check for uniform germination (80%+ expected). Re-sow bare patches.",  "icon": "🔍", "category": "monitoring"},
            {"day": 21,  "type": "irrigation",  "title": "First Irrigation (CRI)","desc": "Crown Root Initiation stage. Apply 5–6 cm water. Critical for tillering.", "icon": "💧", "category": "irrigation"},
            {"day": 25,  "type": "fertilizer",  "title": "Nitrogen Top Dressing", "desc": "Apply 1/3 of N dose (50 kg Urea/ha). Best absorbed during tillering.", "icon": "🧪", "category": "nutrition"},
            {"day": 42,  "type": "irrigation",  "title": "Second Irrigation",     "desc": "Tillering stage. Apply 6 cm water. Skip if rainfall > 25 mm in last 5 days.", "icon": "💧", "category": "irrigation"},
            {"day": 60,  "type": "pest",        "title": "Aphid & Rust Scouting", "desc": "Inspect flag leaf for yellow rust, brown rust, and aphid colonies. Act if 5+ aphids/tiller.", "icon": "🐛", "category": "pest"},
            {"day": 65,  "type": "irrigation",  "title": "Jointing Stage Water",  "desc": "Most critical irrigation. Apply 7 cm. Stress here reduces yield 30–40%.", "icon": "💧", "category": "irrigation"},
            {"day": 75,  "type": "irrigation",  "title": "Booting Stage Water",   "desc": "Apply 6 cm water. Ear emergence happening — maintain moisture.", "icon": "💧", "category": "irrigation"},
            {"day": 90,  "type": "check",       "title": "Grain Filling Check",   "desc": "Inspect for loose smut, karnal bunt. Monitor ear weight and color.", "icon": "🌾", "category": "monitoring"},
            {"day": 100, "type": "irrigation",  "title": "Pre-Harvest Irrigation","desc": "Last irrigation (dough stage). Stop 3 weeks before harvest to harden grain.", "icon": "💧", "category": "irrigation"},
            {"day": 110, "type": "check",       "title": "Harvest Readiness",     "desc": "Golden-yellow color, straw dried, grain moisture < 14%. Arrange harvester.", "icon": "✅", "category": "harvest"},
            {"day": 118, "type": "harvest",     "title": "Harvest Window Opens",  "desc": "Begin harvest. Avoid delay — shattering losses increase 1% per day overdue.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Rice": {
        "growth_days": 135,
        "water_source_factor": {"Canal": 0.95, "Borewell": 1.0, "Rainfed": 1.1},
        "tasks": [
            {"day": 0,   "type": "sowing",     "title": "Transplanting Day",      "desc": "Transplant 21–25 day old seedlings. 2–3 seedlings/hill, 20×15 cm spacing.", "icon": "🌱", "category": "planting"},
            {"day": 7,   "type": "check",      "title": "Establishment Check",    "desc": "Check for dead hills. Gap fill within 10 days. Maintain 2–3 cm water.",    "icon": "🔍", "category": "monitoring"},
            {"day": 15,  "type": "fertilizer", "title": "Basal N-P-K Application","desc": "Apply 60:40:40 NPK kg/ha. Incorporate into puddled soil before planting.", "icon": "🧪", "category": "nutrition"},
            {"day": 25,  "type": "pest",       "title": "BPH & Stem Borer Scout", "desc": "Check for brown planthopper, stem borer dead-hearts. Economic threshold: 1 egg mass/m².", "icon": "🐛", "category": "pest"},
            {"day": 30,  "type": "fertilizer", "title": "Top Dress Nitrogen",     "desc": "Apply 1/3 N (50 kg Urea/ha) at active tillering. Drain field 1 day before.", "icon": "🧪", "category": "nutrition"},
            {"day": 45,  "type": "irrigation", "title": "Maintain Flood Depth",   "desc": "Keep 5 cm standing water. Drain for 3 days at mid-tillering for aeration.", "icon": "💧", "category": "irrigation"},
            {"day": 60,  "type": "fertilizer", "title": "Panicle Init. Dressing", "desc": "Apply final 1/3 N + K (30 kg Urea + 20 kg MOP). Critical for panicle size.", "icon": "🧪", "category": "nutrition"},
            {"day": 75,  "type": "pest",       "title": "Neck Blast Monitoring",  "desc": "Check for blast symptoms at panicle initiation. High humidity = high risk.", "icon": "🐛", "category": "pest"},
            {"day": 90,  "type": "check",      "title": "Heading Stage Check",    "desc": "Note heading date. Maintain 3 cm water through grain filling stage.",        "icon": "🌾", "category": "monitoring"},
            {"day": 110, "type": "irrigation", "title": "Stop Irrigation",        "desc": "Drain field 15 days before harvest. Soil should crack lightly at harvest.", "icon": "💧", "category": "irrigation"},
            {"day": 125, "type": "check",      "title": "Harvest Readiness",      "desc": "80% grains golden-yellow. Grain moisture 20–22%. Arrange combine harvester.", "icon": "✅", "category": "harvest"},
            {"day": 132, "type": "harvest",    "title": "Harvest Window Opens",   "desc": "Begin harvest immediately. Delay causes grain shattering and quality loss.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Cotton": {
        "growth_days": 180,
        "water_source_factor": {"Canal": 0.9, "Borewell": 1.0, "Rainfed": 1.15},
        "tasks": [
            {"day": 0,   "type": "sowing",     "title": "Sowing Day",             "desc": "Sow Bt cotton seeds. 1 seed/hill, 90×60 cm spacing. Soil temp > 18°C.", "icon": "🌱", "category": "planting"},
            {"day": 10,  "type": "check",      "title": "Germination & Gap Fill", "desc": "Check germination (≥90%). Re-sow if gaps. 2–3 plants/ft² not needed in cotton.", "icon": "🔍", "category": "monitoring"},
            {"day": 30,  "type": "fertilizer", "title": "First N-P-K Dressing",  "desc": "Apply 25:50:25 NPK 30 DAS. Incorporate near root zone.", "icon": "🧪", "category": "nutrition"},
            {"day": 45,  "type": "irrigation", "title": "Square Formation Water", "desc": "Critical water need at squaring. Check for moisture stress — wilting in afternoon.", "icon": "💧", "category": "irrigation"},
            {"day": 50,  "type": "pest",       "title": "Bollworm Scouting",      "desc": "Check bolls for pink and American bollworm. Set pheromone traps (5/ha).", "icon": "🐛", "category": "pest"},
            {"day": 60,  "type": "fertilizer", "title": "Second N Top Dress",     "desc": "Apply 50 kg Urea/ha at boll development. Reduces boll shedding.", "icon": "🧪", "category": "nutrition"},
            {"day": 75,  "type": "irrigation", "title": "Boll Dev. Irrigation",   "desc": "Maintain soil moisture during boll swelling. Moisture stress now = 25% yield loss.", "icon": "💧", "category": "irrigation"},
            {"day": 90,  "type": "pest",       "title": "Whitefly & Jassid Check","desc": "Inspect for whitefly, jassid, thrips under leaves. Spray if 2+ per leaf.", "icon": "🐛", "category": "pest"},
            {"day": 120, "type": "check",      "title": "Boll Opening Check",     "desc": "Monitor first boll opening. Begin harvesting when 60% bolls open.", "icon": "✅", "category": "harvest"},
            {"day": 130, "type": "harvest",    "title": "First Picking",          "desc": "Pick fully open bolls (fluffy, white). 3–4 pickings needed. Do in morning.", "icon": "🌾", "category": "harvest"},
            {"day": 160, "type": "harvest",    "title": "Second Picking",         "desc": "Second major picking. Check for unevenly opened bolls.", "icon": "🌾", "category": "harvest"},
            {"day": 175, "type": "harvest",    "title": "Final Picking",          "desc": "Collect remaining bolls. Prepare for field clearing and next season.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Sugarcane": {
        "growth_days": 365,
        "water_source_factor": {"Canal": 0.85, "Borewell": 1.0, "Rainfed": 1.3},
        "tasks": [
            {"day": 0,   "type": "sowing",     "title": "Planting Day",           "desc": "Plant 2-3 budded setts, 75 cm row spacing. Apply FYM 25 t/ha before planting.", "icon": "🌱", "category": "planting"},
            {"day": 15,  "type": "check",      "title": "Germination Check",      "desc": "Check germination (>70%). Gap fill with nearby tillers if needed.",    "icon": "🔍", "category": "monitoring"},
            {"day": 30,  "type": "fertilizer", "title": "First N Application",   "desc": "Apply 1/3 N (60 kg Urea/ha) + full P + 1/3 K. Incorporate with soil.", "icon": "🧪", "category": "nutrition"},
            {"day": 60,  "type": "irrigation", "title": "Tillering Water",       "desc": "Irrigate at 7–10 day intervals. Maintain 6–8 cm water during tillering.", "icon": "💧", "category": "irrigation"},
            {"day": 90,  "type": "fertilizer", "title": "Second N-K Dressing",   "desc": "Apply 60 kg Urea + 40 kg MOP/ha. Earthing-up to support cane stalks.", "icon": "🧪", "category": "nutrition"},
            {"day": 120, "type": "pest",       "title": "Early Shoot Borer Scout","desc": "Check dead-hearts in young cane. Spray chlorpyrifos if >5% infestation.", "icon": "🐛", "category": "pest"},
            {"day": 150, "type": "fertilizer", "title": "Final N Top Dress",     "desc": "Last N application (60 kg Urea/ha). After this, no more N to avoid lodging.", "icon": "🧪", "category": "nutrition"},
            {"day": 180, "type": "irrigation", "title": "Grand Growth Irrigation","desc": "Peak water demand phase. Irrigate at 10-day intervals. No drought stress.", "icon": "💧", "category": "irrigation"},
            {"day": 270, "type": "check",      "title": "Maturity Brix Check",   "desc": "Measure juice Brix (>18%) and purity (>85%). Arrange transport to mill.", "icon": "✅", "category": "monitoring"},
            {"day": 330, "type": "irrigation", "title": "Stop Irrigation",       "desc": "Suspend irrigation 30 days before harvest to improve sucrose concentration.", "icon": "💧", "category": "irrigation"},
            {"day": 355, "type": "harvest",    "title": "Harvest Ready",         "desc": "Crush angle >30°, Brix>20, juice pH 5–5.5. Coordinate with sugar mill.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Maize": {
        "growth_days": 100,
        "water_source_factor": {"Canal": 0.9, "Borewell": 1.0, "Rainfed": 1.1},
        "tasks": [
            {"day": 0,  "type": "sowing",     "title": "Sowing Day",              "desc": "Sow hybrid maize at 60×20 cm spacing. Seed rate 18–20 kg/ha. 5 cm depth.", "icon": "🌱", "category": "planting"},
            {"day": 7,  "type": "check",      "title": "Germination Check",       "desc": "Check seedling emergence. Thin to 1 plant/hill if > 2 emerged.", "icon": "🔍", "category": "monitoring"},
            {"day": 25, "type": "fertilizer", "title": "First N Top Dress",      "desc": "Apply 60 kg Urea/ha at knee-high stage. Band placement near row.", "icon": "🧪", "category": "nutrition"},
            {"day": 35, "type": "irrigation", "title": "Knee-High Irrigation",   "desc": "Apply irrigation if rainfall < 25 mm/week. Maize is highly drought sensitive.", "icon": "💧", "category": "irrigation"},
            {"day": 45, "type": "pest",       "title": "Fall Armyworm Scouting", "desc": "Check whorl for FAW frass and damage. 'Window pane' damage = early attack.", "icon": "🐛", "category": "pest"},
            {"day": 55, "type": "fertilizer", "title": "Second N Top Dress",     "desc": "Apply 40 kg Urea/ha at tasseling for grain weight.", "icon": "🧪", "category": "nutrition"},
            {"day": 60, "type": "irrigation", "title": "Silking Stage Water",    "desc": "Most critical irrigation. Apply immediately at silk emergence. Stress = barren cobs.", "icon": "💧", "category": "irrigation"},
            {"day": 75, "type": "irrigation", "title": "Grain Fill Water",       "desc": "Second most critical irrigation. Maintain during milky grain stage.", "icon": "💧", "category": "irrigation"},
            {"day": 90, "type": "check",      "title": "Harvest Readiness",      "desc": "Black layer formation at cob base. Grain hard, husk dry. Moisture <25%.", "icon": "✅", "category": "harvest"},
            {"day": 97, "type": "harvest",    "title": "Harvest Window Opens",   "desc": "Break cobs manually or mechanically harvest. Process < 3 days to avoid mold.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Tomato": {
        "growth_days": 90,
        "water_source_factor": {"Canal": 0.9, "Borewell": 1.0, "Rainfed": 1.2},
        "tasks": [
            {"day": 0,  "type": "sowing",     "title": "Transplanting Day",       "desc": "Transplant 25-30 day old seedlings. 60×45 cm spacing. Water immediately.", "icon": "🌱", "category": "planting"},
            {"day": 5,  "type": "irrigation", "title": "Establishment Water",     "desc": "Light irrigation every 2 days until plants stand upright (7–10 days).", "icon": "💧", "category": "irrigation"},
            {"day": 15, "type": "fertilizer", "title": "Starter NPK Dose",       "desc": "Apply 50:75:50 NPK kg/ha. Use water-soluble fertilizers for quick uptake.", "icon": "🧪", "category": "nutrition"},
            {"day": 25, "type": "pest",       "title": "Leafminer & Mite Scout", "desc": "Check underside of leaves for spider mites, leafminers. High humidity = thrips risk.", "icon": "🐛", "category": "pest"},
            {"day": 30, "type": "fertilizer", "title": "Pre-Flower Dress",       "desc": "Apply 30 kg Urea + 20 kg SOP/ha. Stake and tie plants before flowering.", "icon": "🧪", "category": "nutrition"},
            {"day": 40, "type": "irrigation", "title": "Flowering Stage Water",  "desc": "Maintain consistent soil moisture. Irregular watering causes blossom-end rot.", "icon": "💧", "category": "irrigation"},
            {"day": 45, "type": "pest",       "title": "Fruit Borer Monitoring", "desc": "Place pheromone traps. Spray spinosad if > 1 moth/trap/day.", "icon": "🐛", "category": "pest"},
            {"day": 55, "type": "fertilizer", "title": "Fruit Set Nutrition",    "desc": "Spray 0.5% Boron + CaNO3 solution. Prevents cracking and improves shelf life.", "icon": "🧪", "category": "nutrition"},
            {"day": 70, "type": "check",      "title": "Fruit Maturity Check",   "desc": "Check color break (green→yellow-red). Harvest at breaker stage for transport.", "icon": "✅", "category": "harvest"},
            {"day": 78, "type": "harvest",    "title": "First Harvest",          "desc": "Pick mature-green to breaker stage. 5–7 pickings over 20 days.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Soybean": {
        "growth_days": 110,
        "water_source_factor": {"Canal": 0.95, "Borewell": 1.0, "Rainfed": 1.05},
        "tasks": [
            {"day": 0,  "type": "sowing",     "title": "Sowing Day",              "desc": "Sow inoculated seeds (Bradyrhizobium). 45×5 cm spacing. 70–80 kg/ha.", "icon": "🌱", "category": "planting"},
            {"day": 7,  "type": "check",      "title": "Germination Check",       "desc": "Check for 80%+ germination. Note weed pressure — critical first 3 weeks.", "icon": "🔍", "category": "monitoring"},
            {"day": 20, "type": "fertilizer", "title": "P-K Top Dress",           "desc": "Apply 60 kg SSP + 30 kg MOP/ha. No extra N needed — N-fixation handles it.", "icon": "🧪", "category": "nutrition"},
            {"day": 35, "type": "irrigation", "title": "Branching Stage Water",   "desc": "Critical irrigation at branching. Rainfed farmers: watch for August dry spells.", "icon": "💧", "category": "irrigation"},
            {"day": 45, "type": "pest",       "title": "Girdle Beetle Scouting", "desc": "Look for stem girdling (2 cuts on stem). Larvae tunnel inside — spray at 2%.", "icon": "🐛", "category": "pest"},
            {"day": 60, "type": "irrigation", "title": "Flowering Stage Water",   "desc": "Most yield-critical period. Ensure irrigation before pod set. 5 cm water.", "icon": "💧", "category": "irrigation"},
            {"day": 75, "type": "pest",       "title": "Pod Borer Check",        "desc": "Check pods for biting marks. Spray Quinalphos 0.05% if >EA threshold.", "icon": "🐛", "category": "pest"},
            {"day": 90, "type": "check",      "title": "Pod Fill Monitoring",    "desc": "Weigh sample pods. Check for dry matter accumulation. Stop irrigation now.", "icon": "✅", "category": "monitoring"},
            {"day": 105, "type": "harvest",   "title": "Harvest Window Opens",   "desc": "Leaves shed, pods rattle on shaking. Moisture < 15%. Use combine or manual.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Mustard": {
        "growth_days": 110,
        "water_source_factor": {"Canal": 0.9, "Borewell": 1.0, "Rainfed": 1.15},
        "tasks": [
            {"day": 0,  "type": "sowing",     "title": "Sowing Day",              "desc": "Sow in rows 30–45 cm apart. 4–5 kg seed/ha. Thin to 10–15 cm within rows.", "icon": "🌱", "category": "planting"},
            {"day": 15, "type": "fertilizer", "title": "Nitrogen Topdress",       "desc": "Apply 40 kg Urea/ha (half of N). Apply after thinning & weeding.", "icon": "🧪", "category": "nutrition"},
            {"day": 25, "type": "irrigation", "title": "Branch Initiation Water", "desc": "First critical irrigation at branch initiation stage (25–30 DAS).", "icon": "💧", "category": "irrigation"},
            {"day": 35, "type": "pest",       "title": "Aphid Scouting",          "desc": "Aphids multiply rapidly in cool dry weather. Spray Dimethoate if 30+ per plant.", "icon": "🐛", "category": "pest"},
            {"day": 40, "type": "fertilizer", "title": "Second N Dose",           "desc": "Remaining N dose. Apply at 40 DAS for pod fill support.", "icon": "🧪", "category": "nutrition"},
            {"day": 50, "type": "irrigation", "title": "Flowering Stage Water",   "desc": "Critical for pod set. One irrigation at 50% flowering is essential.", "icon": "💧", "category": "irrigation"},
            {"day": 75, "type": "irrigation", "title": "Pod Fill Irrigation",     "desc": "Final irrigation. Moisture stress during pod fill reduces oil content.", "icon": "💧", "category": "irrigation"},
            {"day": 100, "type": "check",     "title": "Harvest Readiness",       "desc": "Seeds turn brown, pods crackle on touch. Grain moisture < 12%.", "icon": "✅", "category": "harvest"},
            {"day": 107, "type": "harvest",   "title": "Harvest Window Opens",    "desc": "Cut early morning to reduce shattering loss. Thresh after 2–3 days drying.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Chickpea": {
        "growth_days": 110,
        "water_source_factor": {"Canal": 0.9, "Borewell": 1.0, "Rainfed": 1.05},
        "tasks": [
            {"day": 0,  "type": "sowing",     "title": "Sowing Day",              "desc": "Sow Desi or Kabuli varieties. 30 cm rows, 10 cm within. 80–100 kg/ha.", "icon": "🌱", "category": "planting"},
            {"day": 10, "type": "check",      "title": "Emergence & Weed Check",  "desc": "Post-emergence herbicide if required. Manual weeding at 15–20 DAS.", "icon": "🔍", "category": "monitoring"},
            {"day": 25, "type": "fertilizer", "title": "Low N + Full P Dose",     "desc": "Apply 20 kg Urea + 60 kg SSP/ha. Rhizobium inoculation reduces N need.", "icon": "🧪", "category": "nutrition"},
            {"day": 40, "type": "pest",       "title": "Pod Borer Scouting",      "desc": "Helicoverpa armigera is key pest. Use Helilure pheromone traps. Spray at 2 moths/trap/day.", "icon": "🐛", "category": "pest"},
            {"day": 55, "type": "irrigation", "title": "Flower Irrigation",       "desc": "Light irrigation at flowering (45–55 DAS). Avoid waterlogging.", "icon": "💧", "category": "irrigation"},
            {"day": 70, "type": "check",      "title": "Pod Set Monitoring",      "desc": "Count pods per plant (target >30 for kabuli). Check for collar rot.", "icon": "✅", "category": "monitoring"},
            {"day": 100, "type": "check",     "title": "Harvest Readiness",       "desc": "Leaves dry, pods hard, seeds firm. Grain moisture 10–12%.", "icon": "✅", "category": "harvest"},
            {"day": 108, "type": "harvest",   "title": "Harvest Window",          "desc": "Pull up or cut plants. Dry under sun for 2–3 days. Thresh with tractor.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Potato": {
        "growth_days": 90,
        "water_source_factor": {"Canal": 0.9, "Borewell": 1.0, "Rainfed": 1.2},
        "tasks": [
            {"day": 0,  "type": "sowing",     "title": "Planting Day",            "desc": "Plant certified seed tubers (50–60g) in furrows 60 cm apart, 25 cm in-row.", "icon": "🌱", "category": "planting"},
            {"day": 10, "type": "check",      "title": "Sprout Emergence Check",  "desc": "Check for 90%+ emergence. Gap fill immediately with sprouted tubers.", "icon": "🔍", "category": "monitoring"},
            {"day": 20, "type": "fertilizer", "title": "NPK Basal Application",   "desc": "Apply 120:80:120 NPK kg/ha. Earthing-up at 20 and 40 DAS for tuber protection.", "icon": "🧪", "category": "nutrition"},
            {"day": 30, "type": "irrigation", "title": "Stolon Initiation Water", "desc": "Critical stage — 6 cm irrigation every 7 days. Irregular watering = misshapen tubers.", "icon": "💧", "category": "irrigation"},
            {"day": 40, "type": "pest",       "title": "Late Blight Scouting",    "desc": "Check for water-soaked lesions on leaves. High humidity + cool night = blight risk.", "icon": "🐛", "category": "pest"},
            {"day": 50, "type": "fertilizer", "title": "Potassium Top Dress",     "desc": "Apply 30 kg MOP/ha during bulking. Potassium improves tuber quality and skin.", "icon": "🧪", "category": "nutrition"},
            {"day": 60, "type": "irrigation", "title": "Bulking Stage Water",     "desc": "Critical tuber bulking. Apply 6 cm every 7–10 days. Avoid over-watering.", "icon": "💧", "category": "irrigation"},
            {"day": 80, "type": "check",      "title": "Harvest Readiness",       "desc": "Haulm dry/yellowing, skin set (doesn't peel on rubbing). Stop irrigation 7 days early.", "icon": "✅", "category": "harvest"},
            {"day": 87, "type": "harvest",    "title": "Harvest Window Opens",    "desc": "Harvest in cool morning. Avoid bruising. Store at 4°C or market immediately.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Onion": {
        "growth_days": 130,
        "water_source_factor": {"Canal": 0.9, "Borewell": 1.0, "Rainfed": 1.25},
        "tasks": [
            {"day": 0,  "type": "sowing",     "title": "Transplanting Day",       "desc": "Transplant 6–8 week old seedlings. 15×10 cm spacing. Remove excess leaves.", "icon": "🌱", "category": "planting"},
            {"day": 7,  "type": "irrigation", "title": "Establishment Water",     "desc": "Light irrigation every 3 days until established (10–12 days).", "icon": "💧", "category": "irrigation"},
            {"day": 20, "type": "fertilizer", "title": "First N Dose",            "desc": "Apply 50 kg Urea/ha. Avoid N deficiency — pale leaves = slow bulbing.", "icon": "🧪", "category": "nutrition"},
            {"day": 40, "type": "fertilizer", "title": "Second N-K Dose",         "desc": "Apply 50 kg Urea + 30 kg SOP/ha at 40 DAS. Critical for bulb size.", "icon": "🧪", "category": "nutrition"},
            {"day": 50, "type": "pest",       "title": "Thrips Monitoring",       "desc": "Silvery patches on leaves = thrips. Spray spinosad or fipronil at >15/plant.", "icon": "🐛", "category": "pest"},
            {"day": 70, "type": "irrigation", "title": "Bulbing Stage Water",     "desc": "Bulb initiation starts. Irrigate at 7-day intervals. Moisture stress = poor bulbing.", "icon": "💧", "category": "irrigation"},
            {"day": 100, "type": "irrigation","title": "Stop Irrigation",         "desc": "Stop irrigation 2 weeks before harvest. Allows bulbs to firm and increase pungency.", "icon": "💧", "category": "irrigation"},
            {"day": 118, "type": "check",     "title": "Harvest Readiness",       "desc": "50%+ neck fall (tops falling over). Bulbs brown, tops dried.", "icon": "✅", "category": "harvest"},
            {"day": 125, "type": "harvest",   "title": "Harvest Window Opens",    "desc": "Lift bulbs gently. Cure in windrows for 10 days before storage or sale.", "icon": "🌾", "category": "harvest"},
        ]
    },
    "Groundnut": {
        "growth_days": 120,
        "water_source_factor": {"Canal": 0.9, "Borewell": 1.0, "Rainfed": 1.1},
        "tasks": [
            {"day": 0,  "type": "sowing",     "title": "Sowing Day",              "desc": "Sow 3–4 seeds/hill, 30×10 cm spacing. Seed rate 100–120 kg/ha (shelled).", "icon": "🌱", "category": "planting"},
            {"day": 10, "type": "check",      "title": "Germination Check",       "desc": "Check germination (>75%). Early rains can cause crusting — break crust gently.", "icon": "🔍", "category": "monitoring"},
            {"day": 25, "type": "fertilizer", "title": "Lime + Calcium Dose",     "desc": "Apply 250 kg/ha gypsum (calcium sulfate) at pegging for kernel fill.", "icon": "🧪", "category": "nutrition"},
            {"day": 35, "type": "irrigation", "title": "Peg Initiation Water",    "desc": "Critical — pegs (gynophores) need moist, loose soil to penetrate.", "icon": "💧", "category": "irrigation"},
            {"day": 50, "type": "pest",       "title": "Tikka Disease Scouting",  "desc": "Check for early/late leaf spot (Tikka). Spray Chlorothalonil if >50% infections.", "icon": "🐛", "category": "pest"},
            {"day": 65, "type": "irrigation", "title": "Pod Fill Irrigation",     "desc": "Most critical irrigation for groundnut. Ensure 6 cm before pod swelling.", "icon": "💧", "category": "irrigation"},
            {"day": 90, "type": "check",      "title": "Maturity Test",           "desc": "Pull sample plants. Inner pod wall should show dark veins — maturity marker.", "icon": "✅", "category": "monitoring"},
            {"day": 110, "type": "harvest",   "title": "Harvest Window Opens",    "desc": "Dig when 65–70% pods mature. Shake off soil, dry 3–4 days, stack for curing.", "icon": "🌾", "category": "harvest"},
        ]
    },
}


# ──────────────────────────────────────────────────────────────
# LAYER 2: PERSONALIZATION — Sowing date → Real dates
# ──────────────────────────────────────────────────────────────

def generate_schedule(
    crop_name: str,
    sowing_date: str,  # "YYYY-MM-DD"
    state: str,
    water_source: str = "Rainfed",
) -> Dict:
    """Convert crop timeline to real calendar dates with weather intelligence."""
    crop = CROP_TIMELINES.get(crop_name)
    if not crop:
        return {"error": f"Crop '{crop_name}' not found in calendar system."}

    try:
        sow_date = datetime.strptime(sowing_date, "%Y-%m-%d")
    except ValueError:
        return {"error": "Invalid sowing date. Use YYYY-MM-DD format."}

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Get weather for intelligence layer
    weather_svc = get_weather_service()
    current_weather = weather_svc.get_current(state)
    forecast = weather_svc.get_forecast(state, days=7)

    # Build forecast lookup
    forecast_map: Dict[str, Dict] = {}
    for f in forecast:
        forecast_map[f["date"]] = f

    tasks = []
    for task_def in crop["tasks"]:
        target_date = sow_date + timedelta(days=task_def["day"])

        # LAYER 3: Intelligence — Weather adjustment
        adjustment, alert, adjusted_date = _apply_weather_intelligence(
            task_def, target_date, forecast_map, current_weather
        )

        days_from_today = (adjusted_date - today).days

        if days_from_today < -3:
            status = DONE
        elif days_from_today < 0:
            status = URGENT  # overdue
        elif days_from_today <= 1:
            status = URGENT
        elif days_from_today <= 4:
            status = UPCOMING
        else:
            status = SCHEDULED

        tasks.append({
            "day": task_def["day"],
            "type": task_def["type"],
            "category": task_def["category"],
            "title": task_def["title"],
            "desc": task_def["desc"],
            "icon": task_def["icon"],
            "original_date": target_date.strftime("%Y-%m-%d"),
            "adjusted_date": adjusted_date.strftime("%Y-%m-%d"),
            "date_label": _format_date_label(adjusted_date, today),
            "days_from_today": days_from_today,
            "status": status,
            "weather_alert": alert,
            "adjustment_reason": adjustment,
            "is_adjusted": target_date.date() != adjusted_date.date(),
        })

    # Sort by date
    tasks.sort(key=lambda t: t["days_from_today"])

    # Find next urgent task
    next_task = next((t for t in tasks if t["status"] in [URGENT, UPCOMING]), None)

    # Overall crop progress
    total_days = crop["growth_days"]
    days_elapsed = max(0, (today - sow_date).days)
    progress_pct = min(100, round((days_elapsed / total_days) * 100))

    # Crop phase
    phase = _get_crop_phase(days_elapsed, total_days)

    return {
        "crop": crop_name,
        "sowing_date": sowing_date,
        "state": state,
        "water_source": water_source,
        "growth_days": total_days,
        "days_elapsed": days_elapsed,
        "progress_pct": progress_pct,
        "current_phase": phase,
        "harvest_date": (sow_date + timedelta(days=total_days)).strftime("%Y-%m-%d"),
        "next_task": next_task,
        "tasks": tasks,
        "weather_summary": {
            "temperature": current_weather.get("temperature"),
            "humidity": current_weather.get("humidity"),
            "description": current_weather.get("description"),
            "rainfall": current_weather.get("rainfall"),
        },
        "upcoming_tasks": [t for t in tasks if t["status"] in [URGENT, UPCOMING]][:5],
        "generated_at": today.strftime("%Y-%m-%d"),
    }


# ──────────────────────────────────────────────────────────────
# LAYER 3: INTELLIGENCE — Weather-based task adjustment
# ──────────────────────────────────────────────────────────────

def _apply_weather_intelligence(
    task: Dict,
    target_date: datetime,
    forecast_map: Dict,
    current_weather: Dict,
) -> tuple:
    """Returns (adjustment_reason, alert_message, adjusted_date)."""
    adjustment = None
    alert = None
    adjusted_date = target_date

    # Look at forecast for target date ±2 days
    check_date = target_date
    forecast_day = forecast_map.get(check_date.strftime("%Y-%m-%d"), {})
    forecast_rain = forecast_day.get("rainfall", 0)
    forecast_temp = forecast_day.get("temp_max", current_weather.get("temperature", 28))
    forecast_humidity = forecast_day.get("humidity", current_weather.get("humidity", 70))

    task_type = task["type"]

    # Fertilizer intelligence
    if task_type == "fertilizer":
        if forecast_rain > 25:
            adjusted_date = target_date + timedelta(days=2)
            adjustment = f"Rescheduled +2 days: heavy rain expected ({forecast_rain:.0f}mm). Fertilizer will wash off."
            alert = f"⚠️ Heavy rain expected — fertilizer delayed to avoid runoff loss"
        elif forecast_rain < 3 and forecast_temp > 38:
            alert = "🌡️ Heatwave alert — apply fertilizer in early morning (before 8am)"

    # Irrigation intelligence
    elif task_type == "irrigation":
        if forecast_rain > 30:
            adjusted_date = target_date + timedelta(days=3)
            adjustment = f"Rescheduled +3 days: heavy rainfall expected ({forecast_rain:.0f}mm). Skip irrigation."
            alert = f"💧 Rain of {forecast_rain:.0f}mm forecasted — irrigation not needed this week"
        elif forecast_rain > 15:
            adjusted_date = target_date + timedelta(days=1)
            adjustment = f"Rescheduled +1 day: moderate rain ({forecast_rain:.0f}mm) expected."
            alert = f"🌧️ Moderate rain expected — check soil moisture before irrigating"
        elif forecast_temp > 40:
            adjusted_date = target_date - timedelta(days=1)
            adjustment = "Moved up 1 day: heatwave forecast — early irrigation needed."
            alert = "🔥 Heatwave alert — irrigate before 7am to reduce evaporation loss"

    # Pest scouting intelligence
    elif task_type == "pest":
        if forecast_humidity > 85 and forecast_rain > 10:
            alert = "🍄 High humidity + rain = ideal fungal disease conditions. Inspect urgently!"
        elif forecast_temp < 15:
            alert = "❄️ Cold temperature may slow pest activity, but check for dormant infestations"
        elif forecast_temp > 35 and forecast_humidity < 50:
            alert = "🕷️ Hot dry conditions favor spider mites and thrips. Check undersides of leaves."

    # Harvest intelligence
    elif task_type == "harvest":
        if forecast_rain > 20:
            adjusted_date = target_date + timedelta(days=2)
            adjustment = f"Rescheduled: rain forecast ({forecast_rain:.0f}mm) may cause grain quality loss."
            alert = f"⛈️ Rain in harvest window — plan for after-rain harvest or rush before it arrives"
        elif forecast_humidity > 80:
            alert = "💧 High humidity — harvest in dry hours (10am–4pm) to reduce moisture content"

    return adjustment, alert, adjusted_date


# ──────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────

def _format_date_label(date: datetime, today: datetime) -> str:
    days = (date - today).days
    if days == 0:
        return "Today"
    elif days == 1:
        return "Tomorrow"
    elif days == -1:
        return "Yesterday (Overdue)"
    elif days < -1:
        return f"{abs(days)} days ago"
    elif days <= 7:
        return f"In {days} days ({date.strftime('%A')})"
    else:
        return date.strftime("%d %b %Y")


def _get_crop_phase(days_elapsed: int, total_days: int) -> str:
    pct = days_elapsed / total_days if total_days > 0 else 0
    if pct <= 0:
        return "Pre-Season"
    elif pct < 0.15:
        return "Germination & Establishment"
    elif pct < 0.35:
        return "Vegetative Growth"
    elif pct < 0.55:
        return "Flowering & Pollination"
    elif pct < 0.75:
        return "Grain / Fruit Filling"
    elif pct < 0.9:
        return "Maturation"
    elif pct < 1.05:
        return "Harvest Ready"
    else:
        return "Post-Harvest"


def get_supported_crops() -> List[str]:
    return sorted(CROP_TIMELINES.keys())
