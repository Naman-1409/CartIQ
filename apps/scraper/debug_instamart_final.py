import asyncio
from playwright.async_api import async_playwright
from scrapers.stealth_helper import apply_stealth

async def debug_instamart_final():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Desktop UA
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        # Use MacIntel to match UA
        await apply_stealth(page, platform="MacIntel")
        
        # 1. Set Location correctly
        print("Navigating to Swiggy Home...")
        await page.goto("https://www.swiggy.com", wait_until="domcontentloaded")
        await asyncio.sleep(4)
        
        try:
            # Click on location input to ensure focus (some overlays might be there)
            loc_input = await page.wait_for_selector("input#location", timeout=5000)
            await loc_input.click()
            print("Typing 'New Delhi'...")
            await loc_input.fill("New Delhi")
            await asyncio.sleep(3)
            
            # Click the first suggestion - using the selector found by browser_subagent
            suggestion = await page.wait_for_selector("div._2BgUI[role='button']", timeout=10000)
            if suggestion:
                print("Clicking suggestion...")
                await suggestion.click()
                await asyncio.sleep(5)
        except Exception as e:
            print(f"Location setting error: {e}")
        
        queries = ["onion"]
        for query in queries:
            print(f"\nSearching for: {query}")
            url = f"https://www.swiggy.com/instamart/search?custom_back=true&query={query.replace(' ', '%20')}"
            await page.goto(url, wait_until="domcontentloaded")
            await asyncio.sleep(5)
            
            # Check for error button
            error_btn = await page.query_selector("button:has-text('Try Again'), button:has-text('Retry')")
            if error_btn:
                print("Found error page, clicking retry...")
                await error_btn.click()
                await asyncio.sleep(8)
            
            # Extract info
            info = await page.evaluate("""(query) => {
                const results = [];
                const words = query.toLowerCase().split(' ');
                const all = Array.from(document.querySelectorAll('*'));
                const priceElements = all.filter(el => {
                    const txt = el.innerText || "";
                    return txt.includes('₹') && 
                           /₹\\s*\\d+/.test(txt) &&
                           el.children.length === 0;
                });
                
                for (const pEl of priceElements) {
                    const priceText = pEl.innerText || "";
                    const match = priceText.match(/₹\\s*(\\d+)/);
                    if (!match) continue;
                    const price = parseFloat(match[1]);
                    
                    let current = pEl;
                    let foundName = null;
                    let steps = 0;
                    while (current && steps < 10) {
                        const candidates = Array.from(current.querySelectorAll('div, span, p, h1, h2, h3, h4'))
                            .map(el => (el.innerText || "").trim())
                            .filter(t => t.length > 3 && t.length < 100 && !t.includes('₹'));
                        for (const c of candidates) {
                            if (words.some(w => c.toLowerCase().includes(w))) {
                                foundName = c;
                                break;
                            }
                        }
                        if (foundName) break;
                        current = current.parentElement;
                        steps++;
                    }
                    if (foundName) results.push({name: foundName, price: price});
                }
                return results;
            }""", query)
            
            print(f"Results for {query}: {len(info)}")
            if info:
                print(f"Top Result: {info[0]['name']} - ₹{info[0]['price']}")
            
            await page.screenshot(path=f"final_instamart_debug_{query}.png", full_page=True)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_instamart_final())
