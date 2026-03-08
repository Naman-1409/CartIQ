
import asyncio
import os
import sys

# Add parent directory to path to import scrapers
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scrapers.instamart import scrape_instamart
from routes.scrape import ScrapeItem

async def test_instamart():
    item = ScrapeItem(name="potato", quantity=2, weight="1kg", brand=None)
    items = [item]
    
    print("Testing Instamart Scraper with 'potato'...")
    # Modify internal scrape_instamart locally to save a debug screenshot
    result = await scrape_instamart(items, lat=28.6139, lon=77.2090)
    
    print("\n--- RESULTS ---")
    print(f"Platform: {result.platform_display}")
    print(f"Total Payable: {result.total_payable}")
    print(f"Items Found: {len([i for i in result.items if i.available])}")
    
    for i in result.items:
        print(f"- {i.item_name}: {'✅' if i.available else '❌'} {i.matched_product_name} @ {i.unit_price}")

if __name__ == "__main__":
    asyncio.run(test_instamart())
