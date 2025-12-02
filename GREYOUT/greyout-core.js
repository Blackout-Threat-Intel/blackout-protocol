/**
 * BLACKOUT GREYOUT MODE - Core Interceptor
 *
 * Wraps fetch() and XMLHttpRequest to intercept RB2B API calls
 * and strip monetizable fields while preserving identification.
 *
 * KEEP: Fields required for visitor identification
 * NUKE: Fields RB2B monetizes (intent, attribution, cross-site tracking)
 *
 * Result: GTM gets the lead. Vendor gets noise.
 */

(function() {
  'use strict';

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  const CONFIG = {
    // Set to true for console logging
    debug: true,

    // Domains to intercept
    targetDomains: [
      'execute-api.us-west-2.amazonaws.com',
      'execute-api.us-east-1.amazonaws.com',
      'api.rb2b.com',
    ],

    // Path patterns that indicate RB2B API calls
    targetPaths: [
      '/b2b',
      '/identify',
      '/company',
      '/event',
      '/collect',
    ],

    // Fields to KEEP (required for identification to work)
    keepFields: [
      'account',
      'rb2b_md5',
      'li_md5',
      'guid',
      'session_id',
      'sessionId',
      'visitorId',
      'visitor_id',
      'companyCollection',
      'label',
    ],

    // Fields to NUKE (monetizable data)
    nukeFields: [
      'url',
      'title',
      'last_referrer',
      'lastReferrer',
      'referrer',
      'fbp',           // Facebook browser pixel
      'fbc',           // Facebook click ID
      'hs_hubspotutk', // HubSpot user token
      'hubspotutk',
      '_ga',           // Google Analytics
      '_gid',
      'gclid',         // Google Click ID
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'pageUrl',
      'pagePath',
      'pageTitle',
      'documentTitle',
    ],

    // Geo fields - keep country only
    geoKeepFields: ['country', 'countryCode', 'country_code'],
  };

  // ==========================================================================
  // LOGGING
  // ==========================================================================

  const log = (...args) => {
    if (CONFIG.debug) {
      console.log('%c[GREYOUT]', 'color: #00ff00; font-weight: bold;', ...args);
    }
  };

  const logStripped = (field, value) => {
    if (CONFIG.debug) {
      const preview = typeof value === 'string' ? value.slice(0, 50) : JSON.stringify(value).slice(0, 50);
      console.log('%c[GREYOUT] STRIPPED:', 'color: #ff6b6b; font-weight: bold;', field, '→', preview + '...');
    }
  };

  // ==========================================================================
  // URL MATCHING
  // ==========================================================================

  function isRB2BRequest(url) {
    try {
      const parsed = new URL(url);

      // Check domain
      const domainMatch = CONFIG.targetDomains.some(domain =>
        parsed.hostname.includes(domain)
      );

      if (!domainMatch) return false;

      // Check path
      const pathMatch = CONFIG.targetPaths.some(path =>
        parsed.pathname.includes(path)
      );

      return pathMatch;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // PAYLOAD SANITIZATION
  // ==========================================================================

  function sanitizePayload(payload) {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const sanitized = {};
    let strippedCount = 0;

    for (const [key, value] of Object.entries(payload)) {
      const keyLower = key.toLowerCase();

      // Always keep whitelisted fields
      if (CONFIG.keepFields.some(k => keyLower === k.toLowerCase())) {
        sanitized[key] = value;
        continue;
      }

      // Strip blacklisted fields
      if (CONFIG.nukeFields.some(k => keyLower === k.toLowerCase())) {
        logStripped(key, value);
        strippedCount++;
        continue;
      }

      // Handle geo object - keep country only
      if (keyLower === 'geo' && typeof value === 'object') {
        const sanitizedGeo = {};
        for (const [geoKey, geoValue] of Object.entries(value)) {
          if (CONFIG.geoKeepFields.some(k => geoKey.toLowerCase() === k.toLowerCase())) {
            sanitizedGeo[geoKey] = geoValue;
          } else {
            logStripped(`geo.${geoKey}`, geoValue);
            strippedCount++;
          }
        }
        if (Object.keys(sanitizedGeo).length > 0) {
          sanitized[key] = sanitizedGeo;
        }
        continue;
      }

      // Handle nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizePayload(value);
        continue;
      }

      // Default: keep unrecognized fields (conservative approach)
      sanitized[key] = value;
    }

    if (strippedCount > 0) {
      log(`Sanitized payload: stripped ${strippedCount} monetizable fields`);
    }

    return sanitized;
  }

  function sanitizeBody(body) {
    if (!body) return body;

    try {
      // Handle string body (JSON)
      if (typeof body === 'string') {
        const parsed = JSON.parse(body);
        const sanitized = sanitizePayload(parsed);
        return JSON.stringify(sanitized);
      }

      // Handle object body
      if (typeof body === 'object') {
        return sanitizePayload(body);
      }

      return body;
    } catch (e) {
      // Not JSON, return as-is
      return body;
    }
  }

  // ==========================================================================
  // FETCH WRAPPER
  // ==========================================================================

  const originalFetch = window.fetch;

  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;

    if (isRB2BRequest(url)) {
      log('Intercepted fetch to:', url);

      // Clone and sanitize the request body
      if (init.body) {
        init = { ...init };
        init.body = sanitizeBody(init.body);
        log('Request body sanitized');
      }

      // Also sanitize Request objects
      if (input instanceof Request && input.body) {
        const bodyText = await input.clone().text();
        const sanitizedBody = sanitizeBody(bodyText);

        input = new Request(input.url, {
          method: input.method,
          headers: input.headers,
          body: sanitizedBody,
          mode: input.mode,
          credentials: input.credentials,
          cache: input.cache,
          redirect: input.redirect,
          referrer: input.referrer,
          integrity: input.integrity,
        });
      }
    }

    return originalFetch.call(window, input, init);
  };

  // ==========================================================================
  // XMLHttpRequest WRAPPER
  // ==========================================================================

  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._greyoutUrl = url;
    this._greyoutMethod = method;
    return originalXHROpen.call(this, method, url, ...args);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (this._greyoutUrl && isRB2BRequest(this._greyoutUrl)) {
      log('Intercepted XHR to:', this._greyoutUrl);

      if (body) {
        body = sanitizeBody(body);
        log('XHR body sanitized');
      }
    }

    return originalXHRSend.call(this, body);
  };

  // ==========================================================================
  // SENDBEACON WRAPPER
  // ==========================================================================

  const originalSendBeacon = navigator.sendBeacon;

  if (originalSendBeacon) {
    navigator.sendBeacon = function(url, data) {
      if (isRB2BRequest(url)) {
        log('Intercepted sendBeacon to:', url);

        if (data) {
          // Handle Blob
          if (data instanceof Blob) {
            // Can't easily modify Blob, log warning
            log('Warning: Blob data in sendBeacon, cannot sanitize');
          } else {
            data = sanitizeBody(data);
            log('Beacon data sanitized');
          }
        }
      }

      return originalSendBeacon.call(navigator, url, data);
    };
  }

  // ==========================================================================
  // STATS TRACKING
  // ==========================================================================

  window.__GREYOUT_STATS__ = {
    interceptedRequests: 0,
    strippedFields: 0,
    startTime: Date.now(),
  };

  // Patch sanitizePayload to track stats
  const originalSanitize = sanitizePayload;
  // (Already tracked in the function via strippedCount logging)

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  log('GREYOUT MODE ACTIVE');
  log('Monitoring domains:', CONFIG.targetDomains);
  log('KEEP fields:', CONFIG.keepFields);
  log('NUKE fields:', CONFIG.nukeFields);
  log('─────────────────────────────────────');
  log('GTM gets the lead. Vendor gets noise.');
  log('─────────────────────────────────────');

  // Signal that Greyout is loaded
  window.__GREYOUT_ACTIVE__ = true;

  // Dispatch event for other scripts to detect
  window.dispatchEvent(new CustomEvent('greyout:loaded', {
    detail: { version: '1.0.0', config: CONFIG }
  }));

})();
