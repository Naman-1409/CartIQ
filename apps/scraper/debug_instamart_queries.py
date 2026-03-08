import asyncio
from playwright.async_api import async_playwright
from scrapers.stealth_helper import apply_stealth

async def debug_instamart_queries():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Desktop UA
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        await apply_stealth(page)
        
        # 1. Set Location
        print("Navigating to Swiggy Home...")
        await page.goto("https://www.swiggy.com", wait_until="domcontentloaded")
        await asyncio.sleep(3)
        
        loc_input = await page.query_selector("input#location")
        if loc_input:
            print("Typing 'New Delhi'...")
            await loc_input.fill("New Delhi")
            await asyncio.sleep(2)
            await page.keyboard.press("ArrowDown")
            await asyncio.sleep(1)
            await page.keyboard.press("Enter")
            await asyncio.sleep(4)
        
        queries = ["onion", "kissan tomato sauce"]
        for query in queries:
            print(f"\nSearching for: {query}")
            url = f"https://www.swiggy.com/instamart/search?custom_back=true&query={query.replace(' ', '%20')}"
            await page.goto(url, wait_until="domcontentloaded")
            await asyncio.sleep(3)
            
            # Check for error
            error = await page.query_selector("button:has-text('Try Again'), button:has-text('Retry')")
            if error:
                print("Found error page, retrying...")
                await error.click()
                await asyncio.sleep(5)
            
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
            
            await page.screenshot(path=f"debug_instamart_{query.replace(' ', '_')}.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_instamart_queries())
