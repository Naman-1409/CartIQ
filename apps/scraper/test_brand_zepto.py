import urllib.request
import json

payload = {
    "items": [{"name": "milk", "quantity": 1, "weight": "500ml", "brand": "amul"}],
    "lat": 28.6139,
    "lon": 77.2090
}

req = urllib.request.Request("http://localhost:8001/scrape/", data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as response:
    print("Status:", response.status)
    print("Text:", response.read().decode('utf-8'))
