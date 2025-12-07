# BTI-2025-0025: TrenDemon ABM Platform

> **CRITICAL** | BTSS Score: 9.5/10 | eval() Arbitrary Code Execution, Supply Chain Compromise, Cross-Vendor Cookie Harvesting

---

## Executive Summary

**TrenDemon** is an Account-Based Marketing (ABM) content personalization platform deployed on major B2B websites including 6sense's privacy policy page.

### Critical Findings

| Finding | Severity | Description |
|---------|----------|-------------|
| **6x eval() ACE** | CRITICAL | Arbitrary JavaScript execution from CTA parameters (client-side) |
| **polyfill.io Supply Chain** | CRITICAL | Loads scripts from domain compromised June 2024 |
| **760-Day Cookies** | HIGH | Violates GDPR/ICO retention guidelines |
| **MA Cookie Harvesting** | HIGH | Steals Marketo/HubSpot cookies cross-vendor |
| **Evasive Fingerprinting** | HIGH | Evasive canvas/emoji fingerprinting in a Web Worker |

---

## Technical Analysis

### 1. Arbitrary Code Execution (eval())

The `trends.min.js` SDK contains **6 separate eval() calls** that execute arbitrary JavaScript from customer-controlled CTA parameters:

```javascript
// Example: sendGa4Tracking function (line 475)
$Trd_Utils.sendGa4Tracking = function(ctaParams, event, page) {
  var trackingCodeToEval;
  switch(event) {
    case "load":
      trackingCodeToEval = ctaParams.CustomImpressionTrackingCode;
      break;
    case "click":
      trackingCodeToEval = ctaParams.CustomClickTrackingCode;
      break;
  }
  return (trackingCodeToEval?.length)
    ? eval(trackingCodeToEval)  // <-- ARBITRARY CODE EXECUTION
    : dataLayer.push(...)
}
```

#### All eval() Locations

| Line | Function | Input Source |
|------|----------|--------------|
| 475 | `sendGa4Tracking` | `ctaParams.CustomClickTrackingCode` |
| 2561 | Exit Intent | `ctaParams.exitintent_actionscript` |
| 5064 | Form Script | `scriptToRun` |
| 7612 | Embedded CTA | `script.innerText` |
| 10804 | Post-Completion | `personal.postCompletionScript` |
| 11985 | GA4 Handler | `trackingCodeToEval` |

**Impact**: Any TrenDemon customer (or attacker compromising CTA configuration) can execute arbitrary JavaScript in all visitor browsers.

**CVSS Estimate**: 9.8 (Network/Low/None/Changed/High/High/High)

---

### 2. polyfill.io Supply Chain Vulnerability

TrenDemon's SDK still references `polyfill.io`, a domain **compromised in June 2024** when it was acquired by Funnull CDN and began injecting malicious code.

```javascript
t.prototype.loadPollyills = function (t) {  // Note: MISSPELLED
  if (Array.prototype.findIndex) t();  // Modern browser - skip
  else {
    var e = document.createElement("script");
    e.src = "https://polyfill.io/v3/polyfill.min.js?features=...";
    // LOADS FROM COMPROMISED DOMAIN ON OLDER BROWSERS
  }
};
```

**Trigger Condition**: Fires when `Array.prototype.findIndex` is unavailable (IE11, Safari < 9, older mobile browsers)

**Status**: Production code STILL references compromised domain as of 2025-12-04

---

### 3. Cross-Vendor Cookie Harvesting

TrenDemon harvests cookies from other marketing automation platforms:

| Platform | Cookie Harvested | Method |
|----------|------------------|--------|
| Marketo | `_mkto_trk` | Base64 encoded in `trd_ma_cookie` |
| HubSpot | `hubspotutk` | Via LeadFeeder `foreignCookieSettings` |
| Pardot | `visitor_id*` | Polled by Demandbase tag (5s window) |

**Exfiltration Pattern**:
```http
GET /api/experience/personal?
  AccountId=[ACCOUNT_ID]&
  ClientUrl=[PAGE_URL]&
  MarketingAutomationCookie=id:[MARKETO_ID]&token:[TOKEN]&
  vid=[VISITOR_ID]
Host: trackingapi.trendemon.com
```

---

### 4. Evasive Worker-Based Fingerprinting

TrenDemon creates dynamic JavaScript Blobs and executes them in Web Workers to perform canvas-based fingerprinting that evades detection:

**Why This Technique?**
- Blob URLs bypass some CSP restrictions
- Harder to attribute fingerprinting to vendor (no stack traces)
- Off-main-thread execution (less suspicious)
- Ephemeral URLs die when revoked (hard to capture)

**Fingerprinting Tests**:
```javascript
// The core logic inside the Web Worker
switch(testName) {
  case "flag":
    // Compares rendering of transgender flag emoji with a Zero-Width Joiner (ZWJ)
    // vs. one with a Zero-Width Space (ZWSP) to fingerprint the OS text engine.
    // Correct: 🏳️‍⚧️ (ZWJ) vs. Incorrect: 🏳️​⚧️ (ZWSP)
    return pixelComparer(ctx, "🏳️‍⚧️", "🏳️​⚧️");
  case "emoji":
    // Checks if a newer emoji (🪟) renders, fingerprinting OS/browser version.
    return !pixelChecker(ctx, "🪟");
}
```

**Captured Blob Evidence**:
```json
{
  "blobUrl": "blob:https://trendemon.com/38876f46-47a4-4b3e-8c56-3242d7923cc2",
  "blobType": "text/javascript",
  "patterns": [
    "canvas_fingerprint",
    "canvas_pixel_read",
    "emoji_fingerprint",
    "unicode_probe",
    "worker_fingerprint",
    "worker_exfil"
  ]
}
```

---

### 5. Fingerprint Hashing (MurmurHash3)

The `identity.min.js` library collects 26+ browser attributes and hashes them with MurmurHash3 (128-bit):

**Data Points Collected**:
- `userAgent`, `language`, `platform`, `cpuClass`
- `screenResolution`, `colorDepth`, `deviceMemory`, `hardwareConcurrency`
- `plugins`, `webglVendorAndRenderer`, `touchSupport`
- Anti-fraud: `webdriver`, `adBlock`, `hasLiedOs`, `hasLiedBrowser`
- Storage: `sessionStorage`, `localStorage`, `indexedDb`

**Hashing Call**:
```javascript
o = $Trd_Identity.x64hash128(i.join(""), 31), n(o)
```

---

### 6. Anti-Analysis Techniques

The script strips debug parameters to prevent security analysis:

```javascript
$Trd_Utils.cleanUrlParameters = function(t) {
  ["utm_source", "gclid", "trd_debug", "admin_preview", "preview", ...].forEach(n => {
    t.delete(n)
  });
}
```

---

## Indicators of Compromise (IOCs)

### File Hashes (SHA256)

| File | Hash | Size |
|------|------|------|
| `trends.min.js` | `84b1729f3fe0c831b7895e6d30da0086bcc1f17305daa6097e62e0c261fa4fbe` | 359KB |
| `identity.min.js` | `1220bdf087a7b3b0f068e1dc2422c361ef11cf999ff8ea343573d9e5a7c19bdc` | 18KB |

### Domains

| Domain | Type | Risk |
|--------|------|------|
| `trackingapi.trendemon.com` | API | CRITICAL |
| `assets.trendemon.com` | CDN | CRITICAL |
| `trendemon.com` | Primary | HIGH |
| `polyfill.io` | Supply Chain | CRITICAL |

### Malicious URLs

```
https://assets.trendemon.com/tag/trends.min.js
https://assets.trendemon.com/global/identity.min.js
https://polyfill.io/v3/polyfill.min.js
```

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/settings/{accountId}` | Configuration fetch |
| `/api/events/pageview` | Page view tracking (Base64 URL) |
| `/api/events/pageread` | Content engagement tracking |
| `/api/experience/personal` | Personalization + MA cookie exfiltration |
| `/api/experience/personal-stream` | Real-time personalization |
| `/api/experience/personal-embedded` | Embedded widget |
| `/api/experience/ace-campaign` | Campaign targeting |
| `/api/Identity/me` | Visitor identity resolution |
| `/api/marketingautomation` | MA system integration |

### Cookies

| Cookie | Lifetime | Purpose |
|--------|----------|---------|
| `trd_vid_{accountId}` | 760 days | Primary visitor ID |
| `trd_gavid_{accountId}` | 760 days | GA-linked visitor ID |
| `trd_gvid` | 760 days | Global visitor ID |
| `trd_ma_cookie` | Session | Harvested MA cookie (Base64) |
| `trd_session` | Session | Session tracking |
| `trd_cid` | Session | Client ID |

### localStorage Keys

| Key | Lifetime |
|-----|----------|
| `trd_vid_l` | Infinite |
| `trd_vuid_l` | Infinite |

### Script Signatures

```
$Trd_Utils
$Trd_Tools
$Trd_Identity
sendGa4Tracking
loadPollyills          # Note: MISSPELLED - unique fingerprint
CustomImpressionTrackingCode
CustomClickTrackingCode
x64hash128
```

---

## Detection Signatures

### Code Patterns

| Pattern | Description |
|---------|-------------|
| `eval\(trackingCodeToEval\)` | Direct `eval()` execution sink. |
| `loadPollyills` | Unique typo, strong signature for the script. |
| `\$Trd_Identity\.x64hash128` | MurmurHash3 hashing function call. |
| `OffscreenCanvas.*postMessage` | Evasive fingerprinting in a Web Worker. |
| `\["flag",\s*"emoji"\]` | Array of fingerprinting tests to run. |
| `\u200d.*\u200b` | ZWJ vs. ZWSP Unicode comparison for canvas tests. |

### Network IOCs (Blocklist)

```
# DNS/Firewall Rules
||trackingapi.trendemon.com^
||assets.trendemon.com^
||trendemon.com^
||polyfill.io^
```

### Cookie Patterns

```
trd_*
trd_vid_*
trd_gavid_*
trd_ma_cookie
```

---

## Legal Implications

| Statute | Jurisdiction | Violation |
|---------|--------------|-----------|
| GDPR Art. 5(1)(e) | European Union | Storage limitation - 760-day cookie retention |
| GDPR Art. 6 | European Union | No valid legal basis for cross-vendor cookie sharing |
| CCPA 1798.140 | California | Cross-vendor data sharing may constitute 'sale' of PI |
| ePrivacy Art. 5(3) | European Union | Cookie consent required before setting tracking cookies |

---

## Identity Chain

TrenDemon enables full deanonymization through linked identifiers:

```
TrenDemon visitor ID
        |
        v
   Marketo ID
        |
        v
   6sense UUID
        |
        v
Epsilon Company ID
        |
        v
Deanonymized Entity
```

---

## Remediation

### For Website Owners

| Priority | Action |
|----------|--------|
| **IMMEDIATE** | Remove TrenDemon scripts from site |
| **IMMEDIATE** | Block `trackingapi.trendemon.com` at firewall/CDN |
| Short-term | Audit Marketo integration for cookie leakage |

### For Visitors

| Priority | Action |
|----------|--------|
| **IMMEDIATE** | Block `trendemon.com` domains in browser/network |
| **IMMEDIATE** | Clear `trd_*` cookies and localStorage |

---

## Ironic Finding

TrenDemon actively tracks visits to privacy-related pages:
- `/privacy-policy/`
- `/privacy-center/`
- `/trust/`

---

## References

- [TrenDemon Website](https://trendemon.com)
- [TrenDemon SDK](https://assets.trendemon.com/tag/trends.min.js)
- [Sansec polyfill.io Research](https://sansec.io/research/polyfill-supply-chain-attack)

---

## Metadata

| Field | Value |
|-------|-------|
| Advisory ID | BTI-2025-0025 |
| Created | 2025-12-04 |
| Updated | 2025-12-07 |
| Author | Blackout Threat Intelligence |
| Status | Active |
| Related | BTI-2025-0023 (6sense surveillance stack) |

---

*Machine-readable version: [advisory.yaml](./advisory.yaml)*
