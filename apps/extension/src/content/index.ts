// Content script for HubSpot context detection

interface HubSpotContext {
  type: 'deal' | 'contact' | 'company' | null;
  hubspotId: string | null;
  name: string | null;
  portalId: string | null;
}

function detectHubSpotContext(): HubSpotContext {
  const url = window.location.href;
  const context: HubSpotContext = {
    type: null,
    hubspotId: null,
    name: null,
    portalId: null,
  };

  // Extract portal ID from URL
  // Format: https://app-eu1.hubspot.com/contacts/PORTAL_ID/record/0-3/DEAL_ID
  const portalMatch = url.match(/hubspot\.com\/contacts\/(\d+)/);
  if (portalMatch) {
    context.portalId = portalMatch[1];
  }

  // Detect deal pages (0-3 is the deal object type)
  // Format: /record/0-3/DEAL_ID or /deal/DEAL_ID
  const dealMatch = url.match(/\/record\/0-3\/(\d+)/) || url.match(/\/deal\/(\d+)/);
  if (dealMatch) {
    context.type = 'deal';
    context.hubspotId = dealMatch[1];
    // Try to get deal name from page
    const nameEl = document.querySelector('[data-selenium-test="record-title"]') ||
                   document.querySelector('h1[data-test-id="record-title"]') ||
                   document.querySelector('.private-header__heading') ||
                   document.querySelector('h1');
    context.name = nameEl?.textContent?.trim() || null;
  }

  // Detect contact pages (0-1 is the contact object type)
  // Format: /record/0-1/CONTACT_ID or /contact/CONTACT_ID
  const contactMatch = url.match(/\/record\/0-1\/(\d+)/) || url.match(/\/contact\/(\d+)/);
  if (contactMatch) {
    context.type = 'contact';
    context.hubspotId = contactMatch[1];
    const nameEl = document.querySelector('[data-selenium-test="record-title"]') ||
                   document.querySelector('h1[data-test-id="record-title"]') ||
                   document.querySelector('.private-header__heading') ||
                   document.querySelector('h1');
    context.name = nameEl?.textContent?.trim() || null;
  }

  // Detect company pages (0-2 is the company object type)
  // Format: /record/0-2/COMPANY_ID or /company/COMPANY_ID
  const companyMatch = url.match(/\/record\/0-2\/(\d+)/) || url.match(/\/company\/(\d+)/);
  if (companyMatch) {
    context.type = 'company';
    context.hubspotId = companyMatch[1];
    const nameEl = document.querySelector('[data-selenium-test="record-title"]') ||
                   document.querySelector('h1[data-test-id="record-title"]') ||
                   document.querySelector('.private-header__heading') ||
                   document.querySelector('h1');
    context.name = nameEl?.textContent?.trim() || null;
  }

  return context;
}

function sendContextToBackground() {
  const context = detectHubSpotContext();
  chrome.runtime.sendMessage({
    type: 'HUBSPOT_CONTEXT',
    context,
  }).catch(() => {
    // Extension might not be ready yet
  });
}

// Send context on load
setTimeout(sendContextToBackground, 1000);

// Watch for URL changes (HubSpot is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // Delay to allow page content to load
    setTimeout(sendContextToBackground, 1000);
  }
}).observe(document.body, { subtree: true, childList: true });

// Also try to detect name changes after initial load
setTimeout(() => {
  const context = detectHubSpotContext();
  if (context.type && !context.name) {
    // Retry after more time for name to load
    setTimeout(sendContextToBackground, 2000);
  }
}, 2000);

console.log('Zeroe Pulse AI content script initialized');
