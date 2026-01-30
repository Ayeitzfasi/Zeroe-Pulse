// Content script for HubSpot context detection

interface HubSpotContext {
  type: 'deal' | 'contact' | 'company' | null;
  hubspotId: string | null;
  name: string | null;
  portalId: string | null;
}

let lastContext: HubSpotContext | null = null;
let detectionInterval: ReturnType<typeof setInterval> | null = null;

function detectHubSpotContext(): HubSpotContext {
  const url = window.location.href;
  const context: HubSpotContext = {
    type: null,
    hubspotId: null,
    name: null,
    portalId: null,
  };

  // Extract portal ID from URL
  // Format: https://app.hubspot.com/contacts/PORTAL_ID/...
  // or: https://app-eu1.hubspot.com/contacts/PORTAL_ID/...
  const portalMatch = url.match(/hubspot\.com\/contacts\/(\d+)/);
  if (portalMatch) {
    context.portalId = portalMatch[1];
  }

  // Multiple URL patterns to detect record types
  // HubSpot uses different URL formats:
  // 1. /record/0-3/DEAL_ID (new format with object type ID)
  // 2. /deal/DEAL_ID (legacy format)
  // 3. /record/0-3/DEAL_ID/view/... (with view suffix)

  // Detect deal pages (0-3 is the deal object type)
  const dealPatterns = [
    /\/record\/0-3\/(\d+)/,
    /\/deal\/(\d+)/,
    /\/deals\/(\d+)/,
  ];

  for (const pattern of dealPatterns) {
    const match = url.match(pattern);
    if (match) {
      context.type = 'deal';
      context.hubspotId = match[1];
      break;
    }
  }

  // Detect contact pages (0-1 is the contact object type)
  if (!context.type) {
    const contactPatterns = [
      /\/record\/0-1\/(\d+)/,
      /\/contact\/(\d+)/,
      /\/contacts\/\d+\/contact\/(\d+)/,
    ];

    for (const pattern of contactPatterns) {
      const match = url.match(pattern);
      if (match) {
        context.type = 'contact';
        context.hubspotId = match[1];
        break;
      }
    }
  }

  // Detect company pages (0-2 is the company object type)
  if (!context.type) {
    const companyPatterns = [
      /\/record\/0-2\/(\d+)/,
      /\/company\/(\d+)/,
      /\/companies\/(\d+)/,
    ];

    for (const pattern of companyPatterns) {
      const match = url.match(pattern);
      if (match) {
        context.type = 'company';
        context.hubspotId = match[1];
        break;
      }
    }
  }

  // Try to get the record name from the page
  if (context.type) {
    context.name = getRecordName();
  }

  return context;
}

function getRecordName(): string | null {
  // Try multiple selectors that HubSpot uses for record titles
  const selectors = [
    '[data-selenium-test="record-title"]',
    'h1[data-test-id="record-title"]',
    '.private-header__heading',
    '[data-test-id="highlightTitle"]',
    '.private-page-header h1',
    // Deal board card title when in board view
    '.deal-card__title',
    // Contact name in header
    '.private-header__title span',
    // Generic h1 as last resort
    'main h1',
    'h1',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 200) {
        return text;
      }
    }
  }

  return null;
}

function contextChanged(a: HubSpotContext | null, b: HubSpotContext | null): boolean {
  if (!a && !b) return false;
  if (!a || !b) return true;
  return a.type !== b.type || a.hubspotId !== b.hubspotId;
}

function sendContextToBackground(force = false) {
  const context = detectHubSpotContext();

  // Only send if context changed or forced
  if (!force && !contextChanged(context, lastContext)) {
    // Even if context hasn't changed, update name if it was missing
    if (lastContext && !lastContext.name && context.name) {
      lastContext.name = context.name;
      chrome.runtime.sendMessage({
        type: 'HUBSPOT_CONTEXT',
        context,
      }).catch(() => {
        // Extension might not be ready yet
      });
    }
    return;
  }

  lastContext = context;

  chrome.runtime.sendMessage({
    type: 'HUBSPOT_CONTEXT',
    context,
  }).catch(() => {
    // Extension might not be ready yet
  });
}

// Listen for context requests from the sidepanel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'REQUEST_CONTEXT') {
    const context = detectHubSpotContext();
    lastContext = context;
    chrome.runtime.sendMessage({
      type: 'HUBSPOT_CONTEXT',
      context,
    }).catch(() => {});
    sendResponse({ received: true });
    return true;
  }
});

// Start periodic detection
function startPeriodicDetection() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
  }

  // Check every 2 seconds for context changes
  // This helps catch SPA navigation that doesn't trigger URL changes immediately
  detectionInterval = setInterval(() => {
    sendContextToBackground();
  }, 2000);
}

// Initial context detection with delay to allow page to load
setTimeout(() => {
  sendContextToBackground(true);
}, 500);

// Additional detection after more time for dynamic content
setTimeout(() => {
  sendContextToBackground();
}, 2000);

// Watch for URL changes (HubSpot is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // Send context immediately on URL change
    sendContextToBackground(true);
    // Then again after delay for content to load
    setTimeout(() => sendContextToBackground(), 1000);
    setTimeout(() => sendContextToBackground(), 2500);
  }
}).observe(document.body, { subtree: true, childList: true });

// Listen for history changes (popstate for back/forward navigation)
window.addEventListener('popstate', () => {
  sendContextToBackground(true);
  setTimeout(() => sendContextToBackground(), 1000);
});

// Listen for visibility changes (tab switching)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    sendContextToBackground(true);
  }
});

// Listen for focus (window/tab regaining focus)
window.addEventListener('focus', () => {
  sendContextToBackground(true);
});

// Start periodic detection
startPeriodicDetection();

console.log('Zeroe Pulse AI content script initialized');
