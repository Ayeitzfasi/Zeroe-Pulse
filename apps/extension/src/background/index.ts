// Background service worker for Zeroe Pulse AI extension

interface HubSpotContext {
  type: 'deal' | 'contact' | 'company' | null;
  hubspotId: string | null;
  name: string | null;
  portalId: string | null;
}

// Store current context per tab
const tabContexts: Map<number, HubSpotContext> = new Map();

// Track side panel open state per tab
const sidePanelOpen: Map<number, boolean> = new Map();

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Helper to broadcast context update
function broadcastContextUpdate(context: HubSpotContext, tabId?: number) {
  // Store in storage for persistence
  chrome.storage.local.set({
    currentContext: context,
    contextTabId: tabId,
    contextUpdatedAt: Date.now()
  });

  // Also broadcast via runtime message
  chrome.runtime.sendMessage({
    type: 'HUBSPOT_CONTEXT_UPDATE',
    context,
    tabId,
  }).catch(() => {
    // Side panel might not be open
  });
}

// Request context from content script
function requestContextFromTab(tabId: number) {
  chrome.tabs.sendMessage(tabId, { type: 'REQUEST_CONTEXT' }).catch(() => {
    // Content script might not be ready
  });
}

// Listen for tab URL changes (catches SPA navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only care about HubSpot tabs
  if (tab.url && (tab.url.includes('app.hubspot.com') || tab.url.includes('app-eu1.hubspot.com'))) {
    // Request context when URL changes or page loads
    if (changeInfo.url || changeInfo.status === 'complete') {
      setTimeout(() => requestContextFromTab(tabId), 500);
      setTimeout(() => requestContextFromTab(tabId), 1500);
    }
  }
});

// Listen for tab activation (user switches tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && (tab.url.includes('app.hubspot.com') || tab.url.includes('app-eu1.hubspot.com'))) {
      requestContextFromTab(activeInfo.tabId);
    } else {
      // Not a HubSpot tab, clear context
      broadcastContextUpdate({
        type: null,
        hubspotId: null,
        name: null,
        portalId: null,
      }, activeInfo.tabId);
    }
  });
});

// Listen for messages from content scripts and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AUTH_TOKEN') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ token: result.authToken || null });
    });
    return true;
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
    const tabId = sender.tab?.id;
    const context = message.context as HubSpotContext;

    // Store context for this tab
    if (tabId) {
      tabContexts.set(tabId, context);
    }

    // Broadcast to side panel
    broadcastContextUpdate(context, tabId);
    sendResponse({ received: true });
    return true;
  }

  if (message.type === 'GET_CURRENT_CONTEXT') {
    // Side panel requesting current context
    chrome.storage.local.get(['currentContext', 'contextTabId', 'contextUpdatedAt'], (result) => {
      sendResponse({
        context: result.currentContext || null,
        tabId: result.contextTabId,
        updatedAt: result.contextUpdatedAt,
      });
    });
    return true;
  }

  if (message.type === 'OPEN_SIDE_PANEL' || message.type === 'TOGGLE_SIDE_PANEL') {
    const tabId = sender.tab?.id;
    if (tabId) {
      const isOpen = sidePanelOpen.get(tabId) || false;

      if (message.type === 'TOGGLE_SIDE_PANEL' && isOpen) {
        // Close the side panel
        // Note: chrome.sidePanel.close() requires Chrome 116+
        const sidePanelApi = chrome.sidePanel as typeof chrome.sidePanel & {
          close?: (options: { tabId: number }) => Promise<void>;
        };

        if (sidePanelApi.close) {
          sidePanelApi.close({ tabId }).then(() => {
            sidePanelOpen.set(tabId, false);
          }).catch(() => {
            // Fallback: just update state
            sidePanelOpen.set(tabId, false);
          });
        } else {
          // For older Chrome versions, we can't programmatically close
          // Just update our state tracking
          sidePanelOpen.set(tabId, false);
        }
      } else {
        // Open the side panel
        chrome.sidePanel.open({ tabId }).then(() => {
          sidePanelOpen.set(tabId, true);
        }).catch(() => {});
      }
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'SIDE_PANEL_CLOSED') {
    // Side panel notifies us when it's being closed
    const tabId = message.tabId;
    if (tabId) {
      sidePanelOpen.set(tabId, false);
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'SIDE_PANEL_OPENED') {
    // Side panel notifies us when it's opened
    const tabId = message.tabId;
    if (tabId) {
      sidePanelOpen.set(tabId, true);
    }
    sendResponse({ success: true });
    return true;
  }
});

console.log('Zeroe Pulse AI background service worker initialized');
