# BTI-YYYY-NNNN: [Vendor Name]

> **[SEVERITY]** | BTSS Score: X.X/10 | [One-line summary of key findings]

---

## Methodology Note

> This advisory documents **security vulnerabilities and privacy violations that exceed industry norms**. Standard marketing telemetry (page views, session cookies, analytics integrations) is not flagged unless it exhibits abnormal or malicious behavior.
>
> [Vendor] performs legitimate [function] functions. This advisory focuses exclusively on:
> - **Security vulnerabilities** (if applicable)
> - **Privacy violations** (if applicable)
> - **Evasion techniques** (if applicable)

---

## Executive Summary

**[Vendor]** is a [type of platform] deployed on [scope/prevalence].

### Critical Findings

| Finding | Severity | Description |
|---------|----------|-------------|
| **[Finding 1]** | CRITICAL/HIGH/MEDIUM | [Brief description] |
| **[Finding 2]** | CRITICAL/HIGH/MEDIUM | [Brief description] |

---

## Technical Analysis

### 1. [Finding Title]

[Technical description of the vulnerability/violation]

**Why This Matters**: [Explain what's normal vs. what crosses the line]

```javascript
// Code evidence with annotations
[code]  // <-- [Annotation explaining the issue]
[code]  // <-- [This part is normal - for contrast]
```

[Additional context: trigger conditions, scope, impact]

---

### 2. [Finding Title]

[Repeat pattern for each finding]

**Why This Matters**: [Standard practice] is normal. [This specific behavior] crosses the line because [specific reason].

---

## Indicators of Compromise (IOCs)

### File Hashes (SHA256)

| File | Hash | Size |
|------|------|------|
| `[filename]` | `[hash]` | [size] |

### Domains

| Domain | Risk | Reason |
|--------|------|--------|
| `[domain]` | CRITICAL | [Why it's flagged] |

### Security-Relevant Endpoints

| Endpoint | Concern |
|----------|---------|
| `[endpoint]` | [Specific security/privacy issue] |

*Note: Standard telemetry endpoints (pageview, settings) are not listed as IOCs.*

### Cookies of Concern

| Cookie | Concern |
|--------|---------|
| `[cookie]` | [Specific issue: retention, stolen data, etc.] |

*Note: Session cookies are standard and not flagged.*

### Detection Signatures

| Pattern | Indicates |
|---------|-----------|
| `[regex/string]` | [What it detects] |

---

## Legal Implications

| Statute | Violation |
|---------|-----------|
| [Regulation Article] | [Specific violation] |

---

## Remediation

### For Website Owners

| Priority | Action |
|----------|--------|
| **IMMEDIATE** | [Action] |
| Short-term | [Action] |

### For Visitors

| Priority | Action |
|----------|--------|
| **IMMEDIATE** | [Action] |

### Blocklist

```
||[domain]^
```

---

## References

- [Link to external research]
- [Link to regulatory guidance]

---

## Metadata

| Field | Value |
|-------|-------|
| Advisory ID | BTI-YYYY-NNNN |
| Created | YYYY-MM-DD |
| Updated | YYYY-MM-DD |
| Author | Blackout Threat Intelligence |
| Status | Active/Draft/Superseded |
| Related | [Related advisory IDs] |

---

*Machine-readable version: [advisory.yaml](./advisory.yaml)*
