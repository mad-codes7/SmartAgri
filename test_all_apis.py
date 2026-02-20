"""Quick smoke-test for every API endpoint."""
import requests, json, sys

BASE = "http://localhost:8000"
TOKEN = None
RESULTS = []
OUT = open("test_results.txt", "w", encoding="utf-8")


def test(method, path, expected_status=200, json_body=None, params=None, need_auth=True):
    url = BASE + path
    headers = {}
    if need_auth and TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    try:
        if method == "GET":
            r = requests.get(url, params=params, headers=headers, timeout=10)
        elif method == "POST":
            r = requests.post(url, json=json_body, headers=headers, timeout=10)
        elif method == "PUT":
            r = requests.put(url, json=json_body, headers=headers, timeout=10)
        
        ok = r.status_code == expected_status
        detail = ""
        if not ok:
            try:
                detail = r.json().get("detail", "")[:80]
            except:
                detail = r.text[:80]
        status = "PASS" if ok else "FAIL"
        RESULTS.append((status, method, path, r.status_code, detail))
        return r
    except Exception as e:
        RESULTS.append(("ERR", method, path, 0, str(e)[:80]))
        return None

# 1. Health
test("GET", "/health", need_auth=False)

# 2. Root
test("GET", "/", need_auth=False)

# 3. Register (may fail if user exists — that's ok)
r = test("POST", "/api/auth/register", expected_status=201, json_body={
    "name": "Test Farmer", "email": "test@farm.com", "password": "Test1234!",
    "state": "Maharashtra", "district": "Pune"
}, need_auth=False)
if r and r.status_code not in (201, 400):
    print("Register unexpected:", r.status_code, r.text[:100])

# 4. Login
r = test("POST", "/api/auth/login", json_body={
    "email": "test@farm.com", "password": "Test1234!"
}, need_auth=False)
if r and r.status_code == 200:
    TOKEN = r.json().get("access_token")
    RESULTS[-1] = ("PASS", "POST", "/api/auth/login", 200, f"token={'yes' if TOKEN else 'no'}")

# 5. Auth me
test("GET", "/api/auth/me")

# 6. Market prices (all)
test("GET", "/api/market/prices")

# 7. Market prices (state filter)
test("GET", "/api/market/prices", params={"state": "Maharashtra"})

# 8. Market prices (district filter) 
test("GET", "/api/market/prices", params={"state": "Maharashtra", "district": "Pune"})

# 9. Market trend
test("GET", "/api/market/trends/wheat")

# 10. Market volatility
test("GET", "/api/market/volatility/wheat")

# 11. Market top-gainers
test("GET", "/api/market/top-gainers")

# 12. Market top-losers
test("GET", "/api/market/top-losers")

# 13. Market forecast
test("GET", "/api/market/forecast/wheat")

# 14. Weather
test("GET", "/api/weather/current", params={"state": "Maharashtra"})

# 15. Crops
test("GET", "/api/crops/")

# 16. Schemes
test("GET", "/api/schemes/")

# 17. Recommend
test("POST", "/api/recommend/", json_body={"state": "Maharashtra", "district": "Pune", "season": "kharif", "soil_type": "black"})

# 18. History
test("GET", "/api/history/")

# 19. History stats
test("GET", "/api/history/stats")

# 20. Districts list
test("GET", "/api/districts/list")

# 21. District profile
test("GET", "/api/districts/profile", params={"district": "Pune", "state": "Maharashtra"})

# 22. District mandis
test("GET", "/api/districts/mandis", params={"district": "Pune", "state": "Maharashtra"})

# 23. District alerts
test("GET", "/api/districts/alerts", params={"district": "Pune", "state": "Maharashtra"})

# 24. District krishi-vibhag
test("GET", "/api/districts/krishi-vibhag", params={"district": "Pune", "state": "Maharashtra"})

# 25. Community posts
test("GET", "/api/community/posts", params={"district": "Pune"})

# 26. Community create post
test("POST", "/api/community/posts", expected_status=201, json_body={
    "content": "Testing community post from Pune farmer!", "category": "general"
})

# 27. Community my-posts
test("GET", "/api/community/my-posts")

# 28. Disease detection (just check endpoint exists)
test("GET", "/api/disease/history")

# 29. Chatbot
test("POST", "/api/chatbot/message", json_body={"message": "hello"})

# Print results
def out(s):
    print(s)
    OUT.write(s + "\n")

out("\n" + "="*70)
out(f"{'STATUS':6} {'METHOD':6} {'ENDPOINT':42} {'CODE':5} DETAIL")
out("="*70)
for status, method, path, code, detail in RESULTS:
    icon = "OK" if status == "PASS" else "XX" if status == "FAIL" else "!!"
    out(f"{icon} {status:4}  {method:6} {path:42} {code:3}  {detail}")

passes = sum(1 for r in RESULTS if r[0] == "PASS")
fails = sum(1 for r in RESULTS if r[0] == "FAIL")
errs = sum(1 for r in RESULTS if r[0] == "ERR")
out(f"\nTotal: {len(RESULTS)} | Pass: {passes} | Fail: {fails} | Error: {errs}")
OUT.close()

