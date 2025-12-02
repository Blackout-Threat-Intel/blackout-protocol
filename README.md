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
| **[FRAMEWORK/](./FRAMEWORK/)** | Threat models, architecture analysis, remediation playbooks |
| **[KITS/](./KITS/)** | Deployment guides and implementation references |

---

## Latest: RB2B Threat Playbook

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
