/**
 * BLACKOUT GREYOUT MODE - Background Service Worker
 *
 * Tracks Greyout activity across all tabs and provides
 * aggregate statistics for the popup.
 */

// Track active Greyout instances
const activePages = new Map();

// Listen for Greyout activation messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GREYOUT_ACTIVE') {
    const tabId = sender.tab?.id;
    if (tabId) {
      activePages.set(tabId, {
        url: message.url,
        hostname: message.hostname,
        timestamp: message.timestamp,
        config: message.config
      });

      // Update badge
      chrome.action.setBadgeBackgroundColor({ color: '#00ff00' });
      chrome.action.setBadgeText({ text: 'ON', tabId });
    }
  }

  if (message.type === 'GET_GLOBAL_STATS') {
    sendResponse({
      activePages: activePages.size,
      pages: Array.from(activePages.entries()).map(([tabId, data]) => ({
        tabId,
        ...data
      }))
    });
  }

  return true;
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  activePages.delete(tabId);
});

// Clean up when tabs navigate away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    activePages.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

// Log startup
console.log('[GREYOUT] Background service worker started');
console.log('[GREYOUT] Monitoring for RB2B API calls...');
