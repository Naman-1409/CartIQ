import asyncio
from playwright.async_api import async_playwright
from scrapers.stealth_helper import apply_stealth

async def debug_instamart_desktop():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Desktop UA and viewport
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        await apply_stealth(page)
        
        url = "https://www.swiggy.com/instamart/search?query=onion"
        print(f"Navigating to Instamart (Desktop)...")
        try:
            await page.goto(url, wait_until="networkidle", timeout=60000)
            await asyncio.sleep(5)
            
            # Screenshot
            await page.screenshot(path="instamart_desktop_debug.png", full_page=True)
            print("Screenshot saved to instamart_desktop_debug.png")
            
            # Check for prices
            info = await page.evaluate("""() => {
                const results = {
                    prices: [],
                    names: []
                };
                const alt = Array.from(document.querySelectorAll('*'));
                for (const el of alt) {
                    const text = (el.innerText || "").trim();
                    if (text.includes('₹') && /₹\\s*\\d+/.test(text)) {
                        results.prices.push(text.substring(0, 30));
                    }
                    if (text.length > 3 && text.length < 100 && !text.includes('₹')) {
                        results.names.push(text);
                    }
                }
                return results;
            }""")
            print(f"Found {len(info['prices'])} price elements and {len(info['names'])} name-ish elements.")
            
        except Exception as e:
            print(f"Error debugging Instamart: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_instamart_desktop())
