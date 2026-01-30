// Floating tab that appears on HubSpot pages
// Clicking it opens the side panel

const FLOATING_TAB_ID = 'zeroe-pulse-ai-floating-tab';

function createFloatingTab() {
  // Remove existing tab if any
  const existing = document.getElementById(FLOATING_TAB_ID);
  if (existing) {
    existing.remove();
  }

  // Create the floating tab container
  const container = document.createElement('div');
  container.id = FLOATING_TAB_ID;
  container.innerHTML = `
    <style>
      #${FLOATING_TAB_ID} {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 999999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .zeroe-floating-tab {
        display: flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #2673EA 0%, #1a5fd4 100%);
        color: white;
        padding: 10px 14px 10px 12px;
        border-radius: 8px 0 0 8px;
        cursor: pointer;
        box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        transform: translateX(calc(100% - 40px));
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .zeroe-floating-tab:hover {
        transform: translateX(0);
        box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.2);
      }

      .zeroe-floating-tab-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        transform: rotate(90deg);
      }

      .zeroe-floating-tab-text {
        white-space: nowrap;
        transform: rotate(180deg);
      }

      /* Expanded state */
      .zeroe-floating-tab.expanded {
        transform: translateX(0);
        writing-mode: horizontal-tb;
        padding: 10px 16px;
        border-radius: 8px 0 0 8px;
      }

      .zeroe-floating-tab.expanded .zeroe-floating-tab-icon {
        transform: none;
      }

      .zeroe-floating-tab.expanded .zeroe-floating-tab-text {
        transform: none;
      }
    </style>

    <div class="zeroe-floating-tab" id="zeroe-pulse-tab-button">
      <svg class="zeroe-floating-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <path d="M12 7v.01"/>
        <path d="M8 11h8"/>
        <path d="M8 15h4"/>
      </svg>
      <span class="zeroe-floating-tab-text">Pulse AI</span>
    </div>
  `;

  document.body.appendChild(container);

  // Add click handler
  const tabButton = document.getElementById('zeroe-pulse-tab-button');
  if (tabButton) {
    tabButton.addEventListener('click', () => {
      // Send message to background to open side panel
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createFloatingTab);
} else {
  createFloatingTab();
}

// Re-create if removed (some SPAs aggressively clean the DOM)
const observer = new MutationObserver(() => {
  if (!document.getElementById(FLOATING_TAB_ID)) {
    createFloatingTab();
  }
});

observer.observe(document.body, { childList: true });

console.log('Zeroe Pulse AI floating tab initialized');
