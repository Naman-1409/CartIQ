const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  try {
    const p1 = await context.newPage();
    console.log("=== BigBasket ===");
    await p1.goto('https://www.bigbasket.com/pd/10000159/fresho-potato-1-kg/');
    await p1.waitForTimeout(4000);
    const bbInfo = await p1.evaluate(() => {
        let addBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText?.includes('Add to basket') || b.innerText?.trim() === 'Add');
        return addBtns.map(b => `<${b.tagName} class="${b.className}" id="${b.id}"> ${b.outerHTML.substring(0, 150)}`);
    });
    console.log('BB Add Buttons:', bbInfo);
    
    console.log("\n=== Zepto ===");
    const p2 = await context.newPage();
    await p2.goto('https://www.zeptonow.com/', {waitUntil: 'domcontentloaded'});
    await p2.waitForTimeout(1000);
    await p2.goto('https://www.zeptonow.com/pn/amul-taaza-homogenised-toned-milk/pvid/1cf426bf-b248-42f0-97cc-f0f878b4bdff');
    await p2.waitForTimeout(4000);
    const zepInfo = await p2.evaluate(() => {
        let addBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText?.trim() === 'Add' || b.innerText?.includes('Add to Cart'));
        return addBtns.map(b => `<${b.tagName} class="${b.className}" data-testid="${b.getAttribute('data-testid')}"> ${b.outerHTML.substring(0, 150)}`);
    });
    console.log('Zepto Add Buttons:', zepInfo);
    
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
