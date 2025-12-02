# Threat Model

## What Vendors Extract

When you install a B2B identification script, here's what typically gets sent to vendor servers:

### Identity Data (What They Claim to Provide)
- IP address resolution to company
- Email/LinkedIn hash matching
- Device fingerprinting

### Intent Data (What They Actually Monetize)

| Field | What It Reveals |
|-------|-----------------|
| `url` | Page-level intent (pricing vs careers vs docs) |
| `title` | Content context |
| `last_referrer` | Traffic source attribution |
| `fbp` | Cross-site Facebook tracking |
| `fbc` | Facebook click ID correlation |
| `hs_hubspotutk` | HubSpot tracking cookie |
| `geo` | Precise lat/long/zip location |
| `session_id` | Session-level behavior patterns |

### The Real Product

Vendors aggregate this data across their entire customer base:

- "Users who visit pricing pages on Site A also visit..."
- "Companies researching [topic] based on cross-site behavior..."
- "Intent signals correlated across 10,000+ B2B sites..."

**Your visitors become rows in someone else's database.**

---

## Attack Surface

### Script Injection
The vendor script runs in your page context with full DOM access.

### Network Exfiltration
Data leaves via:
- `fetch()` POST requests
- `XMLHttpRequest` calls
- `navigator.sendBeacon()` (survives page unload)
- `<img>` pixel tracking

### Header Leakage
Even without explicit data collection:
- `Referer` header exposes current URL path
- Cookies may be sent automatically

---

## BLACKOUT Mitigation

| Threat | Mitigation |
|--------|------------|
| Script execution | Cannot prevent (intentional) |
| fetch/XHR/beacon | **BLOCKED** - Shimmed APIs |
| Data exfiltration | **BLOCKED** - Kill list matching |
| Header leakage | **BLOCKED** - Request never sent |
| Pixel tracking | **BLOCKED** - Image requests to kill list |

---

## What BLACKOUT Cannot Protect Against

- WebSocket connections (future roadmap)
- WebRTC data channels (future roadmap)
- Scripts that use eval() to construct requests dynamically (edge case)
- Server-side tracking (requires different approach)

---

## Threat Intelligence

The current kill list targets RB2B infrastructure:

```
rb2b.com / *.rb2b.com
api.rb2b.com / cdn.rb2b.com / track.rb2b.com
rb2b.io / rb2b.net
ddwl4m2hdecbv.cloudfront.net (CDN)
```

Additional vendors can be added via `additionalPatterns` config.
