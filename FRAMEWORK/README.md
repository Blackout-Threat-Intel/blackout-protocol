# BLACKOUT Framework

## The Doctrine: Zero-Trust GTM

For years, the MarTech industry has operated on a simple premise:

> "Give us access to your users, and we'll tell you who they are."

The price? Your entire audience's behavioral graph.

**BLACKOUT Protocol establishes a new architecture: Zero-Trust GTM.**

---

## The Problem

Modern B2B identification vendors don't just identify visitors. They:

1. **Collect behavioral data** - Every page view, click, scroll
2. **Build intent graphs** - Which pages signal buying intent
3. **Correlate across sites** - Track users across the web
4. **Sell the aggregate** - Your data becomes their product

When you install their script, you're not just getting leads. You're feeding a surveillance network.

---

## The BLACKOUT Solution

Instead of trusting vendors with full access, BLACKOUT intercepts at the network layer:

```
Traditional: Script → Vendor Server → Your Data Monetized
BLACKOUT:    Script → BLOCKED → Synthetic 200 OK
```

The vendor's script runs. It thinks it succeeded. But no data leaves your site.

---

## Philosophy

### 1. Trust Nothing

Every third-party script is a potential exfiltration vector. Assume hostile intent.

### 2. Block at the Edge

Don't rely on CSP headers or backend filters. Block at the browser before data leaves.

### 3. Fail Gracefully

Return synthetic successful responses. Don't break the calling code. Let them think they won.

### 4. Verify Everything

Log every blocked request. Build evidence. Know what you're stopping.

---

## Documentation

- **[METHODOLOGY.md](./METHODOLOGY.md)** - How we distinguish threats from normal MarTech
- **[REMEDIATION-PLAYBOOK.md](./REMEDIATION-PLAYBOOK.md)** - RB2B IOCs and remediation
- **[REMEDIATION-PLAYBOOK-TRENDEMON.md](./REMEDIATION-PLAYBOOK-TRENDEMON.md)** - 6sense/TrenDemon zero-day disclosure
- **[threat-model.md](./threat-model.md)** - What vendors extract and why it matters
- **[architecture.md](./architecture.md)** - How network interception works

---

## Further Reading

- [KITS/](../KITS/) - Deployment guides
- [README](../README.md) - Quick start
