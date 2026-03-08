import asyncio
import sys
import os

# Add parent directory to path to import scrapers
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.blinkit import scrape_blinkit
from scrapers.zepto import scrape_zepto
from scrapers.instamart import scrape_instamart

class MockItem:
    def __init__(self, name, brand=None, quantity=1, weight=None):
        self.name = name
        self.brand = brand
        self.quantity = quantity
        self.weight = weight

async def test_deep_links():
    items = [MockItem("onion")]
    lat, lon = 28.6139, 77.2090
    
    print("\n--- Testing Deep Link Extraction ---")
    
    platforms = [
        ("Blinkit", scrape_blinkit),
        ("Zepto", scrape_zepto),
        ("Instamart", scrape_instamart)
    ]
    
    for name, func in platforms:
        print(f"\nTesting {name}...")
        try:
            res = await func(items, lat, lon)
            for item in res.items:
                if item.available:
                    print(f"[{name}] Matched: {item.matched_product_name}")
                    print(f"[{name}] Product Link: {item.product_url}")
                    if "search" in item.product_url or "q=" in item.product_url or "query=" in item.product_url:
                        if "/prn/" in item.product_url or "/pn/" in item.product_url or "/item/" in item.product_url:
                             print(f"✅ Success: Deep link found.")
                        else:
                             print(f"⚠️ Warning: URL might still be a search link: {item.product_url}")
                    else:
                        print(f"✅ Success: Deep link found.")
                else:
                    print(f"[{name}] Not found")
        except Exception as e:
            print(f"[{name}] Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_deep_links())
