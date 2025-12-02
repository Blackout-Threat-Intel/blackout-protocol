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

import { OriginalAPIs, BlackoutXHR, PolicyResult, BlockLog } from './types'
import { PolicyEngine, PolicyDecision } from './policy-engine'
import { MockFactory } from './mock-factory'

// =============================================================================
// STATE
// =============================================================================

/** Stored references to original browser APIs */
let originalAPIs: OriginalAPIs | null = null

/** Whether the sniffer is currently active */
let isActive = false

/** Debug mode flag */
let debugMode = false

/** Callback for blocked requests */
let onBlockCallback: ((result: PolicyResult) => void) | null = null

/** Log of blocked requests */
const blockLog: BlockLog[] = []

// =============================================================================
// SHIM IMPLEMENTATIONS
// =============================================================================

/**
 * Shimmed fetch that checks policy before executing
 */
function shimmedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Extract URL from input
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url

  // Evaluate against policy
  const result = PolicyEngine.evaluate(url)

  // BLOCK_AND_MOCK: Return fake success
  if (result.decision === PolicyDecision.BLOCK_AND_MOCK) {
    // Log the block
    blockLog.push({
      timestamp: result.timestamp,
      url: result.url,
      type: 'fetch',
      matchedPattern: result.matchedPattern!
    })

    // Fire callback if registered
    if (onBlockCallback) {
      onBlockCallback(result)
    }

    if (debugMode) {
      console.log('[BLACKOUT] fetch BLOCKED:', url)
    }

    // Return mock response wrapped in Promise
    return Promise.resolve(MockFactory.createFetchResponse())
  }

  // ALLOW: pass through to original fetch
  if (debugMode) {
    console.log('[BLACKOUT] fetch ALLOWED:', url)
  }
  return originalAPIs!.fetch.call(window, input, init)
}

/**
 * Shimmed XHR.open that stores the URL for later checking
 */
function shimmedXHROpen(
  this: BlackoutXHR,
  method: string,
  url: string | URL,
  async: boolean = true,
  username?: string | null,
  password?: string | null
): void {
  // Store URL and method on the XHR instance for checking in send()
  this._blackout_url = typeof url === 'string' ? url : url.href
  this._blackout_method = method

  if (debugMode) {
    console.log('[BLACKOUT] XHR.open:', method, this._blackout_url)
  }

  // Call original open (always, even for blocked requests - we block in send)
  return originalAPIs!.xhrOpen.call(this, method, url, async, username, password)
}

/**
 * Shimmed XHR.send that checks policy before executing
 */
function shimmedXHRSend(
  this: BlackoutXHR,
  body?: Document | XMLHttpRequestBodyInit | null
): void {
  const url = this._blackout_url || ''

  // Evaluate against policy
  const result = PolicyEngine.evaluate(url)

  // BLOCK_AND_MOCK: Simulate success
  if (result.decision === PolicyDecision.BLOCK_AND_MOCK) {
    // Log the block
    blockLog.push({
      timestamp: result.timestamp,
      url: result.url,
      type: 'xhr',
      matchedPattern: result.matchedPattern!
    })

    // Fire callback if registered
    if (onBlockCallback) {
      onBlockCallback(result)
    }

    if (debugMode) {
      console.log('[BLACKOUT] XHR.send BLOCKED:', url)
    }

    // Configure mock response on the XHR object
    MockFactory.configureMockXHR(this)

    // Fire events asynchronously to simulate network delay
    setTimeout(() => {
      MockFactory.fireXHREvents(this)
    }, 10)

    return
  }

  // ALLOW: pass through to original send
  if (debugMode) {
    console.log('[BLACKOUT] XHR.send ALLOWED:', url)
  }
  return originalAPIs!.xhrSend.call(this, body)
}

/**
 * Shimmed sendBeacon that checks policy before executing
 */
function shimmedSendBeacon(
  url: string | URL,
  data?: BodyInit | null
): boolean {
  const urlString = typeof url === 'string' ? url : url.href

  // Evaluate against policy
  const result = PolicyEngine.evaluate(urlString)

  // BLOCK_AND_MOCK: Return fake success
  if (result.decision === PolicyDecision.BLOCK_AND_MOCK) {
    // Log the block
    blockLog.push({
      timestamp: result.timestamp,
      url: result.url,
      type: 'beacon',
      matchedPattern: result.matchedPattern!
    })

    // Fire callback if registered
    if (onBlockCallback) {
      onBlockCallback(result)
    }

    if (debugMode) {
      console.log('[BLACKOUT] sendBeacon BLOCKED:', urlString)
    }

    // Return true to indicate "success" to the calling code
    return MockFactory.createBeaconResult()
  }

  // ALLOW: pass through to original sendBeacon
  if (debugMode) {
    console.log('[BLACKOUT] sendBeacon ALLOWED:', urlString)
  }
  return originalAPIs!.sendBeacon.call(navigator, url, data)
}

// =============================================================================
// PUBLIC API
// =============================================================================

interface InstallOptions {
  debug?: boolean
  onBlock?: (result: PolicyResult) => void
}

/**
 * Install network shims. Stores original APIs and replaces with our versions.
 */
export function install(options?: InstallOptions): boolean {
  if (isActive) {
    console.warn('[BLACKOUT] NetworkSniffer already installed')
    return false
  }

  if (typeof window === 'undefined') {
    console.warn('[BLACKOUT] NetworkSniffer requires browser environment')
    return false
  }

  // Store options
  debugMode = options?.debug ?? false
  onBlockCallback = options?.onBlock ?? null

  // Sync debug mode to other modules
  PolicyEngine.setDebug(debugMode)
  MockFactory.setDebug(debugMode)

  // Store original APIs
  originalAPIs = {
    fetch: window.fetch.bind(window),
    xhrOpen: XMLHttpRequest.prototype.open,
    xhrSend: XMLHttpRequest.prototype.send,
    sendBeacon: navigator.sendBeacon.bind(navigator)
  }

  // Install shims
  window.fetch = shimmedFetch
  XMLHttpRequest.prototype.open = shimmedXHROpen as typeof XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.send = shimmedXHRSend
  navigator.sendBeacon = shimmedSendBeacon

  isActive = true

  if (debugMode) {
    console.log('[BLACKOUT] NetworkSniffer installed')
    console.log('[BLACKOUT] Monitoring', PolicyEngine.getPatternCount(), 'patterns')
  }

  return true
}

/**
 * Uninstall network shims. Restores original APIs.
 */
export function uninstall(): boolean {
  if (!isActive || !originalAPIs) {
    console.warn('[BLACKOUT] NetworkSniffer not installed')
    return false
  }

  // Restore original APIs
  window.fetch = originalAPIs.fetch
  XMLHttpRequest.prototype.open = originalAPIs.xhrOpen
  XMLHttpRequest.prototype.send = originalAPIs.xhrSend
  navigator.sendBeacon = originalAPIs.sendBeacon

  originalAPIs = null
  isActive = false

  if (debugMode) {
    console.log('[BLACKOUT] NetworkSniffer uninstalled')
  }

  return true
}

/**
 * Check if sniffer is currently active
 */
export function isInstalled(): boolean {
  return isActive
}

/**
 * Get the block log
 */
export function getBlockLog(): BlockLog[] {
  return [...blockLog]
}

/**
 * Clear the block log
 */
export function clearBlockLog(): void {
  blockLog.length = 0
}

/**
 * Get count of blocked requests
 */
export function getBlockCount(): number {
  return blockLog.length
}
