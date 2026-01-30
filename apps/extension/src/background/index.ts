// Background service worker for Zeroe Pulse AI extension

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AUTH_TOKEN') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ token: result.authToken || null });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'SET_AUTH_TOKEN') {
    chrome.storage.local.set({ authToken: message.token }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'CLEAR_AUTH_TOKEN') {
    chrome.storage.local.remove(['authToken'], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'HUBSPOT_CONTEXT') {
    // Forward HubSpot context to side panel
    chrome.runtime.sendMessage({
      type: 'HUBSPOT_CONTEXT_UPDATE',
      context: message.context,
    });
    sendResponse({ received: true });
    return true;
  }

  if (message.type === 'OPEN_SIDE_PANEL') {
    // Open side panel from floating tab click
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.sidePanel.open({ tabId });
    }
    sendResponse({ success: true });
    return true;
  }
});

console.log('Zeroe Pulse AI background service worker initialized');
