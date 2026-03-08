import asyncio
from playwright.async_api import async_playwright
from scrapers.stealth_helper import apply_stealth

async def debug_instamart_retry():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            viewport={"width": 390, "height": 844},
            geolocation={"latitude": 12.9716, "longitude": 77.5946}, # Bengaluru
            permissions=["geolocation"]
        )
        page = await context.new_page()
        await apply_stealth(page)
        
        url = "https://www.swiggy.com/instamart/search?custom_back=true&query=onion"
        print(f"Navigating to Instamart...")
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(5)
            
            # Check for "Try Again" button
            retry_btn = await page.query_selector("button:has-text('Try Again'), button:has-text('Retry')")
            if retry_btn:
                print("Found error page, clicking retry...")
                await retry_btn.click()
                await asyncio.sleep(8)
            
            # Screenshot after potential retry
            await page.screenshot(path="instamart_post_retry_debug.png", full_page=True)
            print("Screenshot saved to instamart_post_retry_debug.png")
            
            # Check for prices
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
                    if (text.length > 3 && text.length < 100 && !text.includes('₹')) {
                        results.names.push(text);
                    }
                }
                return results;
            }""")
            print(f"Found {len(info['prices'])} price elements and {len(info['names'])} name-ish elements.")
            if len(info['prices']) > 0:
                print("First 5 prices:", info['prices'][:5])
            
        except Exception as e:
            print(f"Error debugging Instamart: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_instamart_retry())
