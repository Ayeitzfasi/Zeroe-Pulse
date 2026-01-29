// Content script for HubSpot context detection

interface HubSpotContext {
  type: 'deal' | 'contact' | 'company' | null;
  id: string | null;
  name: string | null;
}

function detectHubSpotContext(): HubSpotContext {
  const url = window.location.href;
  const context: HubSpotContext = {
    type: null,
    id: null,
    name: null,
  };

  // Detect deal pages
  const dealMatch = url.match(/\/deals\/(\d+)/);
  if (dealMatch) {
    context.type = 'deal';
    context.id = dealMatch[1];
    const nameEl = document.querySelector('[data-test-id="deal-name"]');
    context.name = nameEl?.textContent || null;
  }

  // Detect contact pages
  const contactMatch = url.match(/\/contacts\/(\d+)/);
  if (contactMatch) {
    context.type = 'contact';
    context.id = contactMatch[1];
    const nameEl = document.querySelector('[data-test-id="contact-name"]');
    context.name = nameEl?.textContent || null;
  }

  // Detect company pages
  const companyMatch = url.match(/\/companies\/(\d+)/);
  if (companyMatch) {
    context.type = 'company';
    context.id = companyMatch[1];
    const nameEl = document.querySelector('[data-test-id="company-name"]');
    context.name = nameEl?.textContent || null;
  }

  return context;
}

function sendContextToBackground() {
  const context = detectHubSpotContext();
  chrome.runtime.sendMessage({
    type: 'HUBSPOT_CONTEXT',
    context,
  });
}

// Send context on load
sendContextToBackground();

// Watch for URL changes (HubSpot is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // Delay to allow page content to load
    setTimeout(sendContextToBackground, 500);
  }
}).observe(document.body, { subtree: true, childList: true });

console.log('Zeroe Pulse AI content script initialized');
