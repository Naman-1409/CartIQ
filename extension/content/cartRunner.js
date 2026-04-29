(async () => {
  const host = window.location.hostname;
  let platform = null;
  if (host.includes('blinkit')) platform = 'blinkit';
  else if (host.includes('zepto') || host.includes('zeptonow')) platform = 'zepto';
  else if (host.includes('bigbasket')) platform = 'bigbasket';
  if (!platform) return;

  const runnerFlag = `__recipeCartRunner_${platform}`;
  if (window[runnerFlag]) return;
  window[runnerFlag] = true;

  const SELECTORS = {
    blinkit: {
      addButton: [
        'button[class*="AddToCart__UpdatedAddButton"]',
        'button[class*="AddToCart"]',
        '[data-testid="add-to-cart"]',
        'button[class*="add-to-cart"]',
      ],
      increaseQty: [
        'button[class*="Quantity__Button"]:last-child',
        'button[class*="IncreaseButton"]',
        '[data-testid="increase-quantity"]',
        'button[aria-label*="increase"], button[aria-label*="plus"]'
      ],
      cartRedirectUrl: 'https://blinkit.com/checkout/',
      productLoadedSignal: [
        '[class*="ProductVariants"]', '[class*="product-detail"]',
        '[class*="AddToCart"]', 'h1'
      ]
    },
    zepto: {
      addButton: [
        'button[class*="AddToCart"]', 'button[class*="add-to-cart"]',
        '[class*="AddButton"] button', '[data-testid*="add"]',
        'button[class*="ActionButton"]'
      ],
      increaseQty: [
        'button[class*="IncreaseQty"]', 'button[class*="PlusButton"]',
        'button[class*="Increase"]', '[aria-label*="increase"]'
      ],
      cartRedirectUrl: 'https://www.zeptonow.com/cart',
      productLoadedSignal: [
        '[class*="ProductDetailPage"]', '[class*="pdp-container"]',
        '[class*="ProductName"]', 'h1'
      ]
    },
    bigbasket: {
      addButton: [
        'button[qa="btn-add"]', 'button[qa="btn-atc"]',
        '[class*="AddToBasket"] button', 'button[class*="add-to-basket"]',
        '[data-qa="add-to-cart"]'
      ],
      increaseQty: [
        'button[qa="btn-plus"]', 'button[qa="btn-increase"]',
        'button[class*="increase-qty"]', '[aria-label="increase quantity"]'
      ],
      cartRedirectUrl: 'https://www.bigbasket.com/basket/',
      productLoadedSignal: [
        '.prod-name', '[class*="ProductDescription"]',
        '[class*="ProductName"]', 'h1'
      ]
    }
  };

  const sel = SELECTORS[platform];
  const cart = await getCart(platform);
  if (!cart) return;

  if (cart.status === 'checkout') {
    if (!isSamePage(window.location.href, sel.cartRedirectUrl)) return;
    
    console.log(`[RecipeCart] Finalizing checkout data for ${platform}...`);
    await sleep(2500); // Give the cart summary API a moment to paint the DOM

    let fees = null;
    if (platform === 'blinkit') {
      fees = await scrapeBlinkitCheckoutFees();
    }

    if (fees) {
      chrome.runtime.sendMessage({ 
        type: 'CART_FEES_EXTRACTED', 
        platform, 
        sessionId: cart.sessionId, 
        fees 
      });
    }

    chrome.runtime.sendMessage({ type: 'CART_COMPLETE', platform, sessionId: cart.sessionId });
    return;
  }

  if (cart.status !== 'pending' || !cart.items?.length) return;

  const { items, sessionId, currentIndex = 0 } = cart;
  const item = items[currentIndex];

  if (!item) {
    chrome.runtime.sendMessage({ type: 'CART_COMPLETE', platform, sessionId });
    return;
  }

  console.log(
    `[RecipeCart] Processing ${platform} item ${currentIndex + 1}/${items.length}: ${item.itemName}`
  );

  progress(sessionId, platform, currentIndex + 1, items.length, item.itemName, 'navigating');

  if (!isSamePage(window.location.href, item.productUrl)) {
    navigateTo(item.productUrl);
    return;
  }

  const pageReady = await waitForAny(sel.productLoadedSignal, 10000);
  if (!pageReady) {
    failed(sessionId, platform, currentIndex, items.length, item.itemName, 'Product page did not render');
    await markItemDone(platform, sessionId, currentIndex, item.itemName, false);
    return;
  }

  await sleep(1000);

  progress(sessionId, platform, currentIndex + 1, items.length, item.itemName, 'adding');
  const added = await tryAddToCart(sel.addButton, item.quantity, sel.increaseQty, platform);

  if (added) {
    progress(sessionId, platform, currentIndex + 1, items.length, item.itemName, 'added');
  } else {
    failed(sessionId, platform, currentIndex, items.length, item.itemName, 'Add button not found after retries');
  }

  await sleep(700);
  await markItemDone(platform, sessionId, currentIndex, item.itemName, added);
})();

async function tryAddToCart(addSelectors, quantity, qtySelectors, platform, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const addBtn = await waitForAny(addSelectors, 7000);
      if (!addBtn) throw new Error('Add button not found');
      addBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(400);
      await clickElement(addBtn);
      await sleep(800);
      if (quantity > 1) await setQuantity(qtySelectors, quantity, platform);
      return true;
    } catch (err) {
      console.warn(`[RecipeCart] Attempt ${attempt}/${maxRetries} failed:`, err?.message || err);
      if (attempt < maxRetries) await sleep(1200 * attempt);
    }
  }
  return false;
}

async function clickElement(el) {
  el.click();
  await sleep(200);
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

async function setQuantity(qtySelectors, targetQty, platform) {
  const qtyInput = document.querySelector(
    'input[class*="qty"], input[name="qty"], input[type="number"][class*="quantity"]'
  );
  if (qtyInput) {
    setReactInputValue(qtyInput, String(targetQty));
    return;
  }
  for (let i = 1; i < targetQty; i++) {
    const plusBtn = await waitForAny(qtySelectors, 3000);
    if (!plusBtn) break;
    await clickElement(plusBtn);
    await sleep(350);
  }
}

function setReactInputValue(el, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function waitForAny(selectors, timeout = 6000) {
  const sels = Array.isArray(selectors) ? selectors : [selectors];
  const combined = sels.join(', ');
  return new Promise((resolve) => {
    const existing = document.querySelector(combined);
    if (existing) return resolve(existing);
    const observer = new MutationObserver(() => {
      const el = document.querySelector(combined);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

function isSamePage(currentUrl, targetUrl) {
  try {
    const current = new URL(currentUrl);
    const target = new URL(targetUrl);
    return current.origin === target.origin && current.pathname === target.pathname;
  } catch {
    return currentUrl === targetUrl;
  }
}

function navigateTo(url) {
  if (!url) return;
  window.location.href = url;
}

function getCart(platform) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_CART', platform }, (response) => {
      resolve(response || null);
    });
  });
}

function markItemDone(platform, sessionId, itemIndex, itemName, success) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'CART_ITEM_DONE', platform, sessionId, itemIndex, itemName, success },
      () => resolve(true)
    );
  });
}

function progress(sessionId, platform, current, total, itemName, status) {
  chrome.runtime.sendMessage({ type: 'CART_PROGRESS', sessionId, platform, current, total, itemName, status });
}

function failed(sessionId, platform, index, total, itemName, error) {
  chrome.runtime.sendMessage({ type: 'CART_ITEM_FAILED', sessionId, platform, itemIndex: index, itemName, error });
  progress(sessionId, platform, index + 1, total, itemName, 'failed');
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function scrapeBlinkitCheckoutFees() {
  const fees = {
    delivery_fee: null,
    handling_fee: null,
    total_payable: null,
    estimated_delivery_min: null
  };

  const textNodes = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6'))
    .filter(el => el.children.length === 0 && el.innerText?.trim().length > 0);

  for (const node of textNodes) {
    const text = node.innerText.trim().toLowerCase();

    // 1. Extract ETA
    if (text.includes('delivery in') && text.includes('minute')) {
      const match = text.match(/delivery in (\d+)/i);
      if (match) fees.estimated_delivery_min = parseInt(match[1]);
    } else if (text.match(/^~(\d+)m$/)) {
      const match = text.match(/^~(\d+)m$/);
      if (match) fees.estimated_delivery_min = parseInt(match[1]);
    }

    const findPriceNear = (el) => {
      let current = el;
      if (current.innerText && current.innerText.match(/₹\s*(\d+)/)) {
        return parseFloat(current.innerText.match(/₹\s*(\d+)/)[1]);
      }
      for (let i = 0; i < 4; i++) { 
        if (!current) break;
        const parentText = current.parentElement?.innerText || '';
        const priceMatch = parentText.match(/₹\s*(\d+)/);
        if (priceMatch) return parseFloat(priceMatch[1]);
        current = current.parentElement;
      }
      return null;
    };

    if (text.includes('delivery charge') || text === 'delivery') {
      const val = findPriceNear(node);
      if (val !== null) fees.delivery_fee = val;
    }

    if (text.includes('handling charge') || text === 'other fees') {
      const val = findPriceNear(node);
      if (val !== null) fees.handling_fee = val;
    }

    if (text.includes('grand total') || text === 'total' || text === 'to pay') {
      const val = findPriceNear(node);
      if (val !== null) fees.total_payable = val;
    }
  }

  // Final fallback using body text if anything is missing
  const bodyText = document.body.innerText.toLowerCase();
  if (fees.delivery_fee === null) {
    const m = bodyText.match(/delivery(?: charge)?\s*[\n\r]*\s*₹\s*(\d+)/i);
    if (m) fees.delivery_fee = parseFloat(m[1]);
  }
  if (fees.handling_fee === null) {
    const m = bodyText.match(/(?:handling charge|other fees)\s*[\n\r]*\s*₹\s*(\d+)/i);
    if (m) fees.handling_fee = parseFloat(m[1]);
  }
  if (fees.total_payable === null) {
    const m = bodyText.match(/(?:grand total|total)\s*[\n\r]*\s*₹\s*(\d+)/i);
    if (m) fees.total_payable = parseFloat(m[1]);
  }

  console.log("[RecipeCart] Scraped Blinkit Fees:", fees);
  return fees;
}
