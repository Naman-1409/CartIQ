import asyncio
from scrapers.blinkit import scrape_blinkit
from scrapers.zepto import scrape_zepto
from scrapers.instamart import scrape_instamart

class MockItem:
    def __init__(self, name, brand=None, quantity=1, weight=None):
        self.name = name
        self.brand = brand
        self.quantity = quantity
        self.weight = weight

async def run_test(query):
    items = [MockItem(query)]
    lat, lon = 28.6139, 77.2090
    
    print(f"\n--- Testing Query: {query} ---")
    
    platforms = [
        ("Blinkit", scrape_blinkit),
        ("Zepto", scrape_zepto),
        ("Instamart", scrape_instamart)
    ]
    
    for name, func in platforms:
        print(f"Testing {name}...")
        try:
            res = await func(items, lat, lon)
            if res.items and res.items[0].available:
                print(f"{name}: {res.items[0].matched_product_name} - ₹{res.items[0].unit_price}")
            else:
                print(f"{name}: Not found")
        except Exception as e:
            print(f"{name} Error: {e}")

async def main():
    await run_test("onion")
    await run_test("kissan tomato sauce")

if __name__ == "__main__":
    asyncio.run(main())
