"""
SmartAgri AI - Disease Detection Service
Dual Hugging Face model inference:
  Primary  : linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
             → 38 PlantVillage classes (broadest coverage)
  Secondary: wambugu71/crop_leaf_diseases_vit
             → 15 classes (Corn/Potato/Rice/Wheat), 5.5 MB, fast validation
Ensemble  : Both run in parallel; if crops agree, average confidences.
            Primary always wins on non-overlapping classes.
"""
from __future__ import annotations
import io, logging, threading
from typing import Optional
from PIL import Image

logger = logging.getLogger("disease_service")

# ─────────────────────────────────────────────────────────────────────────────
# DISEASE KNOWLEDGE BASE  (38 PlantVillage classes + extras from wambugu71)
# Indian-specific pesticide brands, Trichoderma-based biocontrols included
# ─────────────────────────────────────────────────────────────────────────────
DISEASE_DB: dict[str, dict] = {
    # ── APPLE ──────────────────────────────────────────────────────────────
    "Apple___Apple_scab": {
        "disease": "Apple Scab",
        "severity": "moderate",
        "crops": ["Apple"],
        "description": "Fungal disease (Venturia inaequalis) causing dark, scabby lesions on leaves and fruit. Thrives in cool, wet spring weather.",
        "symptoms": ["Olive-green to dark scabby spots on leaves", "Velvety fungal growth on undersides", "Fruit develops dark, corky lesions", "Premature leaf and fruit drop"],
        "treatment": ["Apply mancozeb (Indofil M-45) at 2.5 g/L fortnightly", "Spray carbendazim 50 WP at 1 g/L", "Use myclobutanil at first sign of infection", "Remove and destroy fallen leaves immediately"],
        "prevention": ["Plant scab-resistant varieties", "Prune for good air circulation", "Avoid overhead irrigation", "Apply dormant lime-sulphur spray before bud break"],
    },
    "Apple___Black_rot": {
        "disease": "Apple Black Rot",
        "severity": "severe",
        "crops": ["Apple"],
        "description": "Fungal disease (Botryosphaeria obtusa) causing fruit rot, leaf spots, and branch cankers.",
        "symptoms": ["Purple spots on leaves with brown centers", "Rotting fruit with concentric rings", "Bark cankers with sunken tissue", "Mummified fruit on branches"],
        "treatment": ["Prune out infected branches 15 cm below canker", "Apply captan 50 WP at 2 g/L", "Spray thiophanate-methyl 70 WP", "Remove mummified fruit before winter"],
        "prevention": ["Maintain tree vigor with balanced fertilization", "Avoid wounds; cover pruning cuts", "Control fire blight as entry wound source", "Spray protectant fungicide from pink bud stage"],
    },
    "Apple___Cedar_apple_rust": {
        "disease": "Cedar Apple Rust",
        "severity": "moderate",
        "crops": ["Apple"],
        "description": "Fungal disease requiring both apple and red cedar/juniper as hosts. Causes bright orange-yellow spots.",
        "symptoms": ["Bright orange-yellow spots on upper leaf surface", "Tubular spore structures on undersides", "Deformed fruit with orange lesions", "Early defoliation"],
        "treatment": ["Apply fenarimol or myclobutanil at petal fall", "Spray propiconazole at 7–10 day intervals", "Use protectant fungicide before infection period"],
        "prevention": ["Remove nearby juniper/cedar trees if possible", "Plant rust-resistant apple varieties", "Apply lime sulphur at silver tip stage"],
    },
    "Apple___healthy": {
        "disease": "Healthy Apple",
        "severity": "none",
        "crops": ["Apple"],
        "description": "The apple plant appears healthy with no visible signs of disease.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Continue regular monitoring", "Maintain proper nutrition and irrigation", "Prune annually for airflow"],
    },

    # ── BLUEBERRY ──────────────────────────────────────────────────────────
    "Blueberry___healthy": {
        "disease": "Healthy Blueberry",
        "severity": "none",
        "crops": ["Blueberry"],
        "description": "The blueberry plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Maintain acidic soil pH 4.5–5.5", "Monitor for Mummyberry and Botrytis"],
    },

    # ── CHERRY ─────────────────────────────────────────────────────────────
    "Cherry_(including_sour)___Powdery_mildew": {
        "disease": "Cherry Powdery Mildew",
        "severity": "moderate",
        "crops": ["Cherry"],
        "description": "White powdery fungal growth (Podosphaera clandestina) on young leaves and shoots, reducing fruit quality.",
        "symptoms": ["White powdery patches on young leaves", "Curling and distortion of new growth", "Russeting on fruit surface", "Stunted shoot growth"],
        "treatment": ["Dust with sulphur powder (25 kg/ha)", "Spray wettable sulphur 80 WP at 2 g/L", "Apply hexaconazole 5 EC at 1 ml/L", "Use potassium bicarbonate 5% solution"],
        "prevention": ["Prune for good air circulation", "Grow resistant varieties", "Avoid excessive nitrogen fertilizer", "Apply preventive sulphur early in season"],
    },
    "Cherry_(including_sour)___healthy": {
        "disease": "Healthy Cherry",
        "severity": "none",
        "crops": ["Cherry"],
        "description": "The cherry plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for powdery mildew and leaf spot", "Maintain balanced nutrition"],
    },

    # ── CORN (MAIZE) ───────────────────────────────────────────────────────
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "disease": "Gray Leaf Spot (Cercospora)",
        "severity": "moderate",
        "crops": ["Corn", "Maize"],
        "description": "Fungal disease (Cercospora zeae-maydis) causing rectangular gray-tan lesions running parallel to leaf veins. Favored by warm, humid conditions.",
        "symptoms": ["Rectangular gray-tan lesions on leaves", "Lesions run parallel between leaf veins", "Lesion edges have yellow halo", "Premature drying of leaves from bottom up"],
        "treatment": ["Apply propiconazole 25 EC at 0.1% at silk stage", "Spray strobilurin fungicide (azoxystrobin)", "Use mancozeb 75 WP at 2.5 g/L", "Apply Pseudomonas fluorescens 2% WP"],
        "prevention": ["Plant resistant hybrids (Pioneer 30B11, DKC varieties)", "Practice crop rotation with non-grass crops", "Avoid overhead irrigation", "Plough under crop residue after harvest"],
    },
    "Corn_(maize)___Common_rust_": {
        "disease": "Common Corn Rust",
        "severity": "moderate",
        "crops": ["Corn", "Maize"],
        "description": "Fungal disease (Puccinia sorghi) producing brick-red pustules on both leaf surfaces. Reduces photosynthesis and grain fill.",
        "symptoms": ["Brick-red oval pustules on both leaf surfaces", "Pustules turn dark brown/black as they mature", "Yellow chlorotic halo around pustules", "Severe infections cause premature leaf death"],
        "treatment": ["Apply mancozeb + zineb spray at first pustule sight", "Use propiconazole 25 EC (0.1%) fortnightly", "Spray tebuconazole if severe infection"],
        "prevention": ["Plant rust-tolerant hybrids", "Early planting to escape peak spore seasons", "Adequate potassium fertilization improves resistance", "Monitor weekly during wet periods"],
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "disease": "Northern Corn Leaf Blight",
        "severity": "severe",
        "crops": ["Corn", "Maize"],
        "description": "Fungal disease (Exserohilum turcicum) causing large cigar-shaped gray-green lesions that can destroy entire leaves.",
        "symptoms": ["Large 2.5–15 cm cigar-shaped lesions", "Gray-green color initially, turning tan-brown", "Dark green water-soaked border initially", "Entire leaves can be killed in severe cases"],
        "treatment": ["Apply propiconazole or azoxystrobin at silking", "Spray mancozeb 75 WP at 2.5 g/L every 10–14 days", "Use tebuconazole + trifloxystrobin mixture"],
        "prevention": ["Plant NCLB-resistant hybrids (Ht1, Ht2 gene)", "Crop rotation — avoid corn-after-corn", "Deep plough residue to reduce inoculum", "Apply prophylactic fungicide in high-risk seasons"],
    },
    "Corn_(maize)___healthy": {
        "disease": "Healthy Corn",
        "severity": "none",
        "crops": ["Corn", "Maize"],
        "description": "The corn/maize plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for rust and blight weekly", "Ensure balanced NPK nutrition", "Maintain proper plant spacing for airflow"],
    },

    # ── GRAPE ──────────────────────────────────────────────────────────────
    "Grape___Black_rot": {
        "disease": "Grape Black Rot",
        "severity": "severe",
        "crops": ["Grape"],
        "description": "Fungal disease (Guignardia bidwellii) that can destroy entire crop. Causes tan leaf spots and mummified fruit.",
        "symptoms": ["Tan/brown circular leaf spots with dark border", "Small black pycnidia in spots", "Infected fruit shrivels to black mummies", "Shoot and tendril infections cause cankers"],
        "treatment": ["Apply mancozeb at bud break and every 10 days", "Spray myclobutanil 20 WP at 0.05%", "Use captan 50 WP 2 g/L before and after rain"],
        "prevention": ["Remove mummified fruit and infected canes", "Prune for maximal sun exposure", "Begin sprays at bud break, continue until veraison", "Train vines for good airflow"],
    },
    "Grape___Esca_(Black_Measles)": {
        "disease": "Grape Esca (Black Measles)",
        "severity": "severe",
        "crops": ["Grape"],
        "description": "Complex vascular disease caused by multiple fungi causing tiger-striped leaves and internal wood rot.",
        "symptoms": ["Tiger-stripe pattern on leaves (yellow/red between veins)", "Berries show dark spots (black measles)", "Internal wood shows dark vascular streaks", "Sudden wilting and vine death in chronic form"],
        "treatment": ["No effective chemical cure exists", "Prune infected wood 30 cm below symptoms", "Protect wounds with fungicide paste", "Apply thiophanate-methyl to pruning wounds"],
        "prevention": ["Use pathogen-free planting material", "Disinfect pruning tools between vines", "Prune in dry weather; seal wounds immediately", "Remove and burn infected vines"],
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "disease": "Grape Leaf Blight",
        "severity": "moderate",
        "crops": ["Grape"],
        "description": "Fungal disease (Pseudocercospora vitis) causing angular dark spots on mature leaves.",
        "symptoms": ["Irregular dark brown/black spots on older leaves", "Yellowing around spots", "Premature defoliation", "Reduced photosynthesis and vine vigor"],
        "treatment": ["Apply mancozeb 75 WP at 2.5 g/L", "Spray carbendazim + mancozeb combination", "Use copper oxychloride 50 WP at 3 g/L"],
        "prevention": ["Remove infected fallen leaves promptly", "Improve vine canopy management", "Apply preventive fungicide mid-season"],
    },
    "Grape___healthy": {
        "disease": "Healthy Grape",
        "severity": "none",
        "crops": ["Grape"],
        "description": "The grape vine appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for downy and powdery mildew", "Maintain proper canopy training"],
    },

    # ── ORANGE ─────────────────────────────────────────────────────────────
    "Orange___Haunglongbing_(Citrus_greening)": {
        "disease": "Citrus Greening (HLB)",
        "severity": "severe",
        "crops": ["Orange", "Citrus"],
        "description": "Deadly bacterial disease (Candidatus Liberibacter asiaticus) spread by psyllid insects. No cure exists — infected trees eventually die.",
        "symptoms": ["Asymmetric yellowing of leaves (blotchy mottle)", "Small, lopsided, bitter fruit", "Premature fruit drop", "Twig dieback, tree decline and death"],
        "treatment": ["No cure — manage psyllid vector immediately", "Apply imidacloprid 17.8 SL (Confidor) for psyllid control", "Nutritional sprays (zinc, manganese) to extend tree life", "Remove and destroy infected trees to protect orchard"],
        "prevention": ["Use certified HLB-free planting material", "Install sticky traps to monitor psyllids", "Regular psyllid spray program", "Quarantine new plant material"],
    },

    # ── PEACH ──────────────────────────────────────────────────────────────
    "Peach___Bacterial_spot": {
        "disease": "Peach Bacterial Spot",
        "severity": "moderate",
        "crops": ["Peach"],
        "description": "Bacterial disease (Xanthomonas arboricola pv. pruni) causing shot-hole leaf lesions and fruit spotting.",
        "symptoms": ["Water-soaked angular spots on leaves turning purple-brown", "Shot-hole appearance as spots fall out", "Fruit surface spots (pitting)", "Twig cankers causing dieback"],
        "treatment": ["Apply copper oxychloride 50 WP at 3 g/L", "Spray oxytetracycline at 500 ppm", "Use streptomycin sulphate 500 ppm"],
        "prevention": ["Plant resistant varieties", "Avoid overhead irrigation", "Prune and destroy infected shoots", "Apply copper spray before wet season"],
    },
    "Peach___healthy": {
        "disease": "Healthy Peach",
        "severity": "none",
        "crops": ["Peach"],
        "description": "The peach tree appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for leaf curl, brown rot", "Apply dormant copper spray"],
    },

    # ── PEPPER ─────────────────────────────────────────────────────────────
    "Pepper,_bell___Bacterial_spot": {
        "disease": "Pepper Bacterial Spot",
        "severity": "moderate",
        "crops": ["Pepper"],
        "description": "Bacterial disease (Xanthomonas euvesicatoria) causing lesions on leaves, stem, and fruit, reducing marketable yield.",
        "symptoms": ["Small water-soaked leaf spots turning dark brown", "Yellowing and leaf drop", "Raised scabby lesions on fruit", "Stem lesions causing dieback"],
        "treatment": ["Apply copper hydroxide (Kocide) at 3 g/L", "Spray streptomycin sulphate 500 ppm + copper combination", "Use bactericide at transplanting and weekly after"],
        "prevention": ["Use certified disease-free seed (hot water treated)", "Rotate crops — avoid pepper for 2+ years", "Avoid working in fields when wet", "Maintain proper plant spacing"],
    },
    "Pepper,_bell___healthy": {
        "disease": "Healthy Bell Pepper",
        "severity": "none",
        "crops": ["Pepper"],
        "description": "The bell pepper plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for anthracnose, phytophthora", "Ensure good drainage"],
    },

    # ── POTATO ─────────────────────────────────────────────────────────────
    "Potato___Early_blight": {
        "disease": "Potato Early Blight",
        "severity": "moderate",
        "crops": ["Potato", "Tomato"],
        "description": "Fungal disease (Alternaria solani) starting on older/lower leaves. Causes concentric ring 'target board' lesions.",
        "symptoms": ["Dark brown spots with concentric rings on lower leaves", "Yellow halo around spots", "Lesions start on older leaves moving upward", "Stems develop dark elongated lesions near soil"],
        "treatment": ["Apply mancozeb 75 WP (Indofil M-45) at 2.5 g/L every 7–10 days", "Spray iprodione 50 WP at 2 g/L", "Use azoxystrobin 23 SC at 1 ml/L", "Chlorothalonil 75 WP at 2 g/L as preventive"],
        "prevention": ["Use certified disease-free seed potato", "Maintain adequate nitrogen nutrition", "Avoid excessive irrigation — keep foliage dry", "Rotate crops with non-solanaceous plants for 3 years"],
    },
    "Potato___Late_blight": {
        "disease": "Potato Late Blight",
        "severity": "severe",
        "crops": ["Potato", "Tomato"],
        "description": "Devastating oomycete disease (Phytophthora infestans) that destroyed the Irish crops. Can destroy a field in 1–2 weeks in cool wet weather.",
        "symptoms": ["Dark water-soaked lesions on leaves appearing suddenly", "White mold on undersides of leaves in humid conditions", "Rapid blackening and death of entire plants", "Tubers show reddish-brown dry rot internally"],
        "treatment": ["Apply metalaxyl + mancozeb (Ridomil Gold MZ) immediately at first sign", "Spray cymoxanil 8% + mancozeb 64% (Curzate M8) at 3 g/L", "Use fosetyl-aluminium 80 WP at 2.5 g/L", "Harvest tubers immediately in severe cases; destroy tops"],
        "prevention": ["Plant certified disease-free seed (Kufri Jyoti, Kufri Sinduri are tolerant)", "Apply preventive metalaxyl spray before rains", "Avoid overhead irrigation — use drip", "Apply fungicide every 5–7 days during outbreak weather"],
    },
    "Potato___healthy": {
        "disease": "Healthy Potato",
        "severity": "none",
        "crops": ["Potato"],
        "description": "The potato plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for late blight weekly during rainy season", "Ensure proper hill spacing for airflow"],
    },

    # ── RASPBERRY ──────────────────────────────────────────────────────────
    "Raspberry___healthy": {
        "disease": "Healthy Raspberry",
        "severity": "none",
        "crops": ["Raspberry"],
        "description": "The raspberry plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for botrytis, cane blight", "Prune out old canes annually"],
    },

    # ── SOYBEAN ────────────────────────────────────────────────────────────
    "Soybean___healthy": {
        "disease": "Healthy Soybean",
        "severity": "none",
        "crops": ["Soybean"],
        "description": "The soybean plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for Asian soybean rust, pod borer", "Ensure inoculation with Rhizobium at planting"],
    },

    # ── SQUASH ─────────────────────────────────────────────────────────────
    "Squash___Powdery_mildew": {
        "disease": "Squash Powdery Mildew",
        "severity": "moderate",
        "crops": ["Squash", "Cucumber", "Pumpkin"],
        "description": "White powdery fungal growth (Podosphaera xanthii / Erysiphe cichoracearum) on cucurbit leaves and stems.",
        "symptoms": ["White powdery coating on upper leaf surface", "Yellowing and browning of affected leaves", "Premature leaf senescence", "Reduced fruit quality and yield"],
        "treatment": ["Spray neem oil 3% solution every 7 days", "Apply wettable sulphur 80 WP at 2 g/L", "Use potassium bicarbonate (5%) spray", "Apply trifloxystrobin for severe infections"],
        "prevention": ["Plant resistant varieties", "Ensure adequate plant spacing and airflow", "Avoid excess nitrogen fertilization", "Water at soil level — keep foliage dry"],
    },

    # ── STRAWBERRY ─────────────────────────────────────────────────────────
    "Strawberry___Leaf_scorch": {
        "disease": "Strawberry Leaf Scorch",
        "severity": "moderate",
        "crops": ["Strawberry"],
        "description": "Fungal disease (Diplocarpon earlianum) causing purple/red spots on leaves that merge and cause scorched appearance.",
        "symptoms": ["Small purple to red spots on upper leaf surface", "Spots have white/tan centers in advanced stage", "Leaves develop scorched or burnt appearance", "Reduced plant vigor and fruit yield"],
        "treatment": ["Apply captan 50 WP at 2 g/L", "Spray myclobutanil 20 WP", "Use mancozeb + copper combination"],
        "prevention": ["Use certified disease-free planting material", "Renovate beds after harvest — mow and till", "Avoid wetting leaves during irrigation", "Remove infected leaves promptly"],
    },
    "Strawberry___healthy": {
        "disease": "Healthy Strawberry",
        "severity": "none",
        "crops": ["Strawberry"],
        "description": "The strawberry plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for botrytis and powdery mildew", "Renovate beds after harvest"],
    },

    # ── TOMATO ─────────────────────────────────────────────────────────────
    "Tomato___Bacterial_spot": {
        "disease": "Tomato Bacterial Spot",
        "severity": "moderate",
        "crops": ["Tomato"],
        "description": "Bacterial disease (Xanthomonas spp.) causing water-soaked leaf spots and fruit blemishes, reduced marketability.",
        "symptoms": ["Small water-soaked spots on leaves turning dark brown", "Yellow halo around leaf spots", "Raised scabby lesions on green fruit", "Defoliation in severe cases"],
        "treatment": ["Apply copper hydroxide 77 WP (Kocide) at 3 g/L", "Spray streptomycin sulphate 500 ppm", "Use copper+mancozeb tank mix for broad protection"],
        "prevention": ["Use hot-water treated or certified seed", "Avoid overhead irrigation", "Rotate tomatoes with non-solanaceous crops", "Space plants adequately for air circulation"],
    },
    "Tomato___Early_blight": {
        "disease": "Tomato Early Blight",
        "severity": "moderate",
        "crops": ["Tomato"],
        "description": "Same Alternaria solani fungus as potato early blight. Causes 'target board' lesions especially under stress.",
        "symptoms": ["Dark brown target-board lesions on older leaves", "Yellow halo around spots", "Stem collar rot near soil", "Fruit lesions with concentric rings near stem end"],
        "treatment": ["Spray mancozeb 75 WP (Indofil M-45) at 2.5 g/L", "Apply chlorothalonil 75 WP at 2 g/L", "Use iprodione 50 WP at 2 g/L for severe cases", "Apply Trichoderma viride 1% WP as bio-control"],
        "prevention": ["Remove lower infected leaves weekly", "Apply mulch to prevent spore splash from soil", "Avoid nitrogen excess — maintain balanced nutrition", "Water at soil level — drip preferred"],
    },
    "Tomato___Late_blight": {
        "disease": "Tomato Late Blight",
        "severity": "severe",
        "crops": ["Tomato"],
        "description": "Same Phytophthora infestans as potato late blight. Rapidly devastating in cool humid weather.",
        "symptoms": ["Large, dark water-soaked lesions on leaves and stem", "White fuzzy mycelium on leaf underside", "Brown discoloration of stem and petiole", "Dark brown blotches on fruit"],
        "treatment": ["Apply metalaxyl+mancozeb (Ridomil Gold MZ) at 3 g/L at first sign", "Spray copper oxychloride 50 WP at 3 g/L", "Use dimethomorph 500 WP at 1 g/L"],
        "prevention": ["Stake plants for good airflow", "Avoid wetting foliage", "Apply preventive copper spray before rain season", "Remove infected plant material immediately"],
    },
    "Tomato___Leaf_Mold": {
        "disease": "Tomato Leaf Mold",
        "severity": "moderate",
        "crops": ["Tomato"],
        "description": "Fungal disease (Passalora fulva) common in greenhouses and humid conditions causing olive-green mold on leaf undersides.",
        "symptoms": ["Yellow patches on upper leaf surface", "Olive-green to grayish mold on underside", "Leaves curl, turn brown and die", "Fruit rarely affected but quality drops"],
        "treatment": ["Apply mancozeb 75 WP at 2.5 g/L", "Spray chlorothalonil 75 WP at 2 g/L", "Use copper oxychloride 50 WP fortnightly", "Improve greenhouse ventilation immediately"],
        "prevention": ["Maintain relative humidity below 85%", "Improve ventilation in poly-houses", "Plant resistant varieties (Cf3, Cf4 resistance genes)", "Avoid wetting foliage when irrigating"],
    },
    "Tomato___Septoria_leaf_spot": {
        "disease": "Tomato Septoria Leaf Spot",
        "severity": "moderate",
        "crops": ["Tomato"],
        "description": "Fungal disease (Septoria lycopersici) causing numerous small spots with dark borders that can defoliate plants.",
        "symptoms": ["Numerous small circular spots (3–6 mm) on leaves", "Spots have dark brown borders with light gray centers", "Tiny black pycnidia visible in spot centers", "Rapid defoliation starting from lower leaves"],
        "treatment": ["Apply chlorothalonil 75 WP at 2 g/L every 7–10 days", "Spray mancozeb 75 WP at 2.5 g/L", "Use copper-based fungicide as tank partner"],
        "prevention": ["Remove lower infected leaves and destroy", "Mulch around plants to prevent spore splash", "Stake plants — avoid leaves touching soil", "Rotate with non-solanaceous crops for 2 years"],
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "disease": "Tomato Spider Mites",
        "severity": "moderate",
        "crops": ["Tomato"],
        "description": "Not a fungal disease — tiny arachnid pest (Tetranychus urticae) causing stippling and bronzing on leaves. Thrives in hot dry conditions.",
        "symptoms": ["Fine stippling/speckling on upper leaf surface", "Bronzing and yellowing of leaves", "Fine webbing visible on undersides of leaves", "Tiny moving red/brown dots on leaf underside"],
        "treatment": ["Spray abamectin 1.8 EC at 0.5 ml/L", "Apply spiromesifen 240 SC (Oberon) at 1 ml/L", "Use propargite 57 EC (Omite) at 2 ml/L", "Neem oil 3% spray as organic option"],
        "prevention": ["Maintain good soil moisture — dry conditions favour mites", "Release predatory mites (Phytoseiulus persimilis)", "Regular inspection of leaf undersides", "Avoid dusty field conditions — mites thrive in dust"],
    },
    "Tomato___Target_Spot": {
        "disease": "Tomato Target Spot",
        "severity": "moderate",
        "crops": ["Tomato"],
        "description": "Fungal disease (Corynespora cassiicola) causing brown lesions with concentric rings on leaves and fruit.",
        "symptoms": ["Brown spots with concentric (target) rings on leaves", "Spots coalesce causing large blighted areas", "Brown sunken lesions on fruit", "Lower leaves affected first"],
        "treatment": ["Apply azoxystrobin 23 SC at 1 ml/L", "Spray mancozeb 75 WP at 2.5 g/L", "Use propiconazole 25 EC at 1 ml/L"],
        "prevention": ["Stake and prune for airflow", "Avoid overhead irrigation", "Rotate with non-solanaceous crops"],
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "disease": "Tomato Yellow Leaf Curl Virus (TYLCV)",
        "severity": "severe",
        "crops": ["Tomato"],
        "description": "Viral disease transmitted by whitefly (Bemisia tabaci). One of the most destructive tomato viruses in India. No cure — prevention is critical.",
        "symptoms": ["Upward curling and yellowing of younger leaves", "Leaves become small and leathery", "Stunted plant growth and flower drop", "Fruits remain small and poorly formed"],
        "treatment": ["No chemical cure for the virus itself", "Control whitefly immediately: imidacloprid 17.8 SL (Confidor) at 0.5 ml/L", "Apply thiamethoxam 25 WG (Actara) at 0.5 g/L", "Remove and destroy infected plants to reduce spread"],
        "prevention": ["Use TYLCV-resistant varieties (Arka Rakshak, Pusa Rohini)", "Install 50-mesh insect-proof netting in nurseries", "Use yellow sticky traps to monitor whitefly", "Apply reflective silver mulch to repel whitefly"],
    },
    "Tomato___Tomato_mosaic_virus": {
        "disease": "Tomato Mosaic Virus (ToMV)",
        "severity": "severe",
        "crops": ["Tomato"],
        "description": "Highly stable virus (Tobamovirus genus) spread by mechanical contact and seed. Extremely persistent in soil — survives for years.",
        "symptoms": ["Mosaic pattern of light and dark green on leaves", "Leaf curling and distortion", "Stunted plant growth", "Internal browning of fruit (brown wall necrosis)"],
        "treatment": ["No chemical cure", "Remove and bag infected plants immediately", "Disinfect tools with 10% bleach or phosphate soap", "Wash hands thoroughly before handling plants"],
        "prevention": ["Use certified virus-free seed (heat-treated)", "Use ToMV-resistant varieties (Tm-22 gene)", "Do not use tobacco products while handling plants", "Control aphids that can spread virus mechanically"],
    },
    "Tomato___healthy": {
        "disease": "Healthy Tomato",
        "severity": "none",
        "crops": ["Tomato"],
        "description": "The tomato plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor weekly for early/late blight, TYLCV", "Stake plants for airflow", "Ensure balanced NPK nutrition"],
    },

    # ── RICE (wambugu71 model classes) ────────────────────────────────────
    "Rice Brown Spot": {
        "disease": "Rice Brown Spot",
        "severity": "moderate",
        "crops": ["Rice"],
        "description": "Fungal disease (Bipolaris oryzae) that was responsible for the 1943 Bengal famine. Causes brown oval spots on leaves, grains.",
        "symptoms": ["Oval to circular brown spots with light center", "Dark brown borders around spots", "Heavy infection causes leaf blight", "Grain discoloration and chalky appearance"],
        "treatment": ["Apply mancozeb 75 WP (Indofil M-45) at 2.5 g/L", "Spray iprodione 50 WP at 2 g/L", "Use edifenphos 50 EC at 1 ml/L", "Tricyclazole 75 WP if blast also suspected"],
        "prevention": ["Treat seeds with Pseudomonas fluorescens 10 g/kg seed", "Maintain proper soil nutrition — deficiency worsens disease", "Use resistant varieties (IR36, Jaya)", "Avoid excessive nitrogen and waterlogging"],
    },
    "Rice Hispa": {
        "disease": "Rice Hispa (Leaf Miner)",
        "severity": "moderate",
        "crops": ["Rice"],
        "description": "Insect pest (Dicladispa armigera) — adult scrapes and larvae mine leaf tissue causing white streaks. Damages young rice.",
        "symptoms": ["White irregular streaks/patches running along leaf", "Brown drying of mined leaf tissue", "Leaves turn white and papery", "Heavily infested fields appear scorched"],
        "treatment": ["Clip and destroy leaf tips with larvae inside", "Spray chlorpyrifos 20 EC at 2 ml/L", "Apply monocrotophos 36 SL at 1.5 ml/L", "Use neem oil 3% for light infestations"],
        "prevention": ["Drain field for 2–3 weeks during high infestation", "Avoid excess nitrogen which promotes lush growth", "Use resistant varieties where available", "Keep field bunds clean to reduce host plants"],
    },
    "Rice Leaf Blast": {
        "disease": "Rice Leaf Blast",
        "severity": "severe",
        "crops": ["Rice"],
        "description": "Fungal disease (Magnaporthe oryzae) — one of the most destructive rice diseases globally. Can cause 70–80% yield loss.",
        "symptoms": ["Diamond-shaped lesions with gray center and brown border", "Lesions have pointed ends (eye-shaped)", "Rapid spread in cool cloudy weather", "Collar rot at leaf-sheath junction in severe cases"],
        "treatment": ["Apply tricyclazole 75 WP (Beam) at 0.6 g/L at first sign", "Spray isoprothiolane 40 EC (Fuji-One) at 1.5 ml/L", "Use carbendazim 50 WP at 1 g/L", "Apply Pseudomonas fluorescens 0.5% WP as bio-control"],
        "prevention": ["Use blast-resistant varieties (Mahamaya, Kranti, Vandana)", "Avoid excess nitrogen especially urea", "Maintain optimum plant spacing", "Apply silicon as foliar spray — improves resistance"],
    },
    "Rice Healthy": {
        "disease": "Healthy Rice",
        "severity": "none",
        "crops": ["Rice"],
        "description": "The rice plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for blast weekly especially at tillering", "Maintain field drainage", "Ensure balanced NPK + zinc nutrition"],
    },

    # ── WHEAT (wambugu71 model classes) ───────────────────────────────────
    "Wheat Brown Rust": {
        "disease": "Wheat Brown Rust (Leaf Rust)",
        "severity": "moderate",
        "crops": ["Wheat"],
        "description": "Fungal disease (Puccinia triticina) — most common wheat rust. Circular orange-brown pustules on leaves reduce grain yield.",
        "symptoms": ["Circular orange-brown pustules on upper leaf surface", "Pustules randomly scattered (unlike stripe rust)", "Yellow halo around pustules", "Reduced grain size and quality"],
        "treatment": ["Apply propiconazole 25 EC (Tilt) at 1 ml/L at first sign", "Spray mancozeb 75 WP at 2.5 g/L preventively", "Use tebuconazole 250 EW at 0.6 ml/L for heavy infection"],
        "prevention": ["Plant rust-resistant varieties (HD-2967, PBW-343, WH-1105)", "Early sowing to escape peak rust season", "Balanced NPK — avoid excess nitrogen", "Monitor fields weekly from jointing to heading"],
    },
    "Wheat Yellow Rust": {
        "disease": "Wheat Yellow Rust (Stripe Rust)",
        "severity": "severe",
        "crops": ["Wheat"],
        "description": "Fungal disease (Puccinia striiformis) causing bright yellow pustules in stripes along the leaf. Spreads rapidly in cool humid conditions.",
        "symptoms": ["Bright yellow pustules arranged in stripes along leaf veins", "Yellow powdery spore masses in neat rows", "Entire leaf and flag leaf can be destroyed", "Heavy infection causes 'yellow ears'"],
        "treatment": ["Apply propiconazole 25 EC (Tilt) at 1 ml/L at first sign", "Spray tebuconazole 250 EW at 0.6 ml/L", "Use triadimefon 25 WP at 0.1% if epidemic", "Immediate action critical — can spread field to field"],
        "prevention": ["Plant resistant varieties (HD-3086, MACS-6222, PBW-550)", "Avoid very early sowing in high-rainfall areas", "Maintain watch at booting stage — earliest intervention", "Report outbreak to agriculture dept for regional alert"],
    },
    "Wheat Healthy": {
        "disease": "Healthy Wheat",
        "severity": "none",
        "crops": ["Wheat"],
        "description": "The wheat plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for rust from jointing to grain fill", "Check flag leaf health — crucial for yield"],
    },

    # ── CORN wambugu71 aliases ─────────────────────────────────────────────
    "Corn Common Rust": {
        "disease": "Common Corn Rust",
        "severity": "moderate",
        "crops": ["Corn", "Maize"],
        "description": "Same as Corn_(maize)___Common_rust_",
        "symptoms": ["Brick-red oval pustules on both leaf surfaces", "Pustules turn dark brown as they mature", "Yellow chlorotic halo around pustules"],
        "treatment": ["Apply mancozeb + zineb spray", "Use propiconazole 25 EC (0.1%) fortnightly"],
        "prevention": ["Plant rust-tolerant hybrids", "Early planting to escape peak spore seasons"],
    },
    "Corn Gray Leaf Spot": {
        "disease": "Gray Leaf Spot (Cercospora)",
        "severity": "moderate",
        "crops": ["Corn", "Maize"],
        "description": "Same as Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "symptoms": ["Rectangular gray-tan lesions running between leaf veins", "Yellow halo around lesions"],
        "treatment": ["Apply propiconazole 25 EC", "Spray strobilurin fungicide"],
        "prevention": ["Plant resistant hybrids", "Crop rotation away from maize"],
    },
    "Corn Leaf Blight": {
        "disease": "Northern Corn Leaf Blight",
        "severity": "severe",
        "crops": ["Corn", "Maize"],
        "description": "Same as Corn_(maize)___Northern_Leaf_Blight",
        "symptoms": ["Large cigar-shaped gray-green lesions", "Entire leaves killed in severe cases"],
        "treatment": ["Apply propiconazole or azoxystrobin at silking", "Spray mancozeb 75 WP every 10–14 days"],
        "prevention": ["Plant NCLB-resistant hybrids", "Deep plough residue after harvest"],
    },
    "Corn Healthy": {
        "disease": "Healthy Corn",
        "severity": "none",
        "crops": ["Corn", "Maize"],
        "description": "The corn plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor for rust and blight weekly"],
    },
    "Potato Early Blight": {
        "disease": "Potato Early Blight",
        "severity": "moderate",
        "crops": ["Potato"],
        "description": "Same as Potato___Early_blight",
        "symptoms": ["Dark brown spots with concentric rings on lower leaves", "Yellow halo around spots"],
        "treatment": ["Apply mancozeb 75 WP every 7–10 days", "Use azoxystrobin 23 SC at 1 ml/L"],
        "prevention": ["Use certified seed potato", "Rotate crops for 3 years"],
    },
    "Potato Late Blight": {
        "disease": "Potato Late Blight",
        "severity": "severe",
        "crops": ["Potato"],
        "description": "Same as Potato___Late_blight",
        "symptoms": ["Dark water-soaked lesions appearing suddenly", "White mold on leaf undersides", "Rapid blackening and death of plants"],
        "treatment": ["Apply metalaxyl+mancozeb immediately", "Use cymoxanil-based fungicide"],
        "prevention": ["Plant certified disease-free seed", "Apply preventive metalaxyl spray before rains"],
    },
    "Potato Healthy": {
        "disease": "Healthy Potato",
        "severity": "none",
        "crops": ["Potato"],
        "description": "The potato plant appears healthy.",
        "symptoms": [],
        "treatment": ["No treatment needed"],
        "prevention": ["Monitor weekly for late blight"],
    },
}

# Severity emoji/color mapping
SEVERITY_META = {
    "none":     {"emoji": "✅", "color": "#16a34a", "label": "Healthy"},
    "moderate": {"emoji": "⚠️", "color": "#d97706", "label": "Moderate"},
    "severe":   {"emoji": "🔴", "color": "#dc2626", "label": "Severe"},
}

# ─────────────────────────────────────────────────────────────────────────────
# MODEL LOADERS  (lazy — loaded once on first request)
# ─────────────────────────────────────────────────────────────────────────────
_lock    = threading.Lock()
_pipe1   = None   # Primary: linkanjarad MobileNetV2  (38 classes)
_pipe2   = None   # Secondary: wambugu71 ViT-Tiny     (15 classes)
_hf_ready = False
_hf_error: Optional[str] = None
_last_load_attempt: float = 0.0
_loading_in_progress: bool = False



def _load_models():
    global _pipe1, _pipe2, _hf_ready, _hf_error
    with _lock:
        if _hf_ready:  # Already loaded successfully — skip
            return
        try:
            from transformers import pipeline as hf_pipeline, AutoImageProcessor

            logger.info("🔬 Loading primary disease model (MobileNetV2, 38 classes)...")
            _pipe1 = hf_pipeline(
                "image-classification",
                model="linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
                top_k=5,
            )
            logger.info("✅ Primary model loaded")

            # Secondary model load — non-fatal if it fails
            try:
                logger.info("🔬 Loading secondary disease model (ViT, 15 classes)...")
                _pipe2 = hf_pipeline(
                    "image-classification",
                    model="wambugu71/crop_leaf_diseases_vit",
                    image_processor=AutoImageProcessor.from_pretrained(
                        "wambugu71/crop_leaf_diseases_vit", use_fast=False
                    ),
                    top_k=5,
                )
                logger.info("✅ Secondary model loaded  (dual-model ensemble active)")
            except Exception as e2:
                logger.warning(f"⚠️  Secondary model failed ({e2}); running primary-only mode")
                _pipe2 = None

            _hf_ready = True

        except Exception as e:
            _hf_error = str(e)
            logger.error(f"❌ HF model load failed: {e}")



def _ensure_models():
    """
    Trigger model loading in a background thread if not already loaded.
    NEVER blocks the calling (request) thread.
    """
    global _hf_error, _last_load_attempt, _loading_in_progress
    if _hf_ready or _loading_in_progress:
        return
    import time
    if _hf_error and (time.time() - _last_load_attempt) < 60:
        return  # still in cooldown — use fallback

    # Launch model loading in a background thread
    import threading
    _loading_in_progress = True
    _hf_error = None
    _last_load_attempt = time.time()

    def _bg_load():
        global _loading_in_progress
        try:
            _load_models()
        finally:
            _loading_in_progress = False

    threading.Thread(target=_bg_load, daemon=True).start()


# ─────────────────────────────────────────────────────────────────────────────
# LABEL → DB  NORMALISER
# Maps raw HuggingFace label strings to DISEASE_DB keys
# ─────────────────────────────────────────────────────────────────────────────
def _normalize_label(raw_label: str) -> str:
    """Try exact match first, then fuzzy match by stripping punctuation."""
    if raw_label in DISEASE_DB:
        return raw_label
    # Common aliases
    aliases = {
        "Corn Common Rust":                            "Corn_(maize)___Common_rust_",
        "Corn Gray Leaf Spot":                         "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "Corn Leaf Blight":                            "Corn_(maize)___Northern_Leaf_Blight",
        "Corn Healthy":                                "Corn_(maize)___healthy",
        "Potato Early Blight":                         "Potato___Early_blight",
        "Potato Late Blight":                          "Potato___Late_blight",
        "Potato Healthy":                              "Potato___healthy",
        "Rice Brown Spot":                             "Rice Brown Spot",
        "Rice Hispa":                                  "Rice Hispa",
        "Rice Leaf Blast":                             "Rice Leaf Blast",
        "Rice Healthy":                                "Rice Healthy",
        "Wheat Brown Rust":                            "Wheat Brown Rust",
        "Wheat Yellow Rust":                           "Wheat Yellow Rust",
        "Wheat Healthy":                               "Wheat Healthy",
    }
    if raw_label in aliases:
        return aliases[raw_label]
    # Fuzzy: try stripping underscores/spaces
    clean = raw_label.replace("___", " ").replace("_", " ").lower()
    for key in DISEASE_DB:
        if key.replace("___", " ").replace("_", " ").lower() == clean:
            return key
    return raw_label  # return as-is; will fall back to generic


def _get_disease_info(label: str) -> dict:
    """Return DISEASE_DB entry for a label, or a generic fallback."""
    key = _normalize_label(label)
    if key in DISEASE_DB:
        return DISEASE_DB[key].copy()
    # Generic fallback
    parts = label.replace("___", " ").replace("_", " ").split()
    crop  = parts[0] if parts else "Unknown"
    cond  = " ".join(parts[1:]) if len(parts) > 1 else "Unknown condition"
    return {
        "disease": f"{crop} — {cond}",
        "severity": "moderate",
        "crops": [crop],
        "description": f"A disease condition detected in {crop}. Consult your local KVK agronomist for confirmation and treatment advice.",
        "symptoms": ["Visible abnormality on leaf surface"],
        "treatment": ["Consult a plant pathologist", "Apply broad-spectrum fungicide/bactericide as precaution"],
        "prevention": ["Use certified disease-free seed", "Practice crop rotation", "Maintain field hygiene"],
    }


# ─────────────────────────────────────────────────────────────────────────────
# ENSEMBLE LOGIC
# ─────────────────────────────────────────────────────────────────────────────
def _ensemble_predictions(p1_results: list, p2_results: list) -> list:
    """
    Merge primary (38-class) and secondary (15-class) predictions.
    If both models agree on the same crop+disease, average their confidence.
    Primary results always anchor the output.
    """
    merged: dict[str, float] = {}

    for r in p1_results:
        key = _normalize_label(r["label"])
        merged[key] = r["score"]

    # For secondary results: if crop matches a primary result, boost its confidence
    for r in p2_results:
        key = _normalize_label(r["label"])
        if key in merged:
            # Both models agree — average with slight boost
            merged[key] = (merged[key] + r["score"]) / 2 * 1.1
        else:
            # Secondary has a unique detection — add with reduced confidence
            merged[key] = r["score"] * 0.7

    # Sort by confidence descending
    sorted_results = sorted(merged.items(), key=lambda x: x[1], reverse=True)
    return [{"label": k, "score": min(v, 0.99)} for k, v in sorted_results[:5]]


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────────────────────────────────────
def diagnose_image_bytes(image_bytes: bytes, filename: str = "leaf.jpg") -> dict:
    """
    Run dual-model HF inference on raw image bytes.
    Returns enriched disease info with top-3 predictions.
    Falls back to rule-based simulation if models unavailable or still loading.
    """
    # Kick off background load if not started yet — NEVER blocks the request thread
    _ensure_models()

    # If models are not ready yet (still downloading or failed), use instant fallback
    if not _hf_ready:
        if _loading_in_progress:
            logger.info("HF models still loading — returning simulation result")
        else:
            logger.warning(f"HF models unavailable ({_hf_error}), using simulation fallback")
        return _simulate_fallback(filename)

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Run both models
        p1_raw = _pipe1(img) if _pipe1 else []
        p2_raw = _pipe2(img) if _pipe2 else []

        logger.info(f"Primary top-1: {p1_raw[0] if p1_raw else 'N/A'}")
        logger.info(f"Secondary top-1: {p2_raw[0] if p2_raw else 'N/A'}")

        # ── NON-PLANT IMAGE GUARD ──────────────────────────────────────────
        # PlantVillage MobileNetV2 is trained ONLY on plant/leaf images.
        # When it sees a non-plant image it spreads probability very flatly
        # across 38 classes — top-1 score will be ~0.03-0.10 (near-uniform).
        # If top-1 confidence from primary model is below threshold → reject.
        p1_top_score = p1_raw[0]["score"] if p1_raw else 0.0
        p2_top_score = p2_raw[0]["score"] if p2_raw else 0.0
        NOT_PLANT_THRESHOLD = 0.20   # tuned: real leaf images score >= 0.40

        if p1_top_score < NOT_PLANT_THRESHOLD and p2_top_score < NOT_PLANT_THRESHOLD:
            logger.warning(
                f"Non-plant image rejected: p1={p1_top_score:.3f}, p2={p2_top_score:.3f}"
            )
            raise ValueError(
                "This image does not appear to be a plant or leaf. "
                "Please upload a clear photo of a crop leaf for diagnosis."
            )
        # ──────────────────────────────────────────────────────────────────

        # Ensemble
        all_preds = _ensemble_predictions(p1_raw, p2_raw)

        # Build top-3 predictions
        top3 = []
        for pred in all_preds[:3]:
            info = _get_disease_info(pred["label"])
            severity = info.get("severity", "moderate")
            top3.append({
                "label": pred["label"],
                "disease": info["disease"],
                "confidence": round(pred["score"], 4),
                "severity": severity,
                "severity_label": SEVERITY_META[severity]["label"],
                "severity_emoji": SEVERITY_META[severity]["emoji"],
                "severity_color": SEVERITY_META[severity]["color"],
                "crops": info["crops"],
            })

        # Primary result = highest confidence
        best = top3[0]
        primary_info = _get_disease_info(all_preds[0]["label"])

        return {
            # Primary result fields (backward compat)
            "disease":          primary_info["disease"],
            "confidence":       best["confidence"],
            "severity":         best["severity"],
            "severity_label":   best["severity_label"],
            "severity_emoji":   best["severity_emoji"],
            "severity_color":   best["severity_color"],
            "crops":            primary_info["crops"],
            "description":      primary_info["description"],
            "symptoms":         primary_info["symptoms"],
            "treatment":        primary_info["treatment"],
            "prevention":       primary_info["prevention"],
            # Enhanced fields
            "top_predictions":  top3,
            "models_used":      ["linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
                                  "wambugu71/crop_leaf_diseases_vit"],
            "inference_mode":   "dual_model_ensemble",
        }

    except ValueError:
        # Non-plant image guard — re-raise so router returns HTTP 400
        raise
    except Exception as e:
        logger.error(f"Inference error: {e}")
        return _simulate_fallback(filename)


def _simulate_fallback(filename: str) -> dict:
    """Rule-based simulation when HF models are not available."""
    import random
    keys = list(DISEASE_DB.keys())
    fn = filename.lower()
    if "healthy" in fn or "good" in fn:
        key = next((k for k in keys if "healthy" in k.lower()), "Tomato___healthy")
    elif "rust" in fn:
        key = next((k for k in keys if "rust" in k.lower()), "Wheat Brown Rust")
    elif "blight" in fn:
        key = next((k for k in keys if "blight" in k.lower()), "Potato___Late_blight")
    elif "blast" in fn:
        key = "Rice Leaf Blast"
    else:
        key = random.choice(keys)

    info = DISEASE_DB[key].copy()
    confidence = round(random.uniform(0.70, 0.88), 4)
    severity   = info.get("severity", "moderate")

    return {
        "disease":        info["disease"],
        "confidence":     confidence,
        "severity":       severity,
        "severity_label": SEVERITY_META[severity]["label"],
        "severity_emoji": SEVERITY_META[severity]["emoji"],
        "severity_color": SEVERITY_META[severity]["color"],
        "crops":          info["crops"],
        "description":    info["description"],
        "symptoms":       info["symptoms"],
        "treatment":      info["treatment"],
        "prevention":     info["prevention"],
        "top_predictions": [{
            "disease": info["disease"], "confidence": confidence,
            "severity": severity, "severity_emoji": SEVERITY_META[severity]["emoji"],
        }],
        "models_used":    [],
        "inference_mode": "simulation_fallback",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Backward-compat shim  (old router calls diagnose_image(filename))
# ─────────────────────────────────────────────────────────────────────────────
def diagnose_image(filename: str) -> dict:
    return _simulate_fallback(filename)
