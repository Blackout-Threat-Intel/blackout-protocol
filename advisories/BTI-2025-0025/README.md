# BTI-2025-0025: TrenDemon ABM Platform

> **CRITICAL** | BTSS Score: 9.5/10 | eval() Arbitrary Code Execution, Supply Chain Compromise, Cross-Vendor Cookie Theft

---

## Methodology Note

> This advisory documents **security vulnerabilities and privacy violations that exceed industry norms**. Standard marketing telemetry (page views, session cookies, analytics integrations) is not flagged unless it exhibits abnormal or malicious behavior.
>
> TrenDemon performs legitimate ABM functions. This advisory focuses exclusively on:
> - **Security vulnerabilities** (eval() ACE, supply chain compromise)
> - **Privacy violations** (excessive retention, cross-vendor data theft)
> - **Evasion techniques** (worker-based fingerprinting designed to avoid detection)

---

## Executive Summary

**TrenDemon** is an Account-Based Marketing (ABM) content personalization platform deployed on major B2B websites including 6sense's privacy policy page.

### Critical Findings

| Finding | Severity | Description |
|---------|----------|-------------|
| **6x eval() ACE** | CRITICAL | Arbitrary JavaScript execution from CTA parameters (client-side) |
| **polyfill.io Supply Chain** | CRITICAL | Loads scripts from domain compromised June 2024 |
| **760-Day Cookies** | HIGH | Exceeds ICO 13-month guidance by 2.4x |
| **Cross-Vendor Cookie Theft** | HIGH | Exfiltrates Marketo/HubSpot cookies without authorization |
| **Evasive Fingerprinting** | HIGH | Canvas fingerprinting hidden in Web Worker blobs |

---

## Technical Analysis

### 1. Arbitrary Code Execution (eval())

The `trends.min.js` SDK contains **6 separate eval() calls** that execute arbitrary JavaScript from customer-controlled CTA parameters.

**Why This Matters**: Any TrenDemon customer—or attacker who compromises a customer's CTA configuration—can execute arbitrary JavaScript in the browsers of all visitors to sites running TrenDemon.

```javascript
// The vulnerability is the eval(), not the GA4 integration
// GA4/dataLayer usage is standard; eval() of customer input is not
return (trackingCodeToEval?.length)
  ? eval(trackingCodeToEval)  // <-- ARBITRARY CODE EXECUTION
  : dataLayer.push(...)       // <-- This fallback is normal
```

#### All eval() Locations

| Line | Context | Dangerous Input |
|------|---------|-----------------|
| 475 | CTA click handler | `ctaParams.CustomClickTrackingCode` |
| 2561 | Exit intent popup | `ctaParams.exitintent_actionscript` |
| 5064 | Form submission | `scriptToRun` |
| 7612 | Embedded CTA render | `script.innerText` |
| 10804 | Video completion | `personal.postCompletionScript` |
| 11985 | Impression handler | `trackingCodeToEval` |

**CVSS Estimate**: 9.8 (Network/Low/None/Changed/High/High/High)

---

### 2. polyfill.io Supply Chain Vulnerability

TrenDemon's SDK references `polyfill.io`, a domain **compromised in June 2024** when acquired by Funnull CDN. The domain began injecting malicious redirects into 100,000+ websites.

```javascript
t.prototype.loadPollyills = function (t) {  // Note: MISSPELLED
  if (Array.prototype.findIndex) t();  // Modern browser - skip
  else {
    var e = document.createElement("script");
    e.src = "https://polyfill.io/v3/polyfill.min.js?features=...";
    // LOADS FROM COMPROMISED DOMAIN
  }
};
```

**Trigger Condition**: Fires when `Array.prototype.findIndex` is unavailable (IE11, Safari < 9, older mobile browsers)

**Status**: Production code STILL references compromised domain as of 2025-12-04

**Why This Matters**: This isn't a hypothetical—polyfill.io was actively serving malware. TrenDemon's failure to update after 6+ months of public disclosure is negligent.

---

### 3. Cross-Vendor Cookie Theft

TrenDemon reads cookies set by *other* marketing platforms and exfiltrates them to TrenDemon servers. This is not standard cookie syncing—it's unauthorized cross-vendor data collection.

| Platform | Cookie Stolen | Exfiltration Method |
|----------|---------------|---------------------|
| Marketo | `_mkto_trk` | Base64 encoded in `trd_ma_cookie`, sent to TrenDemon API |
| HubSpot | `hubspotutk` | Harvested via `foreignCookieSettings` configuration |
| Pardot | `visitor_id*` | Polled with 5-second window |

**Exfiltration Endpoint**:
```http
GET /api/experience/personal?
  MarketingAutomationCookie=id:[MARKETO_ID]&token:[TOKEN]
Host: trackingapi.trendemon.com
```

**Why This Matters**: Marketo didn't authorize TrenDemon to read their cookies. Neither did HubSpot. This creates undisclosed data sharing between vendors that users cannot consent to.

---

### 4. Evasive Worker-Based Fingerprinting

TrenDemon performs canvas fingerprinting inside dynamically-created Web Worker blobs—a technique specifically designed to evade detection.

**Evasion Techniques**:
| Technique | Purpose |
|-----------|---------|
| Blob URLs | Bypass CSP restrictions |
| Web Workers | No stack traces attributable to vendor |
| Ephemeral URLs | Evidence destroyed when blob revoked |
| Off-main-thread | Harder to detect via performance monitoring |

**Fingerprinting Method**:
```javascript
// Compares emoji rendering to fingerprint OS/browser
case "flag":
  // ZWJ vs ZWSP comparison fingerprints text rendering engine
  return pixelComparer(ctx, "\ud83c\udff3\ufe0f\u200d\u26a7\ufe0f",
                            "\ud83c\udff3\ufe0f\u200b\u26a7\ufe0f");
case "emoji":
  // Tests if newer emoji renders to fingerprint OS version
  return !pixelChecker(ctx, "\ud83e\udedf");
```

**Why This Matters**: Canvas fingerprinting itself is common. Hiding it in ephemeral worker blobs to avoid attribution is evasion.

---

### 5. Excessive Cookie Retention

| Cookie | Lifetime | Issue |
|--------|----------|-------|
| `trd_vid_{accountId}` | **760 days** | Exceeds ICO 13-month guidance by 2.4x |
| `trd_gavid_{accountId}` | **760 days** | Cross-linked with Google Analytics |
| `trd_gvid` | **760 days** | Global visitor ID across all TrenDemon customers |

**Why This Matters**: The UK ICO explicitly recommends analytics cookies expire within 13 months. 760 days is a deliberate choice to maximize tracking persistence.

---

## Indicators of Compromise (IOCs)

### File Hashes (SHA256)

| File | Hash | Size |
|------|------|------|
| `trends.min.js` | `84b1729f3fe0c831b7895e6d30da0086bcc1f17305daa6097e62e0c261fa4fbe` | 359KB |
| `identity.min.js` | `1220bdf087a7b3b0f068e1dc2422c361ef11cf999ff8ea343573d9e5a7c19bdc` | 18KB |

### Domains

| Domain | Risk | Reason |
|--------|------|--------|
| `trackingapi.trendemon.com` | CRITICAL | MA cookie exfiltration endpoint |
| `assets.trendemon.com` | CRITICAL | Serves vulnerable SDK |
| `polyfill.io` | CRITICAL | Compromised supply chain |

### Security-Relevant Endpoints

| Endpoint | Concern |
|----------|---------|
| `/api/experience/personal` | Exfiltrates harvested MA cookies |
| `/api/Identity/me` | Fingerprint-based identity resolution |

*Note: Standard telemetry endpoints (pageview, pageread, settings) are not listed as IOCs.*

### Cookies of Concern

| Cookie | Concern |
|--------|---------|
| `trd_vid_*` | 760-day retention |
| `trd_gavid_*` | 760-day retention |
| `trd_gvid` | 760-day global tracking |
| `trd_ma_cookie` | Contains stolen Marketo data |

*Note: Session cookies (trd_session, trd_cid) are standard and not flagged.*

### Detection Signatures

| Pattern | Indicates |
|---------|-----------|
| `eval\(trackingCodeToEval\)` | ACE vulnerability |
| `loadPollyills` | Misspelled function (unique fingerprint) |
| `polyfill\.io` | Compromised supply chain reference |
| `OffscreenCanvas.*postMessage` | Evasive fingerprinting |

---

## Legal Implications

| Statute | Violation |
|---------|-----------|
| GDPR Art. 5(1)(e) | Storage limitation - 760-day retention |
| GDPR Art. 6 | No legal basis for cross-vendor cookie sharing |
| CCPA 1798.140 | Cross-vendor sharing may constitute "sale" |
| ePrivacy Art. 5(3) | Cookie consent requirements |

---

## Remediation

### For Website Owners

| Priority | Action |
|----------|--------|
| **IMMEDIATE** | Remove TrenDemon scripts |
| **IMMEDIATE** | Block `trackingapi.trendemon.com` at firewall |
| Short-term | Audit Marketo integration for cookie leakage |

### For Visitors

| Priority | Action |
|----------|--------|
| **IMMEDIATE** | Block `trendemon.com` domains |
| **IMMEDIATE** | Clear `trd_*` cookies |

### Blocklist

```
||trackingapi.trendemon.com^
||assets.trendemon.com^
||trendemon.com^
||polyfill.io^
```

---

## References

- [Sansec polyfill.io Research](https://sansec.io/research/polyfill-supply-chain-attack)
- [ICO Cookie Guidance](https://ico.org.uk/for-organisations/guide-to-pecr/cookies-and-similar-technologies/)

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
