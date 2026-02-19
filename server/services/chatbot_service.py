"""
SmartAgri AI - Chatbot Service
Rule-based NLP for farming queries with contextual responses.
"""
import re
import random

# Knowledge base
CROP_INFO = {
    "rice": {"season": "Kharif", "water": "High", "soil": "Clayey, Loamy", "temp": "20-35°C", "tips": "Use SRI method for 30-50% water saving. Transplant 12-14 day seedlings."},
    "wheat": {"season": "Rabi", "water": "Medium", "soil": "Loamy, Clayey", "temp": "15-25°C", "tips": "Sow by mid-November for best yield. Apply zinc sulphate if deficient."},
    "cotton": {"season": "Kharif", "water": "Medium", "soil": "Black, Loamy", "temp": "21-35°C", "tips": "Maintain 60-90cm spacing. Use Bt cotton varieties for bollworm resistance."},
    "maize": {"season": "Kharif/Rabi", "water": "Medium", "soil": "Loamy, Sandy", "temp": "18-32°C", "tips": "Ensure proper pollination. Apply urea in split doses."},
    "sugarcane": {"season": "Kharif", "water": "Very High", "soil": "Loamy, Alluvial", "temp": "20-40°C", "tips": "Use ring pit method for higher yield. Apply press mud as organic manure."},
    "soybean": {"season": "Kharif", "water": "Medium", "soil": "Loamy, Black", "temp": "20-30°C", "tips": "Inoculate seeds with Rhizobium. Harvest at 15% moisture for best quality."},
    "mustard": {"season": "Rabi", "water": "Low", "soil": "Loamy, Sandy", "temp": "10-25°C", "tips": "Apply sulphur for oil content. Irrigate at flowering stage critically."},
    "chickpea": {"season": "Rabi", "water": "Low", "soil": "Loamy, Sandy", "temp": "15-30°C", "tips": "Avoid waterlogging. Treat seeds with Trichoderma for wilt control."},
    "groundnut": {"season": "Kharif", "water": "Medium", "soil": "Sandy, Red", "temp": "25-35°C", "tips": "Apply gypsum at flowering. Harvest when kernel is mature."},
    "lentil": {"season": "Rabi", "water": "Low", "soil": "Loamy, Sandy", "temp": "15-25°C", "tips": "Use herbicide pre-emergence. Apply phosphorus-rich fertilizer."},
}

DISEASE_INFO = {
    "blight": "Blight causes rapid leaf browning. Apply copper-based fungicides. Remove infected plant debris.",
    "rust": "Rust appears as orange-brown pustules. Apply propiconazole. Use resistant varieties.",
    "wilt": "Wilt causes sudden wilting despite moisture. Use seed treatment with carbendazim. Improve drainage.",
    "mosaic": "Mosaic virus causes mottled yellowing. Control aphid vectors with neem oil. Remove infected plants.",
    "powdery mildew": "White powdery patches on leaves. Apply sulphur dust. Ensure proper spacing for air circulation.",
    "leaf curl": "Leaves curl upward. Caused by whitefly-transmitted virus. Use yellow sticky traps. Spray imidacloprid.",
    "stem rot": "Stem base becomes dark and soft. Improve drainage. Apply Trichoderma to soil.",
}

SCHEME_INFO = {
    "pm-kisan": "PM-KISAN provides ₹6,000/year in 3 instalments to small farmers. Register at pmkisan.gov.in with Aadhaar.",
    "fasal bima": "Pradhan Mantri Fasal Bima Yojana insures crops against natural calamities at just 1.5-5% premium. Apply through your bank.",
    "kisan credit": "Kisan Credit Card provides crop loans at 4% interest (with prompt repayment). Apply at any bank branch.",
    "soil health": "Soil Health Card scheme provides free soil testing. Visit your nearest KVK or agriculture office.",
    "e-nam": "eNAM connects 1,000+ mandis digitally. Register at enam.gov.in to sell produce at best prices.",
}

GREETINGS = ["Hello! 🌾 I'm your SmartAgri AI assistant. How can I help you with farming today?",
             "Namaste! 🙏 I'm here to help with crop advice, disease info, market prices, and schemes. Ask away!",
             "Welcome farmer! 🌱 Ask me about crops, weather, diseases, or government schemes."]

FALLBACK = ["I'm not sure about that. Try asking about specific crops, diseases, weather, or government schemes!",
            "Could you rephrase? I can help with crop advice, pest management, market prices, and farming schemes.",
            "I'm still learning! Ask me about Rice, Wheat, Cotton, or any crop for detailed advice."]


def process_message(message: str, user_state: str = "Maharashtra") -> dict:
    msg = message.lower().strip()

    # Greeting
    if any(w in msg for w in ["hi", "hello", "hey", "namaste", "help", "start"]):
        return {"reply": random.choice(GREETINGS), "type": "greeting", "suggestions": [
            "Best crop for Kharif?", "How to treat blight?", "Tell me about PM-KISAN", "Weather tips for rice"
        ]}

    # Crop-specific queries
    for crop, info in CROP_INFO.items():
        if crop in msg:
            reply = f"**{crop.title()}** 🌾\n"
            if any(w in msg for w in ["season", "when", "sow", "plant"]):
                reply += f"• **Season:** {info['season']}\n• **Temperature:** {info['temp']}\n• **Tip:** {info['tips']}"
            elif any(w in msg for w in ["water", "irrigation", "irrigat"]):
                reply += f"• **Water Needs:** {info['water']}\n• **Tip:** {info['tips']}"
            elif any(w in msg for w in ["soil", "land"]):
                reply += f"• **Best Soil:** {info['soil']}\n• **Water:** {info['water']}"
            else:
                reply += f"• **Season:** {info['season']}\n• **Soil:** {info['soil']}\n• **Water:** {info['water']}\n• **Temp:** {info['temp']}\n• **Tip:** {info['tips']}"
            return {"reply": reply, "type": "crop_info", "suggestions": [
                f"Irrigation for {crop}?", f"Diseases in {crop}?", f"Market price of {crop}?"
            ]}

    # Disease queries
    for disease, info in DISEASE_INFO.items():
        if disease in msg:
            return {"reply": f"**{disease.title()}** 🦠\n{info}", "type": "disease_info", "suggestions": [
                "How to prevent blight?", "Organic pest control?", "What is IPM?"
            ]}

    if any(w in msg for w in ["disease", "pest", "insect", "fungus", "bug", "infection"]):
        reply = "**Common Crop Diseases** 🦠\n"
        for d in list(DISEASE_INFO.keys())[:5]:
            reply += f"• **{d.title()}** - ask for details\n"
        reply += "\nAsk about a specific disease for treatment info!"
        return {"reply": reply, "type": "disease_list", "suggestions": list(DISEASE_INFO.keys())[:4]}

    # Scheme queries
    for scheme, info in SCHEME_INFO.items():
        if scheme.replace("-", " ") in msg or scheme.replace("-", "") in msg:
            return {"reply": f"**{scheme.upper()}** 🏛️\n{info}", "type": "scheme_info"}

    if any(w in msg for w in ["scheme", "subsidy", "government", "yojana", "loan", "insurance"]):
        reply = "**Government Schemes for Farmers** 🏛️\n"
        for s, info in SCHEME_INFO.items():
            reply += f"• **{s.upper()}** - {info.split('.')[0]}.\n"
        return {"reply": reply, "type": "scheme_list", "suggestions": [
            "Tell me about PM-KISAN", "How does Fasal Bima work?", "Kisan Credit Card details"
        ]}

    # Season/Weather queries
    if any(w in msg for w in ["kharif", "rabi", "summer", "season"]):
        season = "Kharif" if "kharif" in msg else "Rabi" if "rabi" in msg else "Summer"
        crops_for_season = [c.title() for c, i in CROP_INFO.items() if season in i["season"]]
        reply = f"**{season} Season Crops** 🌦️\n"
        reply += f"Best crops: {', '.join(crops_for_season)}\n"
        reply += f"\nAsk about any specific crop for detailed growing advice!"
        return {"reply": reply, "type": "season_info", "suggestions": [f"Tell me about {c}" for c in crops_for_season[:3]]}

    if any(w in msg for w in ["weather", "rain", "temperature", "forecast", "climate"]):
        return {"reply": f"**Weather Advisory for {user_state}** 🌤️\nUse the Weather page for real-time data, 7-day forecast, and crop impact analysis. Check weather alerts regularly during monsoon season!\n\n**Quick Tips:**\n• Monitor rainfall before sowing\n• Avoid spraying during rain\n• Ensure drainage during heavy rainfall", "type": "weather_info"}

    # Market queries
    if any(w in msg for w in ["price", "market", "mandi", "sell", "rate"]):
        return {"reply": "**Market Intelligence** 📈\nUse the Market page for real-time mandi prices, trends, and volatility analysis.\n\n**Tips for best prices:**\n• Check prices across multiple mandis\n• Sell during peak demand periods\n• Consider storage if prices are low\n• Register on eNAM for wider market access", "type": "market_info", "suggestions": [
            "Tell me about eNAM", "When to sell rice?", "Market trends"
        ]}

    # Soil queries
    if any(w in msg for w in ["soil", "npk", "nutrient", "fertilizer", "nitrogen", "phosphorus", "potassium", "ph"]):
        return {"reply": "**Soil Health Tips** 🧪\n• Get soil tested every 2 years at your nearest KVK\n• Apply fertilizers based on soil test results\n• Use organic manure to improve soil structure\n• Maintain pH between 6.0-7.5 for most crops\n• Rotate legumes to fix nitrogen naturally\n\n**NPK Guide:**\n• N (Nitrogen): For leaf growth\n• P (Phosphorus): For root & flower development\n• K (Potassium): For disease resistance & fruit quality", "type": "soil_info"}

    # Organic farming
    if any(w in msg for w in ["organic", "natural", "chemical free", "bio"]):
        return {"reply": "**Organic Farming** 🌿\n• Use vermicompost & FYM instead of chemical fertilizers\n• Apply neem oil & Trichoderma for pest management\n• Practice crop rotation & intercropping\n• Get organic certification through NPOP/PGS\n• Premium prices: 20-40% higher than conventional\n\n**Subsidies:** Paramparagat Krishi Vikas Yojana provides ₹50,000/ha for organic farming clusters.", "type": "organic_info"}

    # Fallback
    return {"reply": random.choice(FALLBACK), "type": "fallback", "suggestions": [
        "Best crop for Kharif?", "How to treat rust?", "Government schemes", "Soil health tips"
    ]}
