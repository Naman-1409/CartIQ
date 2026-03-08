import asyncio
from playwright.async_api import async_playwright
import os
import sys

# Add parent directory to path to import scrapers
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scrapers.stealth_helper import apply_stealth

async def debug_instamart_potato():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        await apply_stealth(page)

        print("[Debug] Landing on Swiggy...")
        await page.goto("https://www.swiggy.com", wait_until="networkidle")
        await page.screenshot(path="debug_instamart_landed.png")

        try:
            loc_input = await page.wait_for_selector("input#location", timeout=5000)
            if loc_input:
                print("[Debug] Setting location...")
                await loc_input.click()
                await loc_input.fill("New Delhi")
                await asyncio.sleep(2)
                suggestion = await page.wait_for_selector("div._2BgUI[role='button']", timeout=5000)
                if suggestion:
                    await suggestion.click()
                    await asyncio.sleep(5)
                    print("[Debug] Location set.")
        except Exception as e:
            print(f"[Debug] Location setting failed: {e}")

        search_query = "potato"
        url = f"https://www.swiggy.com/instamart/search?custom_back=true&query={search_query}"
        print(f"[Debug] Searching: {url}")
        await page.goto(url, wait_until="networkidle")
        await asyncio.sleep(5)
        await page.screenshot(path="debug_instamart_search_results.png")

        # Check for error
        retry_btn = await page.query_selector("button:has-text('Try Again'), button:has-text('Retry')")
        if retry_btn:
            print("[Debug] Error page detected. Retrying...")
            await retry_btn.click()
            await asyncio.sleep(8)
            await page.screenshot(path="debug_instamart_after_retry.png")
            
        # Extract content
        content = await page.content()
        with open("debug_instamart_page.html", "w") as f:
            f.write(content)
            
        price_tags = await page.query_selector_all("text=₹")
        print(f"[Debug] Found {len(price_tags)} price tags.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_instamart_potato())
