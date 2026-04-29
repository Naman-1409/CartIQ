import asyncio
import sys
import pprint
from scrapers.blinkit import scrape_blinkit
from scrapers.zepto import scrape_zepto
from scrapers.bigbasket import scrape_bigbasket
from pydantic import BaseModel

class MockItem(BaseModel):
    name: str
    quantity: int
    weight: str = None
    brand: str = None

async def test_all(query: str):
    items = [MockItem(name=query, quantity=1)]
    print(f"Testing scraper for query: {query}")
    
    results = await asyncio.gather(
        scrape_blinkit(items, 28.6139, 77.2090),
        scrape_zepto(items, 28.6139, 77.2090),
        scrape_bigbasket(items, 28.6139, 77.2090),
        return_exceptions=True
    )
    
    platforms = ["Blinkit", "Zepto", "Bigbasket"]
    
    for name, res in zip(platforms, results):
        print(f"\n--- {name} ---")
        if isinstance(res, Exception):
            print(f"Error: {res}")
        else:
            for item in res.items:
                print(f"Name: {item.matched_product_name}")
                print(f"URL: {item.product_url}")
                print(f"ProductID: {item.product_id}")
                print(f"VariantID: {item.variant_id}")
                print(f"Price: {item.unit_price}")
                if not item.product_id or not item.product_url:
                    print("❌ MISSING PRODUCT_ID OR URL!")
                else:
                    print("✅ ALL GOOD")

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "tomato"
    asyncio.run(test_all(query))
