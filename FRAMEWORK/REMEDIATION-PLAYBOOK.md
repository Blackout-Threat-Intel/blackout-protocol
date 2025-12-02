# BLACKOUT PROTOCOL: RB2B Threat Remediation Playbook

**Classification**: PUBLIC RELEASE
**Version**: 1.0
**Date**: 2025-12-02
**Author**: BLACKOUT Threat Intelligence

---

## EXECUTIVE SUMMARY

RB2B (operated by Retention.com) deploys visitor deanonymization technology that identifies anonymous website visitors by name, email, and company. While marketed as a "GTM tool," forensic analysis reveals the vendor extracts significantly more data than required for identification—building behavioral graphs of your audience that they monetize through their data network.

**BLACKOUT Protocol** ("Greyout Mode") is a browser-edge countermeasure that:
- **PRESERVES** identification functionality for your GTM team
- **STRIPS** intent, attribution, and cross-site correlation data
- **BREAKS** the vendor's ability to monetize your audience

**Result**: Your team gets the lead. The vendor gets noise.

---

## VERIFY THESE CLAIMS YOURSELF

We encourage independent verification. If we're wrong, file an issue.

1. **Install RB2B** on a test page
2. **Open DevTools** → Network tab
3. **Filter by** `execute-api` or `cloudfront.net/b/`
4. **Observe the payload fields** in the POST request body
5. **Compare to our Keep vs Nuke list** below

You'll see fields like `url`, `referrer`, `fbp`, `hs_hubspotutk` being exfiltrated—none of which are required for visitor identification.

---

## THREAT OVERVIEW

### What RB2B Does

1. **Loads a JavaScript payload** from CloudFront CDN or S3
2. **Fingerprints the visitor** using device, browser, and behavioral signals
3. **Correlates across ecosystems** via Facebook, HubSpot, and LinkedIn tracking pixels
4. **Exfiltrates to API Gateway** for person-level identification
5. **Returns identity data** to your CRM/webhook

### The Problem

RB2B collects **far more than needed** for identification:
- Full page URLs (reveals buyer intent: `/pricing` vs `/careers`)
- Referrer chains (reveals traffic sources, campaign data)
- Cross-site pixels (enables behavioral graphs across the ecosystem)
- Precise geolocation (lat/long/zip beyond country)

**This data is monetized** across Retention.com's network of products and data partners.

### Defeat Device Behavior

RB2B scripts contain **50+ bot detection signatures** that disable tracking when compliance tools are detected:

```javascript
// Detected patterns trigger early exit
const BOT_SIGNATURES = [
  "selenium", "puppeteer", "playwright", "cypress",
  "headlesschrome", "phantomjs", "webdriver",
  "ahrefssiteaudit", "semrushbot", "hubspot",
  "beautifulsoup", "scrapy", "postman", "insomnia"
];

if (isBot()) return; // Tracking disabled for auditors
```

**This is a defeat device**: the script behaves differently during compliance testing than in production—identical to Volkswagen's emissions scandal strategy.

---

## INDICATORS OF COMPROMISE (IOCs)

### Network IOCs

| Type | Pattern | Confidence |
|------|---------|------------|
| **CDN Loader** | `ddwl4m2hdecbv.cloudfront.net/b/` | CRITICAL |
| **S3 Bucket** | `s3-us-west-2.amazonaws.com/b2bjsstore/b/` | CRITICAL |
| **API Gateway** | `*.execute-api.us-west-2.amazonaws.com/b2b` | CRITICAL |
| **API Endpoint** | `api.rb2b.com/identify` | HIGH |
| **API Endpoint** | `api.rb2b.com/company` | HIGH |
| **API Endpoint** | `api.rb2b.com/event` | HIGH |

### Script URL Patterns

```
# Primary CloudFront CDN
https://ddwl4m2hdecbv.cloudfront.net/b/{CUSTOMER_ID}/{CUSTOMER_ID}.js.gz

# S3 Direct (evasion pattern)
https://s3-us-west-2.amazonaws.com/b2bjsstore/b/{CUSTOMER_ID}/reb2b.js.gz

# API Gateway (exfiltration endpoint)
https://*.execute-api.us-west-2.amazonaws.com/b2b
```

### Cookie IOCs

| Cookie Name | Purpose | Risk |
|-------------|---------|------|
| `_reb2bloaded` | Script load flag | Detection |
| `_reb2bgeo` | Geolocation data | Location tracking |
| `_reb2btd` | Tracking data | Behavioral profiling |
| `rb2b_md5` | Identity hash | Person identification |
| `li_md5` | LinkedIn correlation | Cross-platform tracking |

### Script Signatures

```javascript
// Function chain in obfuscated code
td( → collect( → run(

// Configuration object keys
{
  'label': "{CUSTOMER_ID}",
  'companyCollection': true,
  'autoTrigger': true,
  'hubspotDelay': 2000,  // HubSpot cookie theft timing
  'sessionDuration': 6000,
  'consentCheckInterval': 600
}

// Base64-encoded source validation
'aHR0cHM6Ly9zMy11cy13ZXN0LTIuYW1hem9uYXdzLmNvbS9iMmJqc3N0b3JlL2Iv'
// Decodes to: https://s3-us-west-2.amazonaws.com/b2bjsstore/b/

'aHR0cHM6Ly9kZHdsNG0yaGRlY2J2LmNsb3VkZnJvbnQubmV0L2Iv'
// Decodes to: https://ddwl4m2hdecbv.cloudfront.net/b/
```

### DOM/Global IOCs

| Global Variable | Description |
|-----------------|-------------|
| `window.reb2b` | RB2B SDK object |
| `window._reb2b` | Internal tracking state |
| `window.RB2BPixel` | Pixel loader class |

---

## DATA FIELD ANALYSIS

### THE KEEP LIST (Minimum Viable for Tool Function)

These fields MUST pass through for identification to work:

| Field | Purpose | Why It's Needed |
|-------|---------|-----------------|
| `account` | Customer routing | Routes data to correct customer account |
| `rb2b_md5` | Identity hash | Core person identification lookup |
| `li_md5` | LinkedIn hash | Alternative identity resolution |
| `guid` | User GUID | Deduplication across sessions |
| `session_id` | Session tracking | Groups page views into sessions |

### THE NUKE LIST (Data They Monetize)

These fields are **intercepted and sanitized** at the browser edge:

| Field | Risk | Action | Impact |
|-------|------|--------|--------|
| `url` | **CRITICAL** - Reveals buyer intent (`/pricing` vs `/careers`) | STRIPPED | Vendor loses page-level intent |
| `title` | **HIGH** - Page context and content signals | STRIPPED | Vendor loses content understanding |
| `last_referrer` | **CRITICAL** - Traffic source attribution | STRIPPED | Vendor loses acquisition data |
| `fbp` | **CRITICAL** - Facebook browser pixel ID | STRIPPED | Breaks cross-site Facebook tracking |
| `fbc` | **CRITICAL** - Facebook click ID | STRIPPED | Breaks FB ad attribution correlation |
| `hs_hubspotutk` | **CRITICAL** - HubSpot user token | STRIPPED | Breaks HubSpot ecosystem correlation |
| `geo.lat` | **HIGH** - Precise latitude | STRIPPED | Vendor loses precision location |
| `geo.lng` | **HIGH** - Precise longitude | STRIPPED | Vendor loses precision location |
| `geo.zip` | **HIGH** - ZIP code | STRIPPED | Vendor loses ZIP-level targeting |
| `geo.country` | **LOW** - Country code | PRESERVED | Kept for compliance checks |

---

## ARCHITECTURE ANALYSIS

### RB2B Infrastructure Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          RB2B INFRASTRUCTURE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  YOUR WEBSITE                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  <script src="ddwl4m2hdecbv.cloudfront.net/b/{ID}/...">        │    │
│  │                            │                                     │    │
│  │                            ▼                                     │    │
│  │  ┌─────────────────────────────────────────────┐                │    │
│  │  │           RB2B JavaScript Payload            │                │    │
│  │  │  ┌─────────────────────────────────────┐    │                │    │
│  │  │  │ 1. Bot Detection (50+ signatures)   │    │                │    │
│  │  │  │ 2. Cookie Harvesting                │    │                │    │
│  │  │  │ 3. Fingerprinting                   │    │                │    │
│  │  │  │ 4. Pixel Correlation                │    │                │    │
│  │  │  └─────────────────────────────────────┘    │                │    │
│  │  └─────────────────────────────────────────────┘                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                            │                                             │
│                            ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              CDN LAYER (Delivery Obfuscation)                    │    │
│  │  ┌───────────────────────┐    ┌───────────────────────┐         │    │
│  │  │ CloudFront CDN        │    │ S3 Direct             │         │    │
│  │  │ ddwl4m2hdecbv...      │    │ s3-us-west-2...       │         │    │
│  │  │ (Primary)             │    │ (Evasion Alias)       │         │    │
│  │  └───────────┬───────────┘    └───────────┬───────────┘         │    │
│  │              │                            │                      │    │
│  │              └────────────┬───────────────┘                      │    │
│  │                           │                                      │    │
│  │                           ▼                                      │    │
│  │              ┌───────────────────────┐                          │    │
│  │              │   S3 BUCKET           │                          │    │
│  │              │   b2bjsstore          │                          │    │
│  │              │   (Single Source)     │                          │    │
│  │              └───────────────────────┘                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                            │                                             │
│                            ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │             API GATEWAY (Exfiltration Surface)                   │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │  *.execute-api.us-west-2.amazonaws.com/b2b                │  │    │
│  │  │                                                            │  │    │
│  │  │  POST /identify  ← Person-level deanonymization           │  │    │
│  │  │  POST /company   ← Company resolution                     │  │    │
│  │  │  POST /event     ← Behavioral event tracking              │  │    │
│  │  │                                                            │  │    │
│  │  │  ══════════════════════════════════════════════════════   │  │    │
│  │  │  ║  THIS IS WHERE BLACKOUT INTERCEPTS  ║                  │  │    │
│  │  │  ══════════════════════════════════════════════════════   │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                            │                                             │
│                            ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                  RB2B BACKEND SYSTEMS                            │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │  Identity Resolution Engine                                │  │    │
│  │  │  • IP-to-Company matching                                  │  │    │
│  │  │  • LinkedIn data correlation                               │  │    │
│  │  │  • Cross-ecosystem graph building                          │  │    │
│  │  │  • Behavioral profiling                                    │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                            │                                             │
│                            ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    DATA MONETIZATION                             │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │  • Retention.com network products                          │  │    │
│  │  │  • Data broker partnerships                                │  │    │
│  │  │  • Cross-customer intent aggregation                       │  │    │
│  │  │  • Behavioral graph licensing                              │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Insight: The CDN Is a Decoy

The CDN (`ddwl4m2hdecbv.cloudfront.net`) **just serves the script**. It's a content delivery layer.

The **API Gateway** (`*.execute-api.us-west-2.amazonaws.com/b2b`) is where:
- Deanonymization actually happens
- Data exfiltration occurs
- Cross-site correlation is built

**BLACKOUT sits between your browser and the API Gateway**, intercepting and sanitizing the payload before it leaves.

---

## REMEDIATION OPTIONS

### Option 1: Complete Removal (Recommended)

**Action**: Remove RB2B script from all properties immediately.

```html
<!-- REMOVE THIS -->
<script src="https://ddwl4m2hdecbv.cloudfront.net/b/YOUR_ID/YOUR_ID.js.gz"></script>
```

**Pros**:
- Complete threat elimination
- Zero vendor data access
- Simplest implementation

**Cons**:
- Loss of visitor identification feature
- GTM team loses tool capability

**Effort**: Trivial (tag removal)

---

### Option 2: BLACKOUT Protocol (Greyout Mode)

**Action**: Deploy browser-edge interception that strips monetizable fields while preserving identification.

**Architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     BLACKOUT PROTOCOL                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BEFORE (Normal RB2B Flow):                                      │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────┐         │
│  │ Browser  │───▶│ Full Payload │───▶│ RB2B API       │         │
│  │          │    │ (All Fields) │    │ (Gets Everything)│        │
│  └──────────┘    └──────────────┘    └────────────────┘         │
│                                                                  │
│  AFTER (Greyout Mode):                                           │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────┐         │
│  │ Browser  │───▶│ BLACKOUT     │───▶│ RB2B API       │         │
│  │          │    │ Intercept    │    │ (Gets Noise)   │         │
│  └──────────┘    │              │    └────────────────┘         │
│                  │ ┌──────────┐ │                                │
│                  │ │ KEEP:    │ │    ┌────────────────┐         │
│                  │ │ account  │ │───▶│ ID Works       │         │
│                  │ │ rb2b_md5 │ │    │ (GTM Gets Lead)│         │
│                  │ │ guid     │ │    └────────────────┘         │
│                  │ │ session  │ │                                │
│                  │ └──────────┘ │                                │
│                  │              │                                │
│                  │ ┌──────────┐ │                                │
│                  │ │ NUKE:    │ │───▶ /dev/null                 │
│                  │ │ url      │ │                                │
│                  │ │ referrer │ │                                │
│                  │ │ fbp/fbc  │ │                                │
│                  │ │ hubspot  │ │                                │
│                  │ │ geo.*    │ │                                │
│                  │ └──────────┘ │                                │
│                  └──────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation** (Conceptual - Service Worker):

```javascript
// BLACKOUT Protocol - Greyout Mode
// Intercepts RB2B API calls and sanitizes payload

const KEEP_FIELDS = ['account', 'rb2b_md5', 'li_md5', 'guid', 'session_id'];
const NUKE_FIELDS = ['url', 'title', 'last_referrer', 'fbp', 'fbc', 'hs_hubspotutk'];

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Intercept RB2B API Gateway calls
  if (url.hostname.includes('execute-api') && url.pathname.includes('b2b')) {
    event.respondWith(sanitizeAndForward(event.request));
  }
});

async function sanitizeAndForward(request) {
  const body = await request.json();

  // Strip monetizable fields
  NUKE_FIELDS.forEach(field => delete body[field]);

  // Sanitize geo to country-only
  if (body.geo) {
    body.geo = { country: body.geo.country };
  }

  // Forward sanitized request
  return fetch(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(body)
  });
}
```

**Pros**:
- GTM keeps identification capability
- Vendor loses monetization data
- Security team can approve
- Measurable impact (vendor sees 200 OK but empty intent)

**Cons**:
- Requires deployment/maintenance
- Cat-and-mouse with vendor updates
- Some edge cases may need tuning

**Effort**: Moderate (service worker deployment + testing)

---

### Option 3: Network-Level Blocking

**Action**: Block RB2B domains at firewall/DNS level.

**Block List**:
```
# RB2B Infrastructure
ddwl4m2hdecbv.cloudfront.net
s3-us-west-2.amazonaws.com/b2bjsstore
*.execute-api.us-west-2.amazonaws.com
api.rb2b.com

# Related Infrastructure
d362h7pxdteoyk.cloudfront.net
```

**Implementation**:
- Corporate firewall rules
- DNS sinkhole (Pi-hole, corporate DNS)
- Browser extension blocking
- CSP headers (if you control the sites)

**Pros**:
- Works for all users on network
- No script modification needed
- Logs blocked attempts

**Cons**:
- May break sites that legitimately use AWS
- Requires network infrastructure access
- Users can bypass on personal devices

---

### Option 4: Contract/Legal Remediation

**Action**: Negotiate vendor contract amendments or terminate.

**Contract Provisions to Demand**:
1. **Data minimization clause**: Vendor may only collect data necessary for identification
2. **No cross-customer aggregation**: Your visitor data cannot be used to enrich other customers
3. **No third-party data sharing**: Vendor cannot license your audience data
4. **Audit rights**: Right to technical audit of data collection and processing
5. **Defeat device prohibition**: Script must behave identically under all testing conditions

**Legal Considerations**:
- GDPR Article 28 (processor contracts)
- CCPA service provider requirements
- State UDAP claims for defeat devices
- FTC Section 5 for deceptive practices

---

## VERIFICATION PROCEDURES

### Detection Verification

1. **Check for script tags**:
```javascript
// Browser console
document.querySelectorAll('script[src*="cloudfront.net/b/"]')
document.querySelectorAll('script[src*="b2bjsstore"]')
document.querySelectorAll('script[src*="rb2b"]')
```

2. **Check for cookies**:
```javascript
document.cookie.split(';').filter(c => c.includes('reb2b'))
```

3. **Check for globals**:
```javascript
typeof window.reb2b !== 'undefined'
typeof window._reb2b !== 'undefined'
```

4. **Network monitoring**:
```
# DevTools Network tab filters
execute-api
api.rb2b.com
cloudfront.net/b/
b2bjsstore
```

### Remediation Verification

After implementing BLACKOUT Protocol:

1. **Verify identification still works**:
   - Visit site with known identity
   - Confirm CRM/webhook receives lead data
   - Validate company + person resolution

2. **Verify data stripping works**:
   - Capture outbound POST to API Gateway
   - Confirm `url`, `referrer`, `fbp`, `fbc`, `geo.*` are empty/removed
   - Confirm `account`, `rb2b_md5`, `guid` are preserved

3. **Monitor vendor response**:
   - API should return 200 OK
   - Identification should succeed
   - Intent/attribution data should be absent from vendor dashboard

---

## TIMELINE & DISCLOSURE

| Date | Event |
|------|-------|
| 2025-11-09 | Initial discovery of defeat device behavior |
| 2025-11-15 | Vendor notified (no response) |
| 2025-11-25 | Public disclosure of defeat device |
| 2025-11-29 | Infrastructure proof (Retention.com = RB2B) |
| 2025-12-02 | BLACKOUT Protocol playbook released |

---

## LEGAL REFERENCES

### Applicable Regulations

| Regulation | Violation | Article/Section |
|------------|-----------|-----------------|
| **GDPR** | Processing without legal basis | Art. 6 |
| **GDPR** | Inadequate transparency | Art. 13, 14 |
| **GDPR** | Unlawful transfer to US | Chapter V |
| **GDPR** | Undisclosed sub-processors | Art. 28 |
| **FTC Act** | Deceptive trade practices | Section 5 |
| **FTC Act** | Unfair trade practices | 15 U.S.C. § 45(n) |
| **TCPA** | Pre-consent phone data collection | 47 U.S.C. § 227 |
| **State UDAP** | Defeat device deployment | Varies |
| **ePrivacy** | Cookie consent bypass | Art. 5(3) |

### Defeat Device Precedent

**Volkswagen Dieselgate** (2015):
- VW programmed ECUs to detect EPA test conditions
- Vehicles switched to "compliant" mode during testing
- Outside testing, emissions exceeded limits by 40x
- **Result**: $30B+ in fines, criminal prosecutions

**RB2B Parallel**:
- Scripts detect compliance tool signatures
- Tracking disabled during audits
- Full surveillance operates for real users
- **Same strategy, different domain**

---

## APPENDIX A: Complete IOC List

### Domains
```
ddwl4m2hdecbv.cloudfront.net
s3-us-west-2.amazonaws.com
api.rb2b.com
*.execute-api.us-west-2.amazonaws.com
d362h7pxdteoyk.cloudfront.net
cdn.prod.website-files.com (rb2b.com assets)
```

### URL Patterns
```
/b/[A-Z0-9]{12}/
/b2bjsstore/b/
/identify
/company
/event
/b2b
```

### Cookies
```
_reb2bloaded
_reb2bgeo
_reb2btd
rb2b_*
li_md5
```

### Script Strings
```
b2bjsstore
ddwl4m2hdecbv
execute-api
reb2b.js
hubspotDelay
companyCollection
autoTrigger
```

### Bot Detection Signatures (Partial)
```
selenium, puppeteer, playwright, cypress, phantomjs
headlesschrome, webdriver, geckodriver, chromedriver
ahrefssiteaudit, semrushbot, mj12bot, petalbot
beautifulsoup, scrapy, httpx, requests, postman
hubspot, googlebot, bingbot, crawler, spider
```

---

## APPENDIX B: Evidence Chain

| Evidence | Location | Hash |
|----------|----------|------|
| Cognism RB2B deployment | `evidence/rb2b-eu-monitoring/cognism.com/` | - |
| Knock2 white-label proof | `evidence/white-label-network/knock2.ai/` | - |
| Retention.com infrastructure proof | `evidence/retention-com/` | - |
| BTI Advisory | `bti/advisories/2025/BTI-2025-0001.yaml` | - |
| Vendor signatures | `signatures/vendors.json` | - |

---

## APPENDIX C: Related Advisories

- **BTI-2025-0001**: RB2B Defeat Device - Bot Detection and Exfiltration Reversal
- **BTI-2025-0004**: Clay White-Label Distribution
- **BTI-2025-0017**: Knock2 RB2B White-Label
- **BTI-2025-0018**: Retention.com Domain Front Network

---

**BLACKOUT THREAT INTELLIGENCE**
*Trust is good. Enforcement is better.*

---

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓                                   ▓
▓    B L A C K O U T   P R O T O C O L    ▓
▓                                   ▓
▓      THREAT NEUTRALIZED           ▓
▓                                   ▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```
