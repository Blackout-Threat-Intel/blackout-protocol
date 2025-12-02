# Deployment Kits

Quick-start guides for deploying BLACKOUT Protocol in your environment.

---

## Choose Your Deployment

| Method | Best For | Setup Time |
|--------|----------|------------|
| [Script Tag](./script-tag.md) | Fastest start, any site | 2 minutes |
| [GTM Deploy](./gtm-deploy.md) | Existing GTM setup | 5 minutes |
| [Chrome Extension](./extension.md) | Personal use, testing | 3 minutes |
| [npm Package](./npm-package.md) | Build integration | 10 minutes |

---

## Quick Start (30 seconds)

Add this before any tracking scripts:

```html
<script src="https://unpkg.com/blackout-protocol/extension/blackout.bundle.js" data-auto-init></script>
```

Done. All RB2B traffic is now blocked.

---

## Verification

After deployment, open browser DevTools Console. You should see:

```
██████╗ ██╗      █████╗  ██████╗██╗  ██╗ ██████╗ ██╗   ██╗████████╗
...
                    THREAT NEUTRALIZED v1.0.0

[BLACKOUT] v1.0.0 initialized | 18 patterns loaded
```

If tracking scripts attempt requests, you'll see:
```
[BLACKOUT] fetch BLOCKED: https://api.rb2b.com/collect
```

---

## Examples

Working HTML examples in [examples/](./examples/):

- `minimal.html` - Simplest possible deployment
- `with-callbacks.html` - Custom block handling
- `extended-patterns.html` - Adding custom domains

---

## Support

- **Issues:** [GitHub Issues](https://github.com/Blackout-Threat-Intel/blackout-protocol/issues)
- **Framework:** [../FRAMEWORK/](../FRAMEWORK/) for methodology
