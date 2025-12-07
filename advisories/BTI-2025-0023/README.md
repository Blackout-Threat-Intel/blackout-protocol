# BTI-2025-0023: 6sense Surveillance Stack

> **CRITICAL** | BTSS Score: 9.2/10 | Cross-Vendor Cookie Harvesting, PII Deanonymization, CMP Defeat Device

---

## Executive Summary

**6sense** deploys a comprehensive surveillance infrastructure that triggers on a single page load:

| Finding | Severity | Description |
|---------|----------|-------------|
| **PII Double-Exfil** | CRITICAL | Epsilon returns phone/address, beacon re-transmits to all 6sense customers |
| **760-Day Cookies** | HIGH | 6suuid cookie exceeds ICO guidance by 2.4x |
| **Ketch CMP Bypass** | HIGH | Harvests Marketo cookies BEFORE consent |
| **13-Host Cookie Sync** | HIGH | Cross-vendor identity aggregation |
| **TrenDemon Integration** | CRITICAL | Loads eval() ACE vectors (see BTI-2025-0025) |

---

## Technical Analysis

### 1. PII Deanonymization Chain

6sense's Epsilon endpoints return full company and contact PII:

```
GET /v3/company/details
Host: eps.6sc.co

Response: {
  "company": "[COMPANY_NAME]",
  "domain": "[COMPANY_DOMAIN]",
  "phone": "[PHONE_NUMBER]",      // CRITICAL PII
  "address": "[STREET_ADDRESS]",  // CRITICAL PII
  "city": "[CITY]",
  "state": "[STATE]",
  "country": "[COUNTRY]"
}
```

**Double-Exfiltration**: The beacon at `b.6sc.co` re-transmits this ENTIRE response in `q.metadata.ores`, making PII available to all 6sense customers for 760 days.

---

### 2. Ketch CMP Cookie Harvesting

Before showing the consent banner, Ketch harvests existing cookies:

```http
POST /web/v3/consent/6_sense/get HTTP/2
Host: global.ketchcdn.com

{
  "identities": {
    "_mkto_trk": "id:[MARKETO_ID]&token:[SESSION]",
    "swb_default_property": "[KETCH_UUID]"
  }
}
```

**Violation**: Cookie harvesting occurs with `hasConsent=false`.

---

### 3. Dark Pattern UI

The Ketch reject button:
- **Selector length**: 2,847 characters
- **DOM depth**: 14 levels
- **CSS classes**: 47
- **Clicks to accept**: 1
- **Clicks to reject**: 3

---

## Indicators of Compromise (IOCs)

### Domains

| Domain | Type | Risk |
|--------|------|------|
| `eps.6sc.co` | API | CRITICAL |
| `b.6sc.co` | Beacon | CRITICAL |
| `j.6sc.co` | CDN | HIGH |
| `epsilon.6sense.com` | API | CRITICAL |
| `global.ketchcdn.com` | CMP | HIGH |

### Cookies

| Cookie | Lifetime | Purpose |
|--------|----------|---------|
| `6suuid` | 760 days | 6sense fingerprint |
| `_6sft` | 760 days | First touch |

### Detection Patterns

```
# Network IOCs
eps\.6sc\.co/v3/company
b\.6sc\.co.*metadata\.ores
ketchcdn\.com.*_mkto_trk
```

---

## Remediation

### Blocklist (uBlock/Pi-hole)

```
||6sc.co^
||eps.6sc.co^
||b.6sc.co^
||j.6sc.co^
||epsilon.6sense.com^
||global.ketchcdn.com^
||cdn.ketchjs.com^
```

### For Website Owners

| Priority | Action |
|----------|--------|
| **IMMEDIATE** | Remove 6sense tag |
| **IMMEDIATE** | Block 6sc.co at firewall |
| Short-term | Audit Marketo for cookie leakage |

---

## Legal Implications

| Statute | Violation |
|---------|-----------|
| GDPR Art. 5(1)(e) | 760-day retention exceeds storage limitation |
| GDPR Art. 13/14 | Undisclosed cross-vendor data sharing |
| CCPA 1798.100 | PII sharing without adequate disclosure |
| ePrivacy Art. 5(3) | Pre-consent cookie harvesting |

---

## Related Advisories

- **[BTI-2025-0025](../BTI-2025-0025/)**: TrenDemon eval() ACE + polyfill.io supply chain
- **BTI-2025-0022**: Ketch CMP defeat device (pending)

---

## Metadata

| Field | Value |
|-------|-------|
| Advisory ID | BTI-2025-0023 |
| Created | 2025-12-03 |
| Updated | 2025-12-07 |
| Author | Blackout Threat Intelligence |
| Status | Active |

---

*Machine-readable version: [advisory.yaml](./advisory.yaml)*
