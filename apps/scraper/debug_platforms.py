import asyncio
from playwright.async_api import async_playwright
from scrapers.stealth_helper import apply_stealth

async def debug_platform(platform_name, url, screenshot_path):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()
        await apply_stealth(page)
        
        print(f"Navigating to {platform_name}...")
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=40000)
            await asyncio.sleep(8)
            
            # Try to dismiss popups
            for popup_sel in ["button:has-text('Allow')", "button:has-text('Use my location')", "[class*='close']"]:
                try:
                    btn = await page.query_selector(popup_sel)
                    if btn:
                        await btn.click()
                        await asyncio.sleep(2)
                except:
                    pass
                    
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to {screenshot_path}")
            
            # Improved price/name element count
            info = await page.evaluate("""() => {
                const results = {
                    prices: [],
                    names: []
                };
                const alt = Array.from(document.querySelectorAll('*'));
                for (const el of alt) {
                    const text = (el.innerText || "").trim();
                    if (text.includes('₹') && /₹\\s*\\d+/.test(text) && el.children.length === 0) {
                        results.prices.push(text.substring(0, 30));
                    }
                    if (text.length > 3 && text.length < 100 && !text.includes('₹') && el.children.length === 0) {
                        results.names.push(text);
                    }
                }
                return results;
            }""")
            print(f"Found {len(info['prices'])} price elements and {len(info['names'])} name-ish elements.")
            if len(info['prices']) > 0:
                print("First 5 prices:", info['prices'][:5])
            
        except Exception as e:
            print(f"Error debugging {platform_name}: {e}")
        finally:
            await browser.close()

async def main():
    # Zepto
    await debug_platform("Zepto", "https://www.zeptonow.com/search?query=onion", "zepto_debug_v2.png")
    # Instamart
    await debug_platform("Instamart", "https://www.swiggy.com/instamart/search?query=onion", "instamart_debug.png")

if __name__ == "__main__":
    asyncio.run(main())
