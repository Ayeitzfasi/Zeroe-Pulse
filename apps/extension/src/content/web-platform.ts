// Content script for the Zeroe Pulse AI web platform
// Syncs auth token from web app to extension

function syncAuthToken() {
  const token = localStorage.getItem('auth_token');
  if (token) {
    chrome.runtime.sendMessage({ type: 'SET_AUTH_TOKEN', token }, (response) => {
      if (response?.success) {
        // Notify the side panel that auth has been updated
        chrome.runtime.sendMessage({ type: 'AUTH_TOKEN_UPDATED', token });
        console.log('Auth token synced to extension');
      }
    });
  }
}

// Listen for messages from the web app
window.addEventListener('message', (event) => {
  // Only accept messages from our web app
  if (event.origin !== window.location.origin) return;

  if (event.data?.type === 'ZEROE_SYNC_TO_EXTENSION') {
    syncAuthToken();
  }
});

// Also sync on page load if token exists
syncAuthToken();

console.log('Zeroe Pulse AI web platform content script loaded');
