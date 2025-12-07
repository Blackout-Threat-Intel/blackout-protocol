# BLACKOUT Threat Intelligence Methodology

## Core Principle

> **We know where the bodies are buried.**

The MarTech ecosystem is vast. Thousands of vendors, millions of scripts, billions of requests. Most of it is mundane. Some of it is dangerous. The value of threat intelligence is knowing the difference.

---

## The Standard vs. Abnormal Distinction

Every BTI advisory must distinguish between:

| Category | Definition | Example |
|----------|------------|---------|
| **Standard MarTech** | Industry-normal behavior, even if privacy-invasive | GA4 page views, session cookies, UTM tracking |
| **Security Vulnerability** | Exploitable weakness enabling unauthorized access/execution | eval() of user input, XSS vectors, SSRF |
| **Privacy Violation** | Behavior exceeding legal/ethical norms | 760-day cookies, cross-vendor data theft |
| **Evasion Technique** | Deliberate obfuscation to avoid detection | Worker-based fingerprinting, blob URLs |

**Why This Matters**: Security researchers who cry wolf about GA4 get ignored. Analysts who can say "ignore that, but THIS eval() is a genuine ACE vector" get taken seriously.

---

## What We Flag

### Security Vulnerabilities

| Type | Threshold for Flagging |
|------|------------------------|
| Arbitrary Code Execution | Any eval(), Function(), setTimeout(string) with external input |
| Supply Chain | References to known-compromised domains (polyfill.io, etc.) |
| Injection Vectors | innerHTML/outerHTML with user-controlled content |
| Credential Exposure | API keys, tokens, or secrets in client-side code |

### Privacy Violations

| Type | Threshold for Flagging |
|------|------------------------|
| Cookie Retention | Exceeds ICO 13-month guidance (industry accepted: ~400 days max) |
| Cross-Vendor Data Sharing | Reading cookies set by other vendors without authorization |
| PII Exfiltration | Phone, email, address sent without explicit consent |
| Fingerprinting | Only if using evasion techniques (workers, blobs, CSP bypass) |

### Evasion Techniques

| Type | Threshold for Flagging |
|------|------------------------|
| Blob/Worker Fingerprinting | Fingerprinting hidden in ephemeral contexts |
| Debug Stripping | Removing vendor-specific debug params (not UTM/gclid) |
| Obfuscation | Base64/encoding specifically to evade content inspection |
| Timing Attacks | Delayed execution to avoid page-load scanners |

---

## What We DON'T Flag

### Standard Marketing Telemetry

| Behavior | Why It's Normal |
|----------|-----------------|
| Page view tracking | Every analytics tool does this |
| Session cookies | Required for basic functionality |
| UTM parameter handling | Industry-standard attribution |
| dataLayer.push() | Standard GTM integration |
| Conversion pixels | Standard ad measurement |

### Standard Data Collection

| Behavior | Why It's Normal |
|----------|-----------------|
| IP-based geolocation | Universal practice |
| User agent collection | Standard browser fingerprinting |
| Referrer tracking | Built into HTTP protocol |
| First-party cookies < 13mo | Within regulatory guidance |

### Standard Integrations

| Behavior | Why It's Normal |
|----------|-----------------|
| GA4/GTM integration | Industry standard |
| CRM webhook calls | Expected behavior |
| Form submission tracking | Core functionality |
| A/B test assignment | Standard personalization |

---

## Evidence Standards

### For Security Vulnerabilities

Required:
- [ ] Specific code location (file, line number)
- [ ] Proof of exploitability (can external input reach the sink?)
- [ ] CVSS estimate with vector string
- [ ] Reproduction steps

### For Privacy Violations

Required:
- [ ] Specific regulatory threshold exceeded (cite ICO, GDPR article, etc.)
- [ ] Evidence of the violation (cookie expiry, HAR capture, decoded payload)
- [ ] Comparison to industry norm

### For Evasion Techniques

Required:
- [ ] Explanation of what detection is being evaded
- [ ] Evidence the technique is deliberate (not incidental)
- [ ] Comparison to standard implementation

---

## Advisory Structure

Each BTI advisory should include:

1. **Methodology Note** - Explicitly state what's in scope and what's standard
2. **"Why This Matters"** - For each finding, explain what crosses the line
3. **Clear IOC Separation** - Don't list standard endpoints as IOCs
4. **Regulatory Citations** - Link violations to specific statutes/guidance

### Template Language

For findings:
> **Why This Matters**: [Standard practice] is normal. [This specific behavior] crosses the line because [specific reason].

For IOCs:
> *Note: Standard telemetry endpoints (pageview, settings) are not listed as IOCs.*

For cookies:
> *Note: Session cookies are standard and not flagged.*

---

## Red Lines

Things we ALWAYS flag regardless of industry prevalence:

1. **eval() of external input** - No legitimate use case
2. **Known compromised domains** - polyfill.io, etc.
3. **Cross-vendor cookie theft** - Reading another vendor's cookies
4. **PII without consent** - Phone, email, address exfiltration
5. **Infinite retention** - localStorage with no expiry for tracking

---

## Credibility Framework

Our advisories must withstand scrutiny from:

| Audience | Their Question | Our Answer |
|----------|----------------|------------|
| Security Teams | "Is this actually exploitable?" | Yes, with specific attack scenarios |
| Legal/Compliance | "What regulation does this violate?" | Specific article citations |
| Marketing Teams | "Isn't this just normal tracking?" | No, and here's why it's different |
| Vendors | "This is industry standard" | No, here's the industry standard, and here's what you're doing |

---

## Examples

### FLAGGED: eval() in TrenDemon

```javascript
eval(trackingCodeToEval)  // FLAGGED: ACE vulnerability
dataLayer.push(...)       // NOT FLAGGED: Standard GTM
```

**Why**: The eval() executes arbitrary customer-provided code. The dataLayer.push is standard GA4 integration.

### NOT FLAGGED: UTM Parameter Handling

```javascript
["utm_source", "gclid", ...].forEach(n => url.delete(n))
```

**Why**: URL canonicalization is industry standard. Every analytics tool does this.

### FLAGGED: 760-Day Cookies

```javascript
document.cookie = "trd_vid=xxx; max-age=65664000"  // 760 days
```

**Why**: ICO guidance recommends 13 months maximum. This exceeds by 2.4x.

### NOT FLAGGED: 30-Day Session Cookie

```javascript
document.cookie = "session_id=xxx; max-age=2592000"  // 30 days
```

**Why**: Within industry norms for session management.

---

## Maintenance

This methodology should be reviewed when:

- New regulatory guidance is published (ICO, EDPB, FTC)
- Industry standards shift materially
- We receive valid criticism of a finding
- New evasion techniques emerge

---

*Last updated: 2025-12-07*
*Maintainer: Blackout Threat Intelligence*
