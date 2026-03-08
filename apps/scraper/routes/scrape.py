"""
Scrape route — dispatches parallel scraping tasks to Blinkit, Zepto, and Instamart
and returns aggregated, normalized results.
"""
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from scrapers.blinkit import scrape_blinkit
from scrapers.zepto import scrape_zepto
from scrapers.bigbasket import scrape_bigbasket

router = APIRouter()

# ── Models ─────────────────────────────────────────────────────────────────────

class ScrapeItem(BaseModel):
    name: str
    quantity: int
    weight: Optional[str] = None
    brand: Optional[str] = None

class ScrapeRequest(BaseModel):
    items: list[ScrapeItem]
    lat: Optional[float] = 12.9716  # default: Bengaluru
    lon: Optional[float] = 77.5946

class PlatformItemResult(BaseModel):
    platform: str
    item_name: str
    matched_product_name: str
    available: bool
    unit_price: float
    quantity: int
    subtotal: float
    image_url: Optional[str] = None
    product_url: Optional[str] = None

class PlatformCart(BaseModel):
    platform: str
    platform_display: str
    color: str
    items: list[PlatformItemResult]
    item_total: float
    delivery_fee: float
    handling_fee: float
    surge_fee: float
    total_payable: float
    estimated_delivery_min: int
    all_items_available: bool

class ScrapeResponse(BaseModel):
    platforms: list[PlatformCart]
    winner: str  # platform key of cheapest
    search_id: str

# ── Route ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=ScrapeResponse)
async def scrape_all(request: ScrapeRequest):
    """
    Dispatches parallel scraping/mock requests to all 3 platforms
    and returns a fully compared cart result.
    """
    if not request.items:
        raise HTTPException(status_code=400, detail="No items provided")

    # Run all 3 scrapers concurrently with a hard timeout
    try:
        results = await asyncio.wait_for(
            asyncio.gather(
                scrape_blinkit(request.items, request.lat, request.lon),
                scrape_zepto(request.items, request.lat, request.lon),
                scrape_bigbasket(request.items, request.lat, request.lon),
                return_exceptions=True
            ),
            timeout=300.0
        )
    except asyncio.TimeoutError:
        print("[Scraper] Global timeout reached during aggregation")
        # Return whatever we have or mock remaining? 
        # For now, we'll raise an error that the gateway will catch
        raise HTTPException(status_code=504, detail="Scraping timed out across all platforms.")

    platforms = []
    for result in results:
        if isinstance(result, Exception):
            # One platform failing does NOT fail the whole request
            continue
        platforms.append(result)

    if not platforms:
        raise HTTPException(status_code=503, detail="All platforms unavailable. Try again later.")

    # Find the winner: 
    # 1. Prefer platforms with the most items available
    # 2. Among those, pick the one with the lowest total_payable
    
    platforms_with_items = [p for p in platforms if sum(1 for i in p.items if i.available) > 0]
    
    if not platforms_with_items:
        # If absolutely nothing found anywhere, just pick the first one as default
        winner = platforms[0]
    else:
        # Sort platforms by: 
        # - Number of available items (descending)
        # - Total payable (ascending)
        def winner_score(p):
            available_count = sum(1 for i in p.items if i.available)
            # We want high available_count and low total_payable
            # Calculate a synthetic score: available_items * 10000 - total_price
            return (available_count, -p.total_payable)
            
        winner = max(platforms_with_items, key=winner_score)

    import uuid
    return ScrapeResponse(
        platforms=platforms,
        winner=winner.platform,
        search_id=str(uuid.uuid4())
    )
