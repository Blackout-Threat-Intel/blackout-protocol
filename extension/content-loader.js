/**
 * BLACKOUT Protocol - Content Script Loader
 *
 * This script runs at document_start (before any other scripts)
 * and injects the BLACKOUT bundle into the page context.
 *
 * We inject into the page context (not content script sandbox)
 * because we need to shim the actual window.fetch, XHR, and sendBeacon
 * that tracking scripts will use.
 */

(function() {
  'use strict';

  // Create script element pointing to our bundle
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('blackout.bundle.js');
  script.type = 'text/javascript';

  // Inject at the earliest possible moment
  const target = document.head || document.documentElement;

  script.onload = function() {
    // Bundle loaded, now initialize
    const initScript = document.createElement('script');
    initScript.textContent = `
      (function() {
        // Wait for Blackout global to be available
        function tryInit() {
          if (typeof Blackout !== 'undefined' && Blackout.initBlackout) {
            Blackout.initBlackout({
              debug: false // Set to true for console logging
            });
          } else {
            setTimeout(tryInit, 5);
          }
        }
        tryInit();
      })();
    `;
    target.appendChild(initScript);
    initScript.remove();

    // Clean up the loader script
    script.remove();
  };

  script.onerror = function() {
    console.error('[BLACKOUT] Failed to load bundle');
  };

  // Insert at the very beginning
  if (target.firstChild) {
    target.insertBefore(script, target.firstChild);
  } else {
    target.appendChild(script);
  }
})();
