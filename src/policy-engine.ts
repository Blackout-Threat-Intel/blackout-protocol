/**
 * BLACKOUT Protocol - PolicyEngine
 *
 * The Brain. Evaluates URLs against the KILL_LIST and decides
 * whether to ALLOW or BLOCK_AND_MOCK.
 *
 * @license MIT
 * @see https://github.com/Blackout-Threat-Intel/blackout-protocol
 */

import { PolicyDecision, PolicyResult } from './types'

// =============================================================================
// KILL LIST - HARDCODED SURVEILLANCE DOMAINS
// =============================================================================

/**
 * Kill list targeting surveillance infrastructure.
 * Patterns support:
 * - Exact domain match: 'rb2b.com'
 * - Wildcard subdomain: '*.rb2b.com' (matches any.rb2b.com)
 *
 * Sources:
 * - BTI-2025-0023: 6sense surveillance stack
 * - BTI-2025-0025: TrenDemon eval() ACE + polyfill.io supply chain
 */
const KILL_LIST: string[] = [
  // ==========================================================================
  // RB2B (Retention.com) - Visitor Deanonymization
  // ==========================================================================
  'rb2b.com',
  '*.rb2b.com',
  'api.rb2b.com',
  'cdn.rb2b.com',
  'track.rb2b.com',
  't.rb2b.com',
  'pixel.rb2b.com',
  'events.rb2b.com',
  'data.rb2b.com',
  'collect.rb2b.com',
  'ingest.rb2b.com',
  'rb2b.io',
  '*.rb2b.io',
  'rb2b.net',
  '*.rb2b.net',
  'ddwl4m2hdecbv.cloudfront.net',

  // ==========================================================================
  // TrenDemon (BTI-2025-0025) - eval() ACE + polyfill.io supply chain
  // ==========================================================================
  'trendemon.com',
  '*.trendemon.com',
  'trackingapi.trendemon.com',
  'assets.trendemon.com',

  // ==========================================================================
  // 6sense (BTI-2025-0023) - PII Deanonymization + Cookie Harvesting
  // ==========================================================================
  '6sc.co',
  '*.6sc.co',
  'eps.6sc.co',
  'b.6sc.co',
  'j.6sc.co',
  'v.eps.6sc.co',
  'epsilon.6sense.com',

  // ==========================================================================
  // Supply Chain Compromise - polyfill.io (Funnull CDN)
  // Compromised June 2024, injected malware into 100K+ sites
  // ==========================================================================
  'polyfill.io',
  '*.polyfill.io',
]

// =============================================================================
// PATTERN MATCHING
// =============================================================================

/**
 * Check if a hostname matches a kill list pattern.
 * Supports wildcard prefix matching (*.domain.com)
 */
function matchesPattern(hostname: string, pattern: string): boolean {
  // Normalize both to lowercase
  const h = hostname.toLowerCase()
  const p = pattern.toLowerCase()

  // Wildcard pattern: *.domain.com
  if (p.startsWith('*.')) {
    const suffix = p.slice(1) // Remove *, keep .domain.com
    // Match if hostname ends with the suffix OR equals the base domain
    return h.endsWith(suffix) || h === p.slice(2)
  }

  // Exact match
  return h === p
}

/**
 * Extract hostname from a URL string
 */
function extractHostname(url: string): string | null {
  try {
    // Handle relative URLs by providing a base
    const parsed = new URL(url, 'http://localhost')
    return parsed.hostname
  } catch {
    return null
  }
}

// =============================================================================
// POLICY ENGINE CLASS
// =============================================================================

class PolicyEngineImpl {
  private patterns: string[]
  private debugMode: boolean = false

  constructor() {
    this.patterns = [...KILL_LIST]
  }

  /**
   * Enable/disable debug logging
   */
  setDebug(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Add additional patterns to the kill list
   */
  addPatterns(patterns: string[]): void {
    this.patterns.push(...patterns)
  }

  /**
   * Get current pattern count
   */
  getPatternCount(): number {
    return this.patterns.length
  }

  /**
   * Get all current patterns
   */
  getPatterns(): string[] {
    return [...this.patterns]
  }

  /**
   * Evaluate a URL against the kill list
   * Returns BLOCK_AND_MOCK for all kill list matches, ALLOW otherwise
   */
  evaluate(url: string): PolicyResult {
    const hostname = extractHostname(url)
    const timestamp = Date.now()

    // If we can't parse the URL, allow it (fail open for usability)
    if (!hostname) {
      return {
        decision: PolicyDecision.ALLOW,
        url,
        hostname: '',
        timestamp
      }
    }

    // Check against kill list patterns
    for (const pattern of this.patterns) {
      if (matchesPattern(hostname, pattern)) {
        const result: PolicyResult = {
          decision: PolicyDecision.BLOCK_AND_MOCK,
          url,
          hostname,
          matchedPattern: pattern,
          timestamp
        }

        if (this.debugMode) {
          console.log(`[BLACKOUT] BLOCKED: ${hostname} (matched: ${pattern})`)
        }

        return result
      }
    }

    // No match - allow the request
    return {
      decision: PolicyDecision.ALLOW,
      url,
      hostname,
      timestamp
    }
  }

  /**
   * Quick check if URL should be blocked (without full result)
   */
  shouldBlock(url: string): boolean {
    return this.evaluate(url).decision === PolicyDecision.BLOCK_AND_MOCK
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const PolicyEngine = new PolicyEngineImpl()

// Re-export types for convenience
export { PolicyDecision, type PolicyResult }
