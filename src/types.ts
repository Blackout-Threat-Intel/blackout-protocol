/**
 * BLACKOUT Protocol - Type Definitions
 *
 * Core types for the network interception system.
 *
 * @license MIT
 * @see https://github.com/Blackout-Threat-Intel/blackout-protocol
 */

// =============================================================================
// POLICY ENGINE TYPES
// =============================================================================

/**
 * Decision returned by the PolicyEngine
 */
export enum PolicyDecision {
  /** Allow the request to pass through unchanged */
  ALLOW = 'ALLOW',
  /** Block the request and return a mock response */
  BLOCK_AND_MOCK = 'BLOCK_AND_MOCK'
}

/**
 * Result of policy evaluation with metadata
 */
export interface PolicyResult {
  decision: PolicyDecision
  url: string
  hostname: string
  matchedPattern?: string
  timestamp: number
}

// =============================================================================
// MOCK FACTORY TYPES
// =============================================================================

/**
 * Type of request being mocked
 */
export type RequestType = 'fetch' | 'xhr' | 'beacon'

/**
 * Configuration for mock response generation
 */
export interface MockConfig {
  status?: number
  statusText?: string
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

// =============================================================================
// NETWORK SNIFFER TYPES
// =============================================================================

/**
 * Stored reference to original browser APIs
 */
export interface OriginalAPIs {
  fetch: typeof window.fetch
  xhrOpen: typeof XMLHttpRequest.prototype.open
  xhrSend: typeof XMLHttpRequest.prototype.send
  sendBeacon: typeof navigator.sendBeacon
}

/**
 * Extended XHR with our tracking properties
 */
export interface BlackoutXHR extends XMLHttpRequest {
  _blackout_url?: string
  _blackout_method?: string
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Blackout initialization config
 */
export interface BlackoutConfig {
  /** Enable debug logging to console */
  debug?: boolean
  /** Custom kill list patterns (appended to default) */
  additionalPatterns?: string[]
  /** Callback fired when a request is blocked */
  onBlock?: (result: PolicyResult) => void
}

// =============================================================================
// LOGGING
// =============================================================================

/**
 * Log entry for blocked requests
 */
export interface BlockLog {
  timestamp: number
  url: string
  type: RequestType
  matchedPattern: string
}
