"""
SmartAgri AI - Geographic & Crop Priority Data
Real state → district → primary crop mappings based on ICAR/APEDA reports.
"""
import json
import os

# ─────────────────────────────────────────────────────────────────────
# REAL STATE → DISTRICT MAP
# Source: Census of India / state agriculture department records
# ─────────────────────────────────────────────────────────────────────
STATE_DISTRICTS = {
    "Punjab": [
        "Amritsar", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka",
        "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala",
        "Ludhiana", "Mansa", "Moga", "Mohali", "Muktsar",
        "Nawanshahr", "Pathankot", "Patiala", "Rupnagar", "Sangrur",
        "Tarn Taran",
    ],
    "Haryana": [
        "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad",
        "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal",
        "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal",
        "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa",
        "Sonipat", "Yamunanagar",
    ],
    "Uttar Pradesh": [
        "Agra", "Aligarh", "Ambedkarnagar", "Amethi", "Amroha",
        "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich",
        "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly",
        "Basti", "Bijnor", "Budaun", "Bulandshahr", "Chandauli",
        "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad",
        "Fatehpur", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur",
        "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun",
        "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar",
        "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri", "Lalitpur",
        "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura",
        "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar",
        "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur",
        "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli",
        "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur",
        "Unnao", "Varanasi",
    ],
    "Madhya Pradesh": [
        "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat",
        "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur",
        "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas",
        "Dhar", "Dindori", "Guna", "Gwalior", "Harda",
        "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni",
        "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena",
        "Narsinghpur", "Neemuch", "Niwari", "Panna", "Raisen",
        "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna",
        "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur",
        "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain",
        "Umaria", "Vidisha",
    ],
    "Maharashtra": [
        "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed",
        "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli",
        "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur",
        "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded",
        "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani",
        "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
        "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim",
        "Yavatmal",
    ],
    "Rajasthan": [
        "Ajmer", "Alwar", "Banswara", "Baran", "Barmer",
        "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh",
        "Churu", "Dausa", "Dholpur", "Dungarpur", "Ganganagar",
        "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar",
        "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur",
        "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar",
        "Sirohi", "Tonk", "Udaipur",
    ],
    "Karnataka": [
        "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
        "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga",
        "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan",
        "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal",
        "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga",
        "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir",
    ],
    "Tamil Nadu": [
        "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
        "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
        "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
        "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
        "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
        "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
        "Tirupattur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
        "Vellore", "Villupuram", "Virudhunagar",
    ],
    "Gujarat": [
        "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha",
        "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod",
        "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar",
        "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana",
        "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan",
        "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar",
        "Tapi", "Vadodara", "Valsad",
    ],
    "West Bengal": [
        "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur",
        "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram",
        "Kalimpong", "Kolkata", "Maldah", "Murshidabad", "Nadia",
        "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur",
        "Purulia", "South 24 Parganas", "Uttar Dinajpur",
    ],
    "Kerala": [
        "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod",
        "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad",
        "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad",
    ],
    "Bihar": [
        "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai",
        "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran",
        "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur",
        "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura",
        "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada",
        "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur",
        "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan",
        "Supaul", "Vaishali", "West Champaran",
    ],
    "Andhra Pradesh": [
        "Alluri Sitharama Raju", "Anakapalli", "Annamayya", "Bapatla", "Chittoor",
        "East Godavari", "Eluru", "Guntur", "Kadapa", "Kakinada",
        "Konaseema", "Krishna", "Kurnool", "Manyam", "Nandyal",
        "Nellore", "NTR", "Palnadu", "Prakasam", "Srikakulam",
        "Sri Sathya Sai", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari",
    ],
    "Telangana": [
        "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon",
        "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam",
        "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak",
        "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet",
        "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy",
        "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy",
        "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri",
    ],
    "Odisha": [
        "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak",
        "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati",
        "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi",
        "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput",
        "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada",
        "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundergarh",
    ],
    "Jharkhand": [
        "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka",
        "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla",
        "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar",
        "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi",
        "Sahebganj", "Saraikela Kharsawan", "Simdega", "West Singhbhum",
    ],
    "Chhattisgarh": [
        "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara",
        "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg",
        "Gariaband", "Gaurela Pendra Marwahi", "Janjgir-Champa", "Jashpur",
        "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya",
        "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur",
        "Rajnandgaon", "Sukma", "Surajpur", "Surguja",
    ],
    "Uttarakhand": [
        "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun",
        "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh",
        "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi",
    ],
    "Himachal Pradesh": [
        "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur",
        "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur",
        "Solan", "Una",
    ],
    "Assam": [
        "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar",
        "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri",
        "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi",
        "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong",
        "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon",
        "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar",
        "Tinsukia", "Udalguri", "West Karbi Anglong",
    ],
    "Goa": [
        "North Goa", "South Goa",
    ],
    "Jammu and Kashmir": [
        "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda",
        "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam",
        "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban",
        "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur",
    ],
    "Meghalaya": [
        "East Garo Hills", "East Jaintia Hills", "East Khasi Hills",
        "North Garo Hills", "Ri Bhoi", "South Garo Hills",
        "South West Garo Hills", "South West Khasi Hills",
        "West Garo Hills", "West Jaintia Hills", "West Khasi Hills",
    ],
    "Manipur": [
        "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West",
        "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney",
        "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul",
    ],
    "Tripura": [
        "Dhalai", "Gomati", "Khowai", "North Tripura",
        "Sepahijala", "South Tripura", "Unakoti", "West Tripura",
    ],
    "Nagaland": [
        "Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng",
        "Mokokchung", "Mon", "Niuland", "Noklak", "Peren",
        "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto",
    ],
    "Mizoram": [
        "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib",
        "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip",
    ],
    "Arunachal Pradesh": [
        "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang",
        "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit",
        "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri",
        "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang",
        "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng",
        "West Siang",
    ],
    "Sikkim": [
        "East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim",
    ],
    "Delhi": [
        "Central Delhi", "East Delhi", "New Delhi", "North Delhi",
        "North East Delhi", "North West Delhi", "Shahdara",
        "South Delhi", "South East Delhi", "South West Delhi", "West Delhi",
    ],
    "Puducherry": [
        "Karaikal", "Mahe", "Puducherry", "Yanam",
    ],
    "Chandigarh": [
        "Chandigarh",
    ],
    "Ladakh": [
        "Kargil", "Leh",
    ],
}

# ─────────────────────────────────────────────────────────────────────
# REGIONAL CROPS — loaded from the authoritative per-district JSON
# ─────────────────────────────────────────────────────────────────────
_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw")
with open(os.path.join(_DATA_DIR, "regional_crops.json"), "r", encoding="utf-8") as _f:
    REGIONAL_CROPS = json.load(_f)

# ─────────────────────────────────────────────────────────────────────
# STATE-LEVEL DEFAULT PRIMARY CROPS
# Based on ICAR annual agricultural statistics & state agri dept reports
# ─────────────────────────────────────────────────────────────────────
STATE_PRIMARY_CROPS = {
    "Punjab":         ["Wheat", "Rice", "Cotton", "Maize", "Sugarcane", "Mustard", "Potato"],
    "Haryana":        ["Wheat", "Rice", "Cotton", "Mustard", "Sugarcane", "Maize", "Potato"],
    "Uttar Pradesh":  ["Wheat", "Sugarcane", "Rice", "Potato", "Mustard", "Maize", "Onion"],
    "Madhya Pradesh": ["Soybean", "Wheat", "Chickpea", "Cotton", "Mustard", "Maize", "Onion"],
    "Maharashtra":    ["Cotton", "Soybean", "Sugarcane", "Onion", "Chickpea", "Tomato", "Maize"],
    "Rajasthan":      ["Mustard", "Wheat", "Chickpea", "Groundnut", "Maize", "Onion"],
    "Karnataka":      ["Cotton", "Groundnut", "Soybean", "Sugarcane", "Tomato", "Maize", "Rice"],
    "Tamil Nadu":     ["Rice", "Sugarcane", "Groundnut", "Cotton", "Tomato", "Maize", "Onion"],
    "Gujarat":        ["Cotton", "Groundnut", "Wheat", "Rice", "Sugarcane", "Onion", "Potato"],
    "West Bengal":    ["Rice", "Potato", "Wheat", "Maize", "Onion", "Tomato", "Mustard"],
    "Kerala":         ["Rice", "Tomato", "Maize"],
    "Bihar":          ["Wheat", "Rice", "Maize", "Sugarcane", "Potato", "Mustard", "Onion"],
    "Andhra Pradesh": ["Rice", "Cotton", "Sugarcane", "Groundnut", "Tomato", "Maize", "Chickpea"],
    "Telangana":      ["Rice", "Cotton", "Soybean", "Sugarcane", "Maize", "Groundnut", "Chickpea"],
    "Odisha":         ["Rice", "Sugarcane", "Groundnut", "Maize", "Potato", "Tomato", "Mustard"],
}

# ─────────────────────────────────────────────────────────────────────
# DISTRICT-LEVEL CROP OVERRIDES
# Only for agriculturally significant districts with distinct crop profiles
# Source: District-level crop statistics, KVK (Krishi Vigyan Kendra) data
# ─────────────────────────────────────────────────────────────────────
DISTRICT_CROP_OVERRIDES = {
    # Punjab
    "Bathinda":         ["Cotton", "Wheat", "Rice", "Maize", "Mustard"],
    "Mansa":            ["Cotton", "Wheat", "Rice", "Mustard"],
    "Muktsar":          ["Cotton", "Wheat", "Rice"],
    "Ludhiana":         ["Wheat", "Rice", "Maize", "Potato", "Sugarcane"],
    "Amritsar":         ["Wheat", "Rice", "Potato", "Maize"],
    "Jalandhar":        ["Wheat", "Rice", "Potato", "Maize"],
    "Patiala":          ["Wheat", "Rice", "Maize", "Sugarcane"],
    "Hoshiarpur":       ["Wheat", "Maize", "Rice", "Potato"],
    "Sangrur":          ["Wheat", "Rice", "Cotton", "Maize"],

    # Haryana
    "Sirsa":            ["Cotton", "Wheat", "Rice", "Mustard"],
    "Hisar":            ["Cotton", "Wheat", "Mustard", "Maize"],
    "Fatehabad":        ["Cotton", "Wheat", "Mustard", "Rice"],
    "Karnal":           ["Wheat", "Rice", "Sugarcane", "Potato", "Maize"],
    "Kurukshetra":      ["Rice", "Wheat", "Potato", "Sugarcane"],
    "Sonipat":          ["Wheat", "Rice", "Sugarcane", "Maize"],
    "Yamunanagar":      ["Sugarcane", "Wheat", "Rice", "Maize"],

    # Uttar Pradesh
    "Muzaffarnagar":    ["Sugarcane", "Wheat", "Rice", "Mustard"],
    "Saharanpur":       ["Sugarcane", "Wheat", "Rice", "Maize"],
    "Agra":             ["Potato", "Wheat", "Mustard", "Onion"],
    "Mathura":          ["Potato", "Wheat", "Mustard", "Onion"],
    "Aligarh":          ["Potato", "Wheat", "Sugarcane", "Mustard"],
    "Meerut":           ["Sugarcane", "Wheat", "Maize", "Potato"],
    "Bareilly":         ["Wheat", "Rice", "Sugarcane", "Maize"],
    "Lakhimpur Kheri":  ["Sugarcane", "Rice", "Wheat", "Maize"],
    "Varanasi":         ["Wheat", "Rice", "Mustard", "Maize"],
    "Gorakhpur":        ["Sugarcane", "Rice", "Wheat", "Maize"],
    "Kanpur Nagar":     ["Wheat", "Maize", "Potato", "Mustard"],
    "Lucknow":          ["Wheat", "Rice", "Sugarcane", "Maize"],

    # Madhya Pradesh
    "Mandsaur":         ["Onion", "Chickpea", "Wheat", "Soybean", "Mustard"],   # Garlic not in calendar
    "Dewas":            ["Soybean", "Wheat", "Onion", "Cotton", "Chickpea"],
    "Hoshangabad":      ["Soybean", "Wheat", "Chickpea", "Maize"],
    "Indore":           ["Soybean", "Wheat", "Onion", "Maize", "Chickpea"],
    "Ujjain":           ["Onion", "Soybean", "Wheat", "Mustard"],
    "Ratlam":           ["Soybean", "Wheat", "Maize", "Onion"],
    "Chhindwara":       ["Soybean", "Wheat", "Maize", "Cotton"],
    "Jabalpur":         ["Wheat", "Soybean", "Maize", "Rice"],

    # Maharashtra
    "Nashik":           ["Onion", "Tomato", "Sugarcane", "Cotton", "Potato"],
    "Pune":             ["Onion", "Soybean", "Tomato", "Sugarcane"],
    "Ahmednagar":       ["Onion", "Sugarcane", "Soybean", "Cotton"],
    "Kolhapur":         ["Sugarcane", "Rice", "Soybean", "Cotton", "Onion"],
    "Satara":           ["Sugarcane", "Soybean", "Onion", "Tomato"],
    "Sangli":           ["Sugarcane", "Onion", "Soybean", "Tomato"],
    "Solapur":          ["Sugarcane", "Onion", "Cotton", "Soybean"],
    "Jalgaon":          ["Cotton", "Soybean", "Wheat", "Onion"],     # Banana → Cotton (primary)
    "Latur":            ["Soybean", "Cotton", "Chickpea", "Onion"],
    "Yavatmal":         ["Cotton", "Soybean", "Chickpea"],
    "Akola":            ["Cotton", "Soybean", "Wheat", "Chickpea"],
    "Amravati":         ["Cotton", "Soybean", "Wheat", "Chickpea"],
    "Nagpur":           ["Cotton", "Soybean", "Wheat", "Chickpea"],  # Oranges → Chickpea (calendar)

    # Rajasthan
    "Ganganagar":       ["Cotton", "Wheat", "Mustard", "Rice", "Groundnut"],
    "Hanumangarh":      ["Cotton", "Wheat", "Mustard", "Rice"],
    "Bikaner":          ["Mustard", "Wheat", "Chickpea", "Groundnut"],
    "Jodhpur":          ["Mustard", "Wheat", "Groundnut", "Maize"],
    "Jaipur":           ["Wheat", "Mustard", "Onion", "Maize", "Chickpea"],
    "Kota":             ["Soybean", "Wheat", "Mustard", "Maize", "Chickpea"],
    "Alwar":            ["Wheat", "Mustard", "Potato", "Onion"],
    "Nagaur":           ["Mustard", "Wheat", "Onion", "Chickpea"],
    "Sikar":            ["Mustard", "Wheat", "Chickpea", "Groundnut"],

    # Karnataka
    "Raichur":          ["Rice", "Cotton", "Sugarcane", "Groundnut", "Maize"],
    "Vijayapura":       ["Sugarcane", "Cotton", "Soybean", "Chickpea", "Onion"],
    "Belagavi":         ["Sugarcane", "Cotton", "Soybean", "Rice", "Wheat"],
    "Gadag":            ["Cotton", "Groundnut", "Chickpea", "Wheat", "Soybean"],
    "Haveri":           ["Cotton", "Soybean", "Groundnut", "Maize"],
    "Dharwad":          ["Cotton", "Soybean", "Groundnut", "Chickpea", "Maize"],
    "Tumakuru":         ["Groundnut", "Tomato", "Cotton", "Maize"],
    "Mandya":           ["Sugarcane", "Rice", "Maize", "Tomato", "Potato"],
    "Mysuru":           ["Sugarcane", "Rice", "Maize", "Tomato"],

    # Tamil Nadu
    "Thanjavur":        ["Rice", "Sugarcane", "Groundnut", "Maize"],
    "Tiruchirapalli":   ["Rice", "Sugarcane", "Groundnut", "Maize"],
    "Coimbatore":       ["Cotton", "Sugarcane", "Maize", "Tomato", "Groundnut"],
    "Salem":            ["Maize", "Rice", "Sugarcane", "Tomato"],
    "Tiruppur":         ["Cotton", "Maize", "Groundnut", "Tomato"],
    "Erode":            ["Sugarcane", "Cotton", "Maize", "Groundnut", "Tomato"],
    "Dharmapuri":       ["Maize", "Groundnut", "Tomato", "Rice"],
    "Villupuram":       ["Rice", "Groundnut", "Sugarcane", "Maize"],

    # Gujarat
    "Rajkot":           ["Cotton", "Groundnut", "Wheat", "Maize"],
    "Junagadh":         ["Groundnut", "Cotton", "Wheat", "Sugarcane"],
    "Amreli":           ["Groundnut", "Cotton", "Wheat", "Sugarcane"],
    "Banaskantha":      ["Potato", "Wheat", "Onion", "Cotton", "Maize"],
    "Mehsana":          ["Potato", "Wheat", "Onion", "Mustard", "Cotton"],
    "Surat":            ["Sugarcane", "Rice", "Cotton", "Maize"],
    "Anand":            ["Sugarcane", "Wheat", "Potato", "Onion", "Rice"],
    "Kheda":            ["Sugarcane", "Wheat", "Cotton", "Rice", "Potato"],         # Tobacco not in calendar
    "Surendranagar":    ["Cotton", "Groundnut", "Wheat", "Mustard"],

    # West Bengal
    "Murshidabad":      ["Rice", "Wheat", "Potato", "Onion", "Mustard", "Maize"],  # Jute not in calendar
    "Purba Bardhaman":  ["Rice", "Potato", "Wheat", "Maize", "Mustard"],
    "Hooghly":          ["Rice", "Potato", "Wheat", "Tomato", "Mustard"],            # Jute not in calendar
    "Nadia":            ["Rice", "Potato", "Wheat", "Maize"],
    "Maldah":           ["Rice", "Wheat", "Potato", "Maize", "Mustard"],            # Mango not in calendar
    "North 24 Parganas":["Rice", "Potato", "Tomato", "Wheat"],
    "Paschim Medinipur":["Rice", "Potato", "Maize", "Wheat", "Tomato"],

    # Bihar
    "West Champaran":   ["Sugarcane", "Wheat", "Rice", "Maize"],
    "East Champaran":   ["Sugarcane", "Wheat", "Rice", "Maize", "Potato"],
    "Saran":            ["Wheat", "Rice", "Sugarcane", "Maize", "Potato"],
    "Muzaffarpur":      ["Wheat", "Rice", "Maize", "Potato", "Mustard"],           # Litchi not in calendar
    "Patna":            ["Wheat", "Rice", "Maize", "Potato", "Onion"],
    "Nalanda":          ["Wheat", "Rice", "Potato", "Onion", "Maize"],
    "Rohtas":           ["Wheat", "Rice", "Mustard", "Maize"],
    "Vaishali":         ["Wheat", "Rice", "Maize", "Sugarcane", "Potato"],

    # Andhra Pradesh
    "Guntur":           ["Cotton", "Rice", "Sugarcane", "Chickpea", "Maize"],
    "Krishna":          ["Rice", "Sugarcane", "Cotton", "Maize", "Tomato"],
    "East Godavari":    ["Rice", "Sugarcane", "Maize", "Cotton", "Tomato"],
    "West Godavari":    ["Rice", "Sugarcane", "Maize", "Cotton", "Tomato"],
    "Kurnool":          ["Cotton", "Groundnut", "Rice", "Maize", "Tomato"],
    "Prakasam":         ["Cotton", "Rice", "Groundnut", "Tomato", "Onion"],
    "Nellore":          ["Rice", "Sugarcane", "Cotton", "Groundnut"],
    "Chittoor":         ["Tomato", "Rice", "Sugarcane", "Groundnut", "Maize"],

    # Telangana
    "Warangal Rural":   ["Rice", "Cotton", "Maize", "Soybean"],
    "Warangal Urban":   ["Rice", "Cotton", "Maize", "Soybean"],
    "Nalgonda":         ["Rice", "Cotton", "Sugarcane", "Maize", "Groundnut"],
    "Karimnagar":       ["Rice", "Cotton", "Maize", "Soybean"],
    "Khammam":          ["Rice", "Cotton", "Sugarcane", "Maize"],
    "Medak":            ["Rice", "Maize", "Cotton", "Soybean", "Sugarcane"],
    "Nizamabad":        ["Rice", "Maize", "Cotton", "Sugarcane", "Soybean"],

    # Odisha
    "Cuttack":          ["Rice", "Potato", "Maize", "Tomato", "Sugarcane"],
    "Puri":             ["Rice", "Potato", "Maize", "Tomato"],
    "Sambalpur":        ["Rice", "Sugarcane", "Maize", "Groundnut"],
    "Ganjam":           ["Rice", "Sugarcane", "Groundnut", "Tomato", "Maize"],
    "Bargarh":          ["Rice", "Sugarcane", "Maize", "Groundnut"],
    "Sundargarh":       ["Rice", "Maize", "Potato", "Tomato"],
}

# ─────────────────────────────────────────────────────────────────────
# CROP SOWING WINDOWS — Real seasonal sowing calendar
# Month numbers (1=Jan … 12=Dec)
# ─────────────────────────────────────────────────────────────────────
CROP_SOWING_WINDOWS = {
    "Wheat":      {"months": [10, 11, 12], "season": "Rabi",  "icon": "❄️"},
    "Rice":       {"months": [6, 7],       "season": "Kharif","icon": "☔"},
    "Cotton":     {"months": [4, 5, 6],    "season": "Kharif","icon": "☔"},
    "Maize":      {"months": [6, 7, 10],   "season": "Both",  "icon": "🌦️"},
    "Sugarcane":  {"months": [2, 3, 10],   "season": "Both",  "icon": "🌦️"},
    "Tomato":     {"months": [7, 8, 10, 11],"season": "Both", "icon": "🌦️"},
    "Soybean":    {"months": [6, 7],       "season": "Kharif","icon": "☔"},
    "Mustard":    {"months": [10, 11],     "season": "Rabi",  "icon": "❄️"},
    "Chickpea":   {"months": [10, 11],     "season": "Rabi",  "icon": "❄️"},
    "Potato":     {"months": [10, 11, 12],"season": "Rabi",  "icon": "❄️"},
    "Onion":      {"months": [10, 11, 1],  "season": "Rabi",  "icon": "❄️"},
    "Groundnut":  {"months": [6, 7],       "season": "Kharif","icon": "☔"},
}


def get_districts(state: str):
    """Return sorted district list for a state."""
    return sorted(STATE_DISTRICTS.get(state, []))


def get_crops_ranked_for_location(state: str, district: str, current_month: int):
    """
    Returns all available crops split into:
      - local_crops: crop entries sorted by regional priority
      - other_crops: remaining crops
    Each entry has season_fit: 'optimal' | 'marginal' | 'offseason'

    Data priority:
      1. regional_crops.json  (district-specific, then state _default)
      2. DISTRICT_CROP_OVERRIDES (legacy fallback)
      3. STATE_PRIMARY_CROPS   (final fallback)
    """
    from services.crop_calendar_service import CROP_TIMELINES

    # ── Build priority list from regional_crops.json first ──────────
    priority = []
    state_data = REGIONAL_CROPS.get(state)
    if state_data:
        # Try district-specific entry, fall back to state _default
        region = state_data.get(district) if district else None
        if not region:
            region = state_data.get("_default", {})
        # Collect crops from all seasons (de-duplicated, order preserved)
        seen = set()
        for season_key in ("Kharif", "Rabi", "Summer"):
            for crop in region.get(season_key, []):
                if crop not in seen:
                    priority.append(crop)
                    seen.add(crop)

    # Fallback to legacy overrides / state defaults if regional JSON
    # didn't yield any crops for this location
    if not priority:
        priority = DISTRICT_CROP_OVERRIDES.get(district) or STATE_PRIMARY_CROPS.get(state, [])

    def season_fit(crop_name: str) -> str:
        window = CROP_SOWING_WINDOWS.get(crop_name)
        if not window:
            return "marginal"
        if current_month in window["months"]:
            return "optimal"
        # Within 1 month of window
        for m in window["months"]:
            if abs(current_month - m) <= 1 or abs(current_month - m) == 11:
                return "marginal"
        return "offseason"

    def season_label(crop_name: str) -> str:
        window = CROP_SOWING_WINDOWS.get(crop_name)
        if not window:
            return "Year-round"
        months_abbr = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        m_names = "-".join(months_abbr[m] for m in window["months"])
        return f"{window['season']} crop · Sow in {m_names}"

    all_crops = list(CROP_TIMELINES.keys())

    # Normalize priority list to match CROP_TIMELINES keys exactly
    priority_normalized = [c for c in priority if c in all_crops]
    other = [c for c in sorted(all_crops) if c not in priority_normalized]

    def build_entry(crop_name: str, is_local: bool, rank: int):
        fit = season_fit(crop_name)
        return {
            "name": crop_name,
            "is_local": is_local,
            "season_fit": fit,
            "season_label": season_label(crop_name),
            "season_icon": CROP_SOWING_WINDOWS.get(crop_name, {}).get("icon", "🌱"),
            "rank": rank,
        }

    local_entries = [build_entry(c, True, i) for i, c in enumerate(priority_normalized)]
    other_entries = [build_entry(c, False, len(priority_normalized) + i) for i, c in enumerate(other)]

    return {
        "state": state,
        "district": district,
        "local_crops": local_entries,
        "other_crops": other_entries,
        "local_count": len(local_entries),
        "other_count": len(other_entries),
        "total": len(local_entries) + len(other_entries),
    }
