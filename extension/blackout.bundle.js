"use strict";
var Blackout = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    PolicyDecision: () => PolicyDecision,
    VERSION: () => VERSION,
    addPatterns: () => addPatterns,
    clearBlockLog: () => clearBlockLog2,
    disableBlackout: () => disableBlackout,
    getBlockLog: () => getBlockLog2,
    getPatterns: () => getPatterns,
    getStats: () => getStats,
    initBlackout: () => initBlackout,
    isActive: () => isActive2,
    wouldBlock: () => wouldBlock
  });

  // src/types.ts
  var PolicyDecision = /* @__PURE__ */ ((PolicyDecision2) => {
    PolicyDecision2["ALLOW"] = "ALLOW";
    PolicyDecision2["BLOCK_AND_MOCK"] = "BLOCK_AND_MOCK";
    return PolicyDecision2;
  })(PolicyDecision || {});

  // src/policy-engine.ts
  var KILL_LIST = [
    // RB2B Core Domains
    "rb2b.com",
    "*.rb2b.com",
    // Known RB2B subdomains (explicit for clarity)
    "api.rb2b.com",
    "cdn.rb2b.com",
    "track.rb2b.com",
    "t.rb2b.com",
    "pixel.rb2b.com",
    "events.rb2b.com",
    "data.rb2b.com",
    "collect.rb2b.com",
    "ingest.rb2b.com",
    // RB2B Alternative TLDs
    "rb2b.io",
    "*.rb2b.io",
    "rb2b.net",
    "*.rb2b.net",
    // RB2B CDN (CloudFront distribution)
    "ddwl4m2hdecbv.cloudfront.net"
  ];
  function matchesPattern(hostname, pattern) {
    const h = hostname.toLowerCase();
    const p = pattern.toLowerCase();
    if (p.startsWith("*.")) {
      const suffix = p.slice(1);
      return h.endsWith(suffix) || h === p.slice(2);
    }
    return h === p;
  }
  function extractHostname(url) {
    try {
      const parsed = new URL(url, "http://localhost");
      return parsed.hostname;
    } catch {
      return null;
    }
  }
  var PolicyEngineImpl = class {
    constructor() {
      this.debugMode = false;
      this.patterns = [...KILL_LIST];
    }
    /**
     * Enable/disable debug logging
     */
    setDebug(enabled) {
      this.debugMode = enabled;
    }
    /**
     * Add additional patterns to the kill list
     */
    addPatterns(patterns) {
      this.patterns.push(...patterns);
    }
    /**
     * Get current pattern count
     */
    getPatternCount() {
      return this.patterns.length;
    }
    /**
     * Get all current patterns
     */
    getPatterns() {
      return [...this.patterns];
    }
    /**
     * Evaluate a URL against the kill list
     * Returns BLOCK_AND_MOCK for all kill list matches, ALLOW otherwise
     */
    evaluate(url) {
      const hostname = extractHostname(url);
      const timestamp = Date.now();
      if (!hostname) {
        return {
          decision: "ALLOW" /* ALLOW */,
          url,
          hostname: "",
          timestamp
        };
      }
      for (const pattern of this.patterns) {
        if (matchesPattern(hostname, pattern)) {
          const result = {
            decision: "BLOCK_AND_MOCK" /* BLOCK_AND_MOCK */,
            url,
            hostname,
            matchedPattern: pattern,
            timestamp
          };
          if (this.debugMode) {
            console.log(`[BLACKOUT] BLOCKED: ${hostname} (matched: ${pattern})`);
          }
          return result;
        }
      }
      return {
        decision: "ALLOW" /* ALLOW */,
        url,
        hostname,
        timestamp
      };
    }
    /**
     * Quick check if URL should be blocked (without full result)
     */
    shouldBlock(url) {
      return this.evaluate(url).decision === "BLOCK_AND_MOCK" /* BLOCK_AND_MOCK */;
    }
  };
  var PolicyEngine = new PolicyEngineImpl();

  // src/mock-factory.ts
  var DEFAULT_BODY = {
    success: true,
    status: "ok",
    received: true
  };
  var DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "X-Powered-By": "BLACKOUT"
  };
  var MockFactoryImpl = class {
    constructor() {
      this.debugMode = false;
    }
    /**
     * Enable/disable debug logging
     */
    setDebug(enabled) {
      this.debugMode = enabled;
    }
    /**
     * Create a mock Response object for fetch API
     */
    createFetchResponse(config) {
      const body = JSON.stringify(config?.body ?? DEFAULT_BODY);
      const status = config?.status ?? 200;
      const statusText = config?.statusText ?? "OK";
      const headers = new Headers({
        ...DEFAULT_HEADERS,
        ...config?.headers ?? {}
      });
      if (this.debugMode) {
        console.log("[BLACKOUT] MockFactory: Created fetch Response", { status, body });
      }
      return new Response(body, {
        status,
        statusText,
        headers
      });
    }
    /**
     * Configure a mock XHR object to appear as a successful response.
     * This mutates the XHR in place and fires the necessary events.
     */
    configureMockXHR(xhr, config) {
      const body = JSON.stringify(config?.body ?? DEFAULT_BODY);
      const status = config?.status ?? 200;
      const statusText = config?.statusText ?? "OK";
      Object.defineProperty(xhr, "status", { value: status, writable: false });
      Object.defineProperty(xhr, "statusText", { value: statusText, writable: false });
      Object.defineProperty(xhr, "readyState", { value: 4, writable: false });
      Object.defineProperty(xhr, "response", { value: body, writable: false });
      Object.defineProperty(xhr, "responseText", { value: body, writable: false });
      Object.defineProperty(xhr, "responseType", { value: "", writable: false });
      const headerString = Object.entries({
        ...DEFAULT_HEADERS,
        ...config?.headers ?? {}
      }).map(([k, v]) => `${k}: ${v}`).join("\r\n");
      Object.defineProperty(xhr, "getAllResponseHeaders", {
        value: () => headerString,
        writable: false
      });
      Object.defineProperty(xhr, "getResponseHeader", {
        value: (name) => {
          const headers = { ...DEFAULT_HEADERS, ...config?.headers ?? {} };
          return headers[name] ?? null;
        },
        writable: false
      });
      if (this.debugMode) {
        console.log("[BLACKOUT] MockFactory: Configured mock XHR", { status, body });
      }
    }
    /**
     * Fire XHR events to simulate completion.
     * Call this after configureMockXHR to trigger callbacks.
     */
    fireXHREvents(xhr) {
      const readyStateEvent = new Event("readystatechange");
      xhr.dispatchEvent(readyStateEvent);
      const loadEvent = new ProgressEvent("load", {
        lengthComputable: true,
        loaded: 100,
        total: 100
      });
      xhr.dispatchEvent(loadEvent);
      const loadEndEvent = new ProgressEvent("loadend", {
        lengthComputable: true,
        loaded: 100,
        total: 100
      });
      xhr.dispatchEvent(loadEndEvent);
      if (typeof xhr.onload === "function") {
        xhr.onload(loadEvent);
      }
      if (typeof xhr.onreadystatechange === "function") {
        xhr.onreadystatechange(readyStateEvent);
      }
      if (typeof xhr.onloadend === "function") {
        xhr.onloadend(loadEndEvent);
      }
      if (this.debugMode) {
        console.log("[BLACKOUT] MockFactory: Fired XHR events");
      }
    }
    /**
     * Get the mock return value for sendBeacon
     * (sendBeacon returns boolean indicating if beacon was queued)
     */
    createBeaconResult() {
      if (this.debugMode) {
        console.log("[BLACKOUT] MockFactory: Returning true for beacon");
      }
      return true;
    }
    /**
     * Create appropriate mock response based on request type
     */
    createResponse(type, config) {
      switch (type) {
        case "fetch":
          return this.createFetchResponse(config);
        case "beacon":
          return this.createBeaconResult();
        default:
          return this.createFetchResponse(config);
      }
    }
  };
  var MockFactory = new MockFactoryImpl();

  // src/network-sniffer.ts
  var originalAPIs = null;
  var isActive = false;
  var debugMode = false;
  var onBlockCallback = null;
  var blockLog = [];
  function shimmedFetch(input, init) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const result = PolicyEngine.evaluate(url);
    if (result.decision === "BLOCK_AND_MOCK" /* BLOCK_AND_MOCK */) {
      blockLog.push({
        timestamp: result.timestamp,
        url: result.url,
        type: "fetch",
        matchedPattern: result.matchedPattern
      });
      if (onBlockCallback) {
        onBlockCallback(result);
      }
      if (debugMode) {
        console.log("[BLACKOUT] fetch BLOCKED:", url);
      }
      return Promise.resolve(MockFactory.createFetchResponse());
    }
    if (debugMode) {
      console.log("[BLACKOUT] fetch ALLOWED:", url);
    }
    return originalAPIs.fetch.call(window, input, init);
  }
  function shimmedXHROpen(method, url, async = true, username, password) {
    this._blackout_url = typeof url === "string" ? url : url.href;
    this._blackout_method = method;
    if (debugMode) {
      console.log("[BLACKOUT] XHR.open:", method, this._blackout_url);
    }
    return originalAPIs.xhrOpen.call(this, method, url, async, username, password);
  }
  function shimmedXHRSend(body) {
    const url = this._blackout_url || "";
    const result = PolicyEngine.evaluate(url);
    if (result.decision === "BLOCK_AND_MOCK" /* BLOCK_AND_MOCK */) {
      blockLog.push({
        timestamp: result.timestamp,
        url: result.url,
        type: "xhr",
        matchedPattern: result.matchedPattern
      });
      if (onBlockCallback) {
        onBlockCallback(result);
      }
      if (debugMode) {
        console.log("[BLACKOUT] XHR.send BLOCKED:", url);
      }
      MockFactory.configureMockXHR(this);
      setTimeout(() => {
        MockFactory.fireXHREvents(this);
      }, 10);
      return;
    }
    if (debugMode) {
      console.log("[BLACKOUT] XHR.send ALLOWED:", url);
    }
    return originalAPIs.xhrSend.call(this, body);
  }
  function shimmedSendBeacon(url, data) {
    const urlString = typeof url === "string" ? url : url.href;
    const result = PolicyEngine.evaluate(urlString);
    if (result.decision === "BLOCK_AND_MOCK" /* BLOCK_AND_MOCK */) {
      blockLog.push({
        timestamp: result.timestamp,
        url: result.url,
        type: "beacon",
        matchedPattern: result.matchedPattern
      });
      if (onBlockCallback) {
        onBlockCallback(result);
      }
      if (debugMode) {
        console.log("[BLACKOUT] sendBeacon BLOCKED:", urlString);
      }
      return MockFactory.createBeaconResult();
    }
    if (debugMode) {
      console.log("[BLACKOUT] sendBeacon ALLOWED:", urlString);
    }
    return originalAPIs.sendBeacon.call(navigator, url, data);
  }
  function install(options) {
    if (isActive) {
      console.warn("[BLACKOUT] NetworkSniffer already installed");
      return false;
    }
    if (typeof window === "undefined") {
      console.warn("[BLACKOUT] NetworkSniffer requires browser environment");
      return false;
    }
    debugMode = options?.debug ?? false;
    onBlockCallback = options?.onBlock ?? null;
    PolicyEngine.setDebug(debugMode);
    MockFactory.setDebug(debugMode);
    originalAPIs = {
      fetch: window.fetch.bind(window),
      xhrOpen: XMLHttpRequest.prototype.open,
      xhrSend: XMLHttpRequest.prototype.send,
      sendBeacon: navigator.sendBeacon.bind(navigator)
    };
    window.fetch = shimmedFetch;
    XMLHttpRequest.prototype.open = shimmedXHROpen;
    XMLHttpRequest.prototype.send = shimmedXHRSend;
    navigator.sendBeacon = shimmedSendBeacon;
    isActive = true;
    if (debugMode) {
      console.log("[BLACKOUT] NetworkSniffer installed");
      console.log("[BLACKOUT] Monitoring", PolicyEngine.getPatternCount(), "patterns");
    }
    return true;
  }
  function uninstall() {
    if (!isActive || !originalAPIs) {
      console.warn("[BLACKOUT] NetworkSniffer not installed");
      return false;
    }
    window.fetch = originalAPIs.fetch;
    XMLHttpRequest.prototype.open = originalAPIs.xhrOpen;
    XMLHttpRequest.prototype.send = originalAPIs.xhrSend;
    navigator.sendBeacon = originalAPIs.sendBeacon;
    originalAPIs = null;
    isActive = false;
    if (debugMode) {
      console.log("[BLACKOUT] NetworkSniffer uninstalled");
    }
    return true;
  }
  function isInstalled() {
    return isActive;
  }
  function getBlockLog() {
    return [...blockLog];
  }
  function clearBlockLog() {
    blockLog.length = 0;
  }
  function getBlockCount() {
    return blockLog.length;
  }

  // src/index.ts
  var VERSION = "1.0.0";
  var BLACKOUT_BANNER = `
%c\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557      \u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
%c\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2551 \u2588\u2588\u2554\u255D\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551   \u2588\u2588\u2551\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D
%c\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2554\u255D \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551
%c\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2588\u2588\u2557 \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551
%c\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2557\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D   \u2588\u2588\u2551
%c\u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D  \u255A\u2550\u2550\u2550\u2550\u2550\u255D    \u255A\u2550\u255D
%c                    THREAT NEUTRALIZED v${VERSION}
`;
  function printBanner() {
    console.log(
      BLACKOUT_BANNER,
      "color: #CCFF00",
      "color: #CCFF00",
      "color: #CCFF00",
      "color: #FF0099",
      "color: #FF0099",
      "color: #FF0099",
      "color: #FF6B00; font-weight: bold"
    );
  }
  function initBlackout(config) {
    if (config?.additionalPatterns?.length) {
      PolicyEngine.addPatterns(config.additionalPatterns);
    }
    const success = install({
      debug: config?.debug,
      onBlock: config?.onBlock
    });
    if (success) {
      printBanner();
      console.log(`%c[BLACKOUT] v${VERSION} initialized | ${PolicyEngine.getPatternCount()} patterns loaded`, "color: #CCFF00");
    }
    return success;
  }
  function disableBlackout() {
    return uninstall();
  }
  function isActive2() {
    return isInstalled();
  }
  function getStats() {
    return {
      active: isInstalled(),
      blockedCount: getBlockCount(),
      patterns: PolicyEngine.getPatternCount(),
      version: VERSION
    };
  }
  function getBlockLog2() {
    return getBlockLog();
  }
  function clearBlockLog2() {
    clearBlockLog();
  }
  function wouldBlock(url) {
    return PolicyEngine.shouldBlock(url);
  }
  function addPatterns(patterns) {
    PolicyEngine.addPatterns(patterns);
  }
  function getPatterns() {
    return PolicyEngine.getPatterns();
  }
  if (typeof document !== "undefined") {
    const script = document.currentScript;
    if (script?.hasAttribute("data-auto-init")) {
      const debug = script.hasAttribute("data-debug");
      initBlackout({ debug });
    }
  }
  return __toCommonJS(index_exports);
})();
/**
 * BLACKOUT Protocol - Type Definitions
 *
 * Core types for the network interception system.
 *
 * @license MIT
 * @see https://github.com/Blackout-Threat-Intel/blackout-protocol
 */
/**
 * BLACKOUT Protocol - PolicyEngine
 *
 * The Brain. Evaluates URLs against the KILL_LIST and decides
 * whether to ALLOW or BLOCK_AND_MOCK.
 *
 * @license MIT
 * @see https://github.com/Blackout-Threat-Intel/blackout-protocol
 */
/**
 * BLACKOUT Protocol - MockFactory
 *
 * The Lie. Generates convincing synthetic responses that won't
 * trigger error handlers in tracking scripts.
 *
 * @license MIT
 * @see https://github.com/Blackout-Threat-Intel/blackout-protocol
 */
/**
 * BLACKOUT Protocol - NetworkSniffer
 *
 * The Shim. Intercepts all outbound network requests by wrapping
 * browser APIs: fetch, XMLHttpRequest, and sendBeacon.
 *
 * All requests to surveillance domains are blocked and return
 * synthetic successful responses.
 *
 * @license MIT
 * @see https://github.com/Blackout-Threat-Intel/blackout-protocol
 */
/**
 * BLACKOUT Protocol
 *
 * Client-side network interception library for blocking surveillance trackers.
 * Shims fetch, XHR, and sendBeacon to intercept requests to known tracking domains
 * and return synthetic successful responses.
 *
 * @license MIT
 * @see https://github.com/Blackout-Threat-Intel/blackout-protocol
 *
 * @example
 * ```typescript
 * import { initBlackout, disableBlackout, getStats } from 'blackout-protocol'
 *
 * // Initialize blocking
 * initBlackout({ debug: true })
 *
 * // Check stats
 * console.log(getStats())
 * // { active: true, blockedCount: 42, patterns: 18, version: '1.0.0' }
 *
 * // Disable when done
 * disableBlackout()
 * ```
 */
