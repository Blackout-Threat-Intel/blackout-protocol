# BLACKOUT Protocol

```
██████╗ ██╗      █████╗  ██████╗██╗  ██╗ ██████╗ ██╗   ██╗████████╗
██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝██╔═══██╗██║   ██║╚══██╔══╝
██████╔╝██║     ███████║██║     █████╔╝ ██║   ██║██║   ██║   ██║
██╔══██╗██║     ██╔══██║██║     ██╔═██╗ ██║   ██║██║   ██║   ██║
██████╔╝███████╗██║  ██║╚██████╗██║  ██╗╚██████╔╝╚██████╔╝   ██║
╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝

              ▓▓ THREAT INTELLIGENCE HUB ▓▓
```

**Public repository for GTM security research, threat playbooks, and vendor intelligence.**

This is the open-source arm of [BLACKOUT](https://www.deployblackout.com) — CrowdStrike for your GTM Stack.

---

## What's Here

This repository contains **technical findings, IOCs, and remediation playbooks** for threats discovered in the marketing vendor ecosystem. Everything here is public. No gate. No email.

| Directory | Contents |
|-----------|----------|
| **[advisories/](./advisories/)** | BTI advisory records (YAML + README per advisory) |
| **[FRAMEWORK/](./FRAMEWORK/)** | Threat models, architecture analysis, remediation playbooks |
| **[KITS/](./KITS/)** | Deployment guides and implementation references |

---

## Active Threats

| Vendor | BTI ID | Severity | Status |
|--------|--------|----------|--------|
| **6sense** | [BTI-2025-0023](./advisories/BTI-2025-0023/) | CRITICAL | [Playbook](./FRAMEWORK/REMEDIATION-PLAYBOOK-TRENDEMON.md) |
| **TrenDemon** | [BTI-2025-0025](./advisories/BTI-2025-0025/) | CRITICAL | [Playbook](./FRAMEWORK/REMEDIATION-PLAYBOOK-TRENDEMON.md) |
| RB2B (Retention.com) | — | CRITICAL | [Playbook](./FRAMEWORK/REMEDIATION-PLAYBOOK.md) |

---

## NEW: 6sense/TrenDemon Zero-Day Disclosure (2025-12-04)

**[FRAMEWORK/REMEDIATION-PLAYBOOK-TRENDEMON.md](./FRAMEWORK/REMEDIATION-PLAYBOOK-TRENDEMON.md)**

**Five zero-day vulnerabilities** discovered in the 6sense/TrenDemon ABM stack:

| Codename | Vulnerability | CVSS | Impact |
|----------|---------------|------|--------|
| **DemonScript** | eval() arbitrary code execution | 9.8 | Any TrenDemon customer can execute JS on your visitors |
| **PollyWannaCrack** | polyfill.io supply chain | 10.0 | Chinese malware loaded on older browsers |
| **ZeroSense** | Cross-customer PII cache | 9.1 | Phone/address cached 760 days across ALL 6sense customers |
| **RollCredits** | Video completion ACE | 9.8 | Wistia/Brightcove videos trigger eval() |
| **MaCook'd** | Marketo cookie theft | 7.5 | _mkto_trk Base64'd and exfiltrated |

### Verify It Yourself

```bash
# Check TrenDemon SDK for eval() vectors
curl -s "https://assets.trendemon.com/tag/trends.min.js" | grep -o "eval(" | wc -l
# Should return: 6

# Check for polyfill.io reference
curl -s "https://assets.trendemon.com/tag/trends.min.js" | grep -o "polyfill.io" | wc -l
# Should return: 1+
```

[Read the full playbook →](./FRAMEWORK/REMEDIATION-PLAYBOOK-TRENDEMON.md)

---

## RB2B Threat Playbook

**[FRAMEWORK/REMEDIATION-PLAYBOOK.md](./FRAMEWORK/REMEDIATION-PLAYBOOK.md)**

Complete analysis of RB2B (Retention.com) visitor deanonymization infrastructure:

- **IOCs** — Domains, cookies, scripts, API endpoints
- **Defeat Device Evidence** — The devil's regex, 45+ bot signatures, browser fingerprint checks
- **Keep vs Nuke Fields** — What's needed for identification vs. what they monetize
- **Architecture Maps** — CloudFront → S3 → API Gateway exfiltration path
- **Remediation Options** — From removal to selective data stripping
- **Legal References** — GDPR, FTC, TCPA, defeat device precedent

### The Devil's Regex

```javascript
/bot\b|spider|crawler|scraper|fetcher|monitor|checker|validator|analyzer|automated|headless|phantom|selenium|webdriver|puppeteer|playwright/i
```

They detect `monitor`, `checker`, `validator`, `analyzer`. Your audit shows clean. Real users get full surveillance.

[Read the full playbook →](./FRAMEWORK/REMEDIATION-PLAYBOOK.md)

---

## Verify Our Claims

We encourage independent verification. If we're wrong, file an issue.

1. Install RB2B on a test page
2. Open DevTools → Network tab
3. Filter by `execute-api` or `cloudfront.net/b/`
4. Observe the payload fields
5. Compare to our Keep vs Nuke list

---

## About BLACKOUT

**BLACKOUT** is agentless, outside-in GTM stack security.

- Map what's running
- Prove what it does
- Give you the evidence

Every day without visibility is another day of regulatory exposure.

**Website:** [deployblackout.com](https://www.deployblackout.com)

---

## Contributing

Found a new threat? Have evidence to add?

- **File an issue** with IOCs and evidence
- **Submit a PR** with documented findings
- **Reach out** via [deployblackout.com](https://www.deployblackout.com)

All submissions should include:
- Reproducible evidence (HAR files, screenshots, decoded payloads)
- IOC list (domains, cookies, scripts)
- Timeline of discovery

---

## License

MIT License - See [LICENSE](./LICENSE)

---

<p align="center">
  <strong>▓▓ BLACKOUT ▓▓</strong><br>
  <em>Trust is good. Enforcement is better.</em><br><br>
  <a href="https://www.deployblackout.com">deployblackout.com</a>
</p>
