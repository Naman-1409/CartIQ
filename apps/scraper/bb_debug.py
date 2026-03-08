import asyncio
from playwright.async_api import async_playwright

async def debug_bb():
    print("Starting Bigbasket debug script...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            print("Navigating to BB Search for 'onion'...")
            # Use their standard autocomplete search
            await page.goto("https://www.bigbasket.com/custompage/sysgen/?type=pc&slug=onion", timeout=30000)
            await asyncio.sleep(8)
            
            # Save screenshot
            await page.screenshot(path="bb_debug.png", full_page=True)
            print("Screenshot saved to bb_debug.png")
            
            # Save HTML
            html = await page.content()
            with open("bb_debug.html", "w") as f:
                f.write(html)
            print("HTML saved to bb_debug.html")
            
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_bb())
