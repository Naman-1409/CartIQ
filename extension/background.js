const PLATFORM_HOME_URLS = {
  blinkit: 'https://blinkit.com',
  zepto: 'https://www.zeptonow.com',
  bigbasket: 'https://www.bigbasket.com'
};

const PLATFORM_CART_URLS = {
  blinkit: 'https://blinkit.com/checkout/',
  zepto: 'https://www.zeptonow.com/cart',
  bigbasket: 'https://www.bigbasket.com/basket/'
};

function getCartStorageKey(platform) {
  return `cart_${platform}`;
}

async function getStoredCart(platform) {
  const result = await chrome.storage.session.get(getCartStorageKey(platform));
  return result[getCartStorageKey(platform)] || null;
}

async function setStoredCart(platform, cart) {
  await chrome.storage.session.set({ [getCartStorageKey(platform)]: cart });
}

async function startCartAutomation({ platform, items, sessionId }) {
  if (!platform || !items?.length) {
    return { success: false, error: 'Invalid payload' };
  }

  const cartState = {
    platform,
    items,
    sessionId,
    status: 'pending',
    currentIndex: 0,
    createdAt: Date.now()
  };

  await setStoredCart(platform, cartState);

  const firstItemUrl = items[0]?.productUrl || PLATFORM_HOME_URLS[platform];
  const tab = await chrome.tabs.create({
    url: firstItemUrl,
    active: true
  });

  await chrome.storage.session.set({
    [`tab_${tab.id}`]: { platform, sessionId }
  });

  return { success: true, tabId: tab.id, sessionId };
}

async function advanceCart(platform, tabId) {
  const cart = await getStoredCart(platform);
  if (!cart) return;

  const nextIndex = (cart.currentIndex || 0) + 1;

  if (nextIndex >= cart.items.length) {
    await chrome.storage.local.set({
      [`progress_${cart.sessionId}`]: {
        platform,
        sessionId: cart.sessionId,
        current: cart.items.length,
        total: cart.items.length,
        itemName: '',
        status: 'complete',
        timestamp: Date.now()
      }
    });

    const updatedCart = { ...cart, status: 'checkout', currentIndex: nextIndex };
    await setStoredCart(platform, updatedCart);

    if (tabId) {
      await chrome.tabs.update(tabId, {
        url: PLATFORM_CART_URLS[platform] || PLATFORM_HOME_URLS[platform]
      });
    }
    return;
  }

  const updatedCart = { ...cart, currentIndex: nextIndex };
  await setStoredCart(platform, updatedCart);

  const nextItemUrl = updatedCart.items[nextIndex]?.productUrl;
  if (tabId && nextItemUrl) {
    await chrome.tabs.update(tabId, { url: nextItemUrl });
  }
}

chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG' });
    return true;
  }

  if (message.type === 'AUTO_ADD_CART') {
    try {
      const response = await startCartAutomation(message);
      sendResponse(response);
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }

  if (message.type === 'START_CART_AUTOMATION') {
    try {
      const payload = message.payload || {};
      const response = await startCartAutomation({
        platform: payload.platform,
        items: payload.items,
        sessionId: payload.sessionId || payload.cartId || `session_${Date.now()}`
      });
      sendResponse(response.success ? { status: 'started', ...response } : response);
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CART') {
    const { platform } = message;
    getStoredCart(platform).then((cart) => {
      sendResponse(cart);
    });
    return true;
  }

  if (message.type === 'CART_PROGRESS') {
    const { sessionId } = message;
    chrome.storage.local.set({
      [`progress_${sessionId}`]: { ...message, timestamp: Date.now() }
    });
    return true;
  }

  if (message.type === 'CART_ITEM_DONE') {
    advanceCart(message.platform, sender.tab?.id)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'CART_COMPLETE') {
    const { platform } = message;
    chrome.storage.session.remove(getCartStorageKey(platform));
    return true;
  }

  if (message.type === 'CART_FEES_EXTRACTED') {
    const { sessionId, fees, platform } = message;
    chrome.storage.local.get(`progress_${sessionId}`).then((result) => {
      const existing = result[`progress_${sessionId}`] || {};
      chrome.storage.local.set({
        [`progress_${sessionId}`]: { ...existing, platform, fees, timestamp: Date.now() }
      });
    });
    return true;
  }

  if (message.type === 'CART_ITEM_FAILED') {
    const { platform, itemIndex, itemName, error } = message;
    chrome.storage.local.get('failed_items').then((result) => {
      const existing = result.failed_items || [];
      existing.push({ platform, itemIndex, itemName, error, timestamp: Date.now() });
      chrome.storage.local.set({ failed_items: existing });
    });
    return true;
  }
});

chrome.alarms.create('cleanup', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanup') {
    const all = await chrome.storage.local.get(null);
    const now = Date.now();
    const toRemove = Object.keys(all).filter((k) => {
      const val = all[k];
      return val?.timestamp && now - val.timestamp > 30 * 60 * 1000;
    });
    if (toRemove.length) await chrome.storage.local.remove(toRemove);
  }
});
