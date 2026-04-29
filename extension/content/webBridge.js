window.postMessage(
  { source: 'cartiq-extension', type: 'CARTIQ_EXTENSION_READY' },
  window.location.origin
);

window.addEventListener('message', async (event) => {
  if (event.source !== window) return;

  const data = event.data;
  if (!data || data.source !== 'cartiq-webpage') return;

  const { type, requestId, payload } = data;

  const respond = (responsePayload) => {
    window.postMessage(
      {
        source: 'cartiq-extension',
        type: 'EXTENSION_RESPONSE',
        requestId,
        payload: responsePayload,
      },
      window.location.origin
    );
  };

  if (type === 'PING_EXTENSION') {
    respond({ success: true, status: 'PONG' });
    return;
  }

  if (type === 'GET_PROGRESS') {
    const sessionId = payload?.sessionId;
    if (!sessionId) {
      respond({ success: false, error: 'missing_session_id' });
      return;
    }

    const result = await chrome.storage.local.get(`progress_${sessionId}`);
    respond({ success: true, event: result[`progress_${sessionId}`] || null });
    return;
  }

  if (type === 'AUTO_ADD_CART') {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        respond({ success: false, error: chrome.runtime.lastError.message });
      } else {
        respond(response || { success: false });
      }
    });
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    for (let [key, { newValue }] of Object.entries(changes)) {
      if (key.startsWith('progress_') && newValue) {
        window.postMessage({
          source: 'cartiq-extension',
          type: 'CART_PROGRESS_UPDATE',
          payload: newValue
        }, window.location.origin);
      }
    }
  }
});
