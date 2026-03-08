import asyncio
import os
import sys

# Add the app directory to PYTHONPATH so imports work
sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'scraper'))

from scrapers.zepto import scrape_zepto
from routes.scrape import ScrapeItem

async def main():
    items = [
        ScrapeItem(name="tomato", quantity=1, weight="1 kg")
    ]
    res = await scrape_zepto(items, lat=None, lon=None)
    for i in res.items:
        print(f"Matched: {i.matched_product_name} | Price: {i.unit_price} | Qty: {i.quantity}")

asyncio.run(main())
