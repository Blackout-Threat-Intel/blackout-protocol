/**
 * BLACKOUT GREYOUT MODE - Injector
 *
 * Content script that injects greyout-core.js into the page context
 * BEFORE any other scripts run. This ensures we wrap fetch/XHR
 * before RB2B's script loads.
 *
 * Runs at document_start for maximum coverage.
 */

(function() {
  'use strict';

  // Inject the core script into the page context
  // This is necessary because content scripts run in an isolated world
  // and can't intercept fetch/XHR from the page's scripts
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('greyout-core.js');
  script.onload = function() {
    this.remove();
  };

  // Inject as early as possible
  (document.head || document.documentElement).prepend(script);

  // Also listen for messages from the injected script
  window.addEventListener('greyout:loaded', (event) => {
    // Notify background script that Greyout is active on this page
    chrome.runtime.sendMessage({
      type: 'GREYOUT_ACTIVE',
      url: window.location.href,
      hostname: window.location.hostname,
      timestamp: Date.now(),
      config: event.detail
    }).catch(() => {
      // Extension context may be invalidated during updates
    });
  });

  // Listen for stats requests from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_STATS') {
      sendResponse({
        active: window.__GREYOUT_ACTIVE__ || false,
        stats: window.__GREYOUT_STATS__ || null,
        url: window.location.href
      });
    }
    return true;
  });

})();
