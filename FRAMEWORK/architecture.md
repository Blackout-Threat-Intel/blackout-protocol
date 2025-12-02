# Architecture

## System Overview

BLACKOUT Protocol operates at the browser's network layer, intercepting all outbound requests before they leave the page.

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER CONTEXT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Third-Party Script                                            │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              BLACKOUT SHIM LAYER                        │   │
│   │                                                         │   │
│   │   fetch() ──────┐                                       │   │
│   │   XHR.send() ───┼──▶ PolicyEngine.evaluate(url)        │   │
│   │   sendBeacon() ─┘           │                           │   │
│   │                             │                           │   │
│   │                    ┌────────┴────────┐                  │   │
│   │                    │                 │                  │   │
│   │                    ▼                 ▼                  │   │
│   │               ALLOW            BLOCK_AND_MOCK          │   │
│   │                 │                    │                  │   │
│   │                 ▼                    ▼                  │   │
│   │          Original API        MockFactory               │   │
│   │                │              └─▶ Response 200 OK      │   │
│   │                ▼                                        │   │
│   └────────────────┼────────────────────────────────────────┘   │
│                    │                                            │
└────────────────────┼────────────────────────────────────────────┘
                     │
                     ▼
              EXTERNAL NETWORK
              (only allowed requests)
```

---

## Module Breakdown

### 1. NetworkSniffer (`network-sniffer.ts`)

**Role:** The Shim

Replaces browser networking APIs with intercepting versions:

```typescript
// Original APIs stored for restoration
originalAPIs = {
  fetch: window.fetch.bind(window),
  xhrOpen: XMLHttpRequest.prototype.open,
  xhrSend: XMLHttpRequest.prototype.send,
  sendBeacon: navigator.sendBeacon.bind(navigator)
}

// Install shims
window.fetch = shimmedFetch
XMLHttpRequest.prototype.open = shimmedXHROpen
XMLHttpRequest.prototype.send = shimmedXHRSend
navigator.sendBeacon = shimmedSendBeacon
```

### 2. PolicyEngine (`policy-engine.ts`)

**Role:** The Brain

Evaluates URLs against the kill list:

```typescript
const KILL_LIST = [
  'rb2b.com',
  '*.rb2b.com',     // Wildcard matching
  'api.rb2b.com',
  // ...
]

evaluate(url: string): PolicyResult {
  // Extract hostname
  // Match against patterns
  // Return ALLOW or BLOCK_AND_MOCK
}
```

**Pattern Matching:**
- Exact: `rb2b.com` matches only `rb2b.com`
- Wildcard: `*.rb2b.com` matches `api.rb2b.com`, `cdn.rb2b.com`, etc.

### 3. MockFactory (`mock-factory.ts`)

**Role:** The Lie

Generates convincing fake responses:

```typescript
// Fetch response
new Response(JSON.stringify({
  success: true,
  status: 'ok',
  received: true
}), {
  status: 200,
  statusText: 'OK',
  headers: { 'Content-Type': 'application/json' }
})

// XHR - mutate object properties
Object.defineProperty(xhr, 'status', { value: 200 })
Object.defineProperty(xhr, 'responseText', { value: '{"success":true}' })
// Fire readystatechange, load, loadend events

// sendBeacon - return true
return true
```

---

## Data Flow

### Blocked Request

```
1. Script calls fetch('https://api.rb2b.com/collect', { body: data })
2. shimmedFetch() intercepts
3. PolicyEngine.evaluate('https://api.rb2b.com/collect')
4. Hostname 'api.rb2b.com' matches pattern '*.rb2b.com'
5. Return PolicyDecision.BLOCK_AND_MOCK
6. MockFactory.createFetchResponse() returns fake 200 OK
7. Script receives Response, thinks request succeeded
8. No data left the browser
```

### Allowed Request

```
1. Script calls fetch('https://api.stripe.com/v1/charges')
2. shimmedFetch() intercepts
3. PolicyEngine.evaluate('https://api.stripe.com/v1/charges')
4. No pattern matches
5. Return PolicyDecision.ALLOW
6. Call originalAPIs.fetch() with original arguments
7. Real request sent to Stripe
```

---

## Event Simulation (XHR)

XHR is more complex because scripts often attach event handlers:

```typescript
xhr.onload = function() { console.log('Done!') }
xhr.onreadystatechange = function() { /* ... */ }
```

BLACKOUT fires all expected events:

```typescript
fireXHREvents(xhr) {
  xhr.dispatchEvent(new Event('readystatechange'))
  xhr.dispatchEvent(new ProgressEvent('load', { loaded: 100, total: 100 }))
  xhr.dispatchEvent(new ProgressEvent('loadend'))

  // Also call direct handlers
  xhr.onload?.(loadEvent)
  xhr.onreadystatechange?.(readyStateEvent)
}
```

---

## Extension Architecture

For Chrome extension deployment:

```
extension/
├── manifest.json      # MV3 manifest, permissions
├── content-loader.js  # Runs at document_start
└── blackout.bundle.js # The compiled IIFE bundle
```

**Injection Flow:**
1. `content-loader.js` runs at `document_start` (before any other scripts)
2. Creates `<script>` element pointing to `blackout.bundle.js`
3. Injects into page `<head>`
4. BLACKOUT initializes before tracking scripts load
5. All subsequent network requests go through shims

---

## Security Considerations

### Why Hardcoded Kill List?

The kill list is compiled into the bundle, not loaded from external config:

- **No config hijacking** - Attackers can't modify remote config to bypass
- **No network dependency** - Works offline, no fetch needed for patterns
- **Auditable** - Users can verify exactly what's blocked

### Why Synthetic 200 OK?

Returning errors (403, 500) would:
- Trigger error handlers in tracking scripts
- Potentially cause retry loops
- Log errors to vendor dashboards (alerting them)

Synthetic success keeps everything quiet.
