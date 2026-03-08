import asyncio
import json
from playwright.async_api import async_playwright
from scrapers.stealth_helper import apply_stealth

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        await apply_stealth(page)

        print("Navigating to Zepto...")
        await page.goto("https://www.zeptonow.com/search?query=amul%20butter", wait_until="domcontentloaded", timeout=20000)
        await asyncio.sleep(5)
        
        # Dump all text inside cards containing 'Amul Salted Butter'
        res = await page.evaluate("""
            () => {
                const results = [];
                const cards = document.querySelectorAll('a[href*="/pn/"]');
                for (let card of cards) {
                    if (card.innerText.includes('Amul Salted Butter')) {
                        results.push(card.innerText);
                    }
                }
                return results;
            }
        """)
        
        for r in res:
            print("-----------------------")
            print(repr(r))
            print("-----------------------")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
