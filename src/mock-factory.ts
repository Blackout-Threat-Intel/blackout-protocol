/**
 * BLACKOUT Protocol - MockFactory
 *
 * The Lie. Generates convincing synthetic responses that won't
 * trigger error handlers in tracking scripts.
 *
 * @license MIT
 * @see https://github.com/Blackout-Threat-Intel/blackout-protocol
 */

import { RequestType, MockConfig } from './types'

// =============================================================================
// DEFAULT MOCK RESPONSES
// =============================================================================

/**
 * Default successful response body - looks like a typical tracking pixel response
 */
const DEFAULT_BODY = {
  success: true,
  status: 'ok',
  received: true
}

/**
 * Default headers for JSON responses
 */
const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Powered-By': 'BLACKOUT'
}

// =============================================================================
// MOCK FACTORY CLASS
// =============================================================================

class MockFactoryImpl {
  private debugMode: boolean = false

  /**
   * Enable/disable debug logging
   */
  setDebug(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Create a mock Response object for fetch API
   */
  createFetchResponse(config?: MockConfig): Response {
    const body = JSON.stringify(config?.body ?? DEFAULT_BODY)
    const status = config?.status ?? 200
    const statusText = config?.statusText ?? 'OK'
    const headers = new Headers({
      ...DEFAULT_HEADERS,
      ...(config?.headers ?? {})
    })

    if (this.debugMode) {
      console.log('[BLACKOUT] MockFactory: Created fetch Response', { status, body })
    }

    return new Response(body, {
      status,
      statusText,
      headers
    })
  }

  /**
   * Configure a mock XHR object to appear as a successful response.
   * This mutates the XHR in place and fires the necessary events.
   */
  configureMockXHR(xhr: XMLHttpRequest, config?: MockConfig): void {
    const body = JSON.stringify(config?.body ?? DEFAULT_BODY)
    const status = config?.status ?? 200
    const statusText = config?.statusText ?? 'OK'

    // Use Object.defineProperty to set readonly properties
    Object.defineProperty(xhr, 'status', { value: status, writable: false })
    Object.defineProperty(xhr, 'statusText', { value: statusText, writable: false })
    Object.defineProperty(xhr, 'readyState', { value: 4, writable: false }) // DONE
    Object.defineProperty(xhr, 'response', { value: body, writable: false })
    Object.defineProperty(xhr, 'responseText', { value: body, writable: false })
    Object.defineProperty(xhr, 'responseType', { value: '', writable: false })

    // Set response headers
    const headerString = Object.entries({
      ...DEFAULT_HEADERS,
      ...(config?.headers ?? {})
    })
      .map(([k, v]) => `${k}: ${v}`)
      .join('\r\n')

    Object.defineProperty(xhr, 'getAllResponseHeaders', {
      value: () => headerString,
      writable: false
    })

    Object.defineProperty(xhr, 'getResponseHeader', {
      value: (name: string) => {
        const headers = { ...DEFAULT_HEADERS, ...(config?.headers ?? {}) }
        return headers[name] ?? null
      },
      writable: false
    })

    if (this.debugMode) {
      console.log('[BLACKOUT] MockFactory: Configured mock XHR', { status, body })
    }
  }

  /**
   * Fire XHR events to simulate completion.
   * Call this after configureMockXHR to trigger callbacks.
   */
  fireXHREvents(xhr: XMLHttpRequest): void {
    // Fire readystatechange for each state
    const readyStateEvent = new Event('readystatechange')

    // Simulate state progression (some libs check this)
    // We're already at state 4, just fire the event
    xhr.dispatchEvent(readyStateEvent)

    // Fire load event (success)
    const loadEvent = new ProgressEvent('load', {
      lengthComputable: true,
      loaded: 100,
      total: 100
    })
    xhr.dispatchEvent(loadEvent)

    // Fire loadend event
    const loadEndEvent = new ProgressEvent('loadend', {
      lengthComputable: true,
      loaded: 100,
      total: 100
    })
    xhr.dispatchEvent(loadEndEvent)

    // Call onload if defined
    if (typeof xhr.onload === 'function') {
      xhr.onload(loadEvent)
    }

    // Call onreadystatechange if defined
    if (typeof xhr.onreadystatechange === 'function') {
      xhr.onreadystatechange(readyStateEvent)
    }

    // Call onloadend if defined
    if (typeof xhr.onloadend === 'function') {
      xhr.onloadend(loadEndEvent)
    }

    if (this.debugMode) {
      console.log('[BLACKOUT] MockFactory: Fired XHR events')
    }
  }

  /**
   * Get the mock return value for sendBeacon
   * (sendBeacon returns boolean indicating if beacon was queued)
   */
  createBeaconResult(): boolean {
    if (this.debugMode) {
      console.log('[BLACKOUT] MockFactory: Returning true for beacon')
    }
    return true
  }

  /**
   * Create appropriate mock response based on request type
   */
  createResponse(type: RequestType, config?: MockConfig): Response | boolean {
    switch (type) {
      case 'fetch':
        return this.createFetchResponse(config)
      case 'beacon':
        return this.createBeaconResult()
      default:
        // XHR is handled differently (mutates in place)
        return this.createFetchResponse(config)
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const MockFactory = new MockFactoryImpl()
