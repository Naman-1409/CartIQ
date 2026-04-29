const { chromium } = require('playwright');

const TEST_URLS = {
  blinkit: 'https://blinkit.com/prn/fresho-tomato-hybrid/prid/328560',
  zepto: 'https://www.zeptonow.com/product/fresho-tomato/pvid/b1c2d3e4',
  bigbasket: 'https://www.bigbasket.com/pd/40006038/fresho-tomato-hybrid-250-g/'
};

const PLATFORM_NAMES = {
  blinkit: 'Blinkit',
  zepto: 'Zepto',
  bigbasket: 'BigBasket'
};

async function discoverSelectors(platform) {
  const url = TEST_URLS[platform];
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔍 Discovering selectors for ${PLATFORM_NAMES[platform]}`);
  console.log(`🌐 URL: ${url}`);
  console.log(`${'═'.repeat(60)}\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const apiCalls = [];
  page.on('response', async (response) => {
    const u = response.url();
    if (u.includes('/api/') && response.status() === 200 &&
        response.headers()['content-type']?.includes('application/json')) {
      try {
        const json = await response.json().catch(() => null);
        if (json && (u.includes('product') || u.includes('search') || u.includes('item'))) {
          apiCalls.push({ url: u, preview: JSON.stringify(json).slice(0, 200) });
        }
      } catch {}
    }
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('⚠️ Navigation timed out — continuing...');
  }

  const allButtons = await page.$$eval(
    'button, [role="button"], div[class*="add"], div[class*="Add"]',
    (els) => els.map((el) => {
      const attrs = {};
      for (const attr of el.attributes) attrs[attr.name] = attr.value;
      return {
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().slice(0, 60),
        className: el.className?.slice(0, 120),
        id: el.id,
        attrs,
        visible: el.offsetParent !== null
      };
    })
  );

  const addButtons = allButtons.filter((b) => {
    const combined = `${b.text} ${b.className} ${JSON.stringify(b.attrs)}`.toLowerCase();
    return combined.includes('add') || combined.includes('cart') ||
           combined.includes('basket') || combined.includes('buy');
  });

  console.log('━'.repeat(50));
  console.log(`✅ ADD-RELATED BUTTONS FOUND (${addButtons.length} total):`);
  console.log('━'.repeat(50));
  addButtons.forEach((b, i) => {
    console.log(`\n[${i + 1}] Text: "${b.text}"`);
    console.log(`     Tag: ${b.tag}`);
    console.log(`     Class: ${b.className}`);
    console.log(`     ID: ${b.id || '(none)'}`);
    console.log(`     Attrs: ${JSON.stringify(b.attrs)}`);
    console.log(`     Visible: ${b.visible}`);

    const selectors = [];
    if (b.id) selectors.push(`#${b.id}`);
    if (b.attrs['data-testid']) selectors.push(`[data-testid="${b.attrs['data-testid']}"]`);
    if (b.attrs['qa']) selectors.push(`button[qa="${b.attrs['qa']}"]`);
    if (b.attrs['aria-label']) selectors.push(`[aria-label="${b.attrs['aria-label']}"]`);
    if (b.className) {
      const classes = b.className.split(' ').filter(c =>
        c.toLowerCase().includes('add') || c.toLowerCase().includes('cart') ||
        c.toLowerCase().includes('basket')
      );
      classes.forEach((c) => selectors.push(`${b.tag}[class*="${c}"]`));
    }
    if (selectors.length) {
      console.log(`     🎯 SUGGESTED SELECTORS:`);
      selectors.forEach((s) => console.log(`        ${s}`));
    }
  });

  console.log('\n' + '═'.repeat(60));
  console.log('📋 PASTE THIS INTO cartRunner.js SELECTORS object:');
  console.log('═'.repeat(60));
  console.log(`
  ${platform}: {
    addButton: "REPLACE_WITH_REAL_ADD_SELECTOR",
    increaseQty: "REPLACE_WITH_REAL_QTY_PLUS_SELECTOR",
    productLoadedSignal: "h1, [class*='ProductName'], [class*='product-name']",
    cartUrl: "${getCartUrl(platform)}"
  },`);

  console.log('\n⏸ Browser open for manual inspection. Press Ctrl+C when done.\n');
  await page.waitForTimeout(120000);
  await browser.close();
}

function getCartUrl(platform) {
  const urls = {
    blinkit: 'https://blinkit.com/checkout/',
    zepto: 'https://www.zeptonow.com/cart',
    bigbasket: 'https://www.bigbasket.com/basket/'
  };
  return urls[platform] || '';
}

const platform = process.argv[2];
if (!['blinkit', 'zepto', 'bigbasket'].includes(platform)) {
  console.log('Usage: node scripts/discoverSelectors.js [blinkit|zepto|bigbasket]');
  process.exit(1);
}
discoverSelectors(platform).catch(console.error);
