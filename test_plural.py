import asyncio
import os
import sys

# Appending the scraper directory correctly
sys.path.append('/Users/soumyakhandelwal/Desktop/Projects 2/Minor 2/apps/scraper')

from scrapers.zepto import scrape_zepto
from routes.scrape import ScrapeItem

async def main():
    items = [
        ScrapeItem(name="tomatoes", quantity=1, weight="1 kg"),
        ScrapeItem(name="potatoes", quantity=1, weight="1 kg")
    ]
    res = await scrape_zepto(items, lat=None, lon=None)
    for i in res.items:
        print(f"Matched: {i.matched_product_name} | Price: {i.unit_price} | Qty: {i.quantity}")

if __name__ == '__main__':
    asyncio.run(main())
