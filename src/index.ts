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

import * as NetworkSniffer from './network-sniffer'
import { PolicyEngine } from './policy-engine'
import type { BlackoutConfig, PolicyResult, BlockLog } from './types'

// =============================================================================
// VERSION & BANNER
// =============================================================================

export const VERSION = '1.0.0'

const BLACKOUT_BANNER = `
%c██████╗ ██╗      █████╗  ██████╗██╗  ██╗ ██████╗ ██╗   ██╗████████╗
%c██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝██╔═══██╗██║   ██║╚══██╔══╝
%c██████╔╝██║     ███████║██║     █████╔╝ ██║   ██║██║   ██║   ██║
%c██╔══██╗██║     ██╔══██║██║     ██╔═██╗ ██║   ██║██║   ██║   ██║
%c██████╔╝███████╗██║  ██║╚██████╗██║  ██╗╚██████╔╝╚██████╔╝   ██║
%c╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝
%c                    THREAT NEUTRALIZED v${VERSION}
`

function printBanner(): void {
  console.log(
    BLACKOUT_BANNER,
    'color: #CCFF00',
    'color: #CCFF00',
    'color: #CCFF00',
    'color: #FF0099',
    'color: #FF0099',
    'color: #FF0099',
    'color: #FF6B00; font-weight: bold'
  )
}

// =============================================================================
// MAIN API
// =============================================================================

/**
 * Initialize BLACKOUT and start intercepting network requests.
 *
 * @param config - Optional configuration
 * @param config.debug - Enable console logging of blocked/allowed requests
 * @param config.additionalPatterns - Extra domain patterns to block
 * @param config.onBlock - Callback fired when a request is blocked
 * @returns true if successfully initialized, false if already active
 */
export function initBlackout(config?: BlackoutConfig): boolean {
  // Add any additional patterns
  if (config?.additionalPatterns?.length) {
    PolicyEngine.addPatterns(config.additionalPatterns)
  }

  // Install network shims
  const success = NetworkSniffer.install({
    debug: config?.debug,
    onBlock: config?.onBlock
  })

  if (success) {
    printBanner()
    console.log(`%c[BLACKOUT] v${VERSION} initialized | ${PolicyEngine.getPatternCount()} patterns loaded`, 'color: #CCFF00')
  }

  return success
}

/**
 * Disable BLACKOUT and restore original browser APIs.
 *
 * @returns true if successfully disabled, false if wasn't active
 */
export function disableBlackout(): boolean {
  return NetworkSniffer.uninstall()
}

/**
 * Check if BLACKOUT is currently active.
 */
export function isActive(): boolean {
  return NetworkSniffer.isInstalled()
}

/**
 * Get statistics about blocked requests.
 */
export function getStats(): {
  active: boolean
  blockedCount: number
  patterns: number
  version: string
} {
  return {
    active: NetworkSniffer.isInstalled(),
    blockedCount: NetworkSniffer.getBlockCount(),
    patterns: PolicyEngine.getPatternCount(),
    version: VERSION
  }
}

/**
 * Get the full log of blocked requests.
 */
export function getBlockLog(): BlockLog[] {
  return NetworkSniffer.getBlockLog()
}

/**
 * Clear the block log.
 */
export function clearBlockLog(): void {
  NetworkSniffer.clearBlockLog()
}

/**
 * Test if a URL would be blocked (without making a request).
 */
export function wouldBlock(url: string): boolean {
  return PolicyEngine.shouldBlock(url)
}

/**
 * Add additional patterns to the kill list at runtime.
 * Useful for extending protection dynamically.
 */
export function addPatterns(patterns: string[]): void {
  PolicyEngine.addPatterns(patterns)
}

/**
 * Get all current patterns in the kill list.
 */
export function getPatterns(): string[] {
  return PolicyEngine.getPatterns()
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Export types for TypeScript users
export type {
  BlackoutConfig,
  PolicyResult,
  BlockLog
} from './types'

export { PolicyDecision } from './types'

// =============================================================================
// AUTO-INIT (OPTIONAL)
// =============================================================================

/**
 * For script tag usage, check for auto-init data attribute:
 * <script src="blackout.js" data-auto-init></script>
 * <script src="blackout.js" data-auto-init data-debug></script>
 */
if (typeof document !== 'undefined') {
  const script = document.currentScript as HTMLScriptElement | null
  if (script?.hasAttribute('data-auto-init')) {
    const debug = script.hasAttribute('data-debug')
    initBlackout({ debug })
  }
}
