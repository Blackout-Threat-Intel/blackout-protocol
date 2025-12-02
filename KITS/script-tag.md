# Script Tag Deployment

The fastest way to deploy BLACKOUT Protocol.

---

## Basic Installation

Add this line to your HTML `<head>`, **before any tracking scripts**:

```html
<script src="https://unpkg.com/blackout-protocol/extension/blackout.bundle.js" data-auto-init></script>
```

That's it. BLACKOUT is now active.

---

## With Debug Logging

To see what's being blocked:

```html
<script
  src="https://unpkg.com/blackout-protocol/extension/blackout.bundle.js"
  data-auto-init
  data-debug
></script>
```

Open DevTools Console to see:
```
[BLACKOUT] fetch BLOCKED: https://api.rb2b.com/collect
[BLACKOUT] sendBeacon BLOCKED: https://track.rb2b.com/event
```

---

## Self-Hosted

For production, host the bundle yourself:

1. Download `blackout.bundle.js` from the [releases](https://github.com/Blackout-Threat-Intel/blackout-protocol/releases)
2. Upload to your CDN or static assets
3. Reference your hosted version:

```html
<script src="/assets/js/blackout.bundle.js" data-auto-init></script>
```

---

## Programmatic Initialization

For more control, skip `data-auto-init` and initialize manually:

```html
<script src="https://unpkg.com/blackout-protocol/extension/blackout.bundle.js"></script>
<script>
  Blackout.initBlackout({
    debug: true,
    additionalPatterns: ['*.badtracker.com'],
    onBlock: function(result) {
      console.log('Blocked request to:', result.url)
      // Send to your own analytics
    }
  })
</script>
```

---

## Placement Order

BLACKOUT must load **before** tracking scripts to intercept them:

```html
<head>
  <!-- BLACKOUT first -->
  <script src="blackout.bundle.js" data-auto-init></script>

  <!-- Then tracking scripts (will be intercepted) -->
  <script src="https://cdn.rb2b.com/pixel.js"></script>
</head>
```

If BLACKOUT loads after, requests may have already been sent.

---

## Subresource Integrity (SRI)

For security-conscious deployments:

```html
<script
  src="https://unpkg.com/blackout-protocol@1.0.0/extension/blackout.bundle.js"
  integrity="sha384-[hash]"
  crossorigin="anonymous"
  data-auto-init
></script>
```

Generate the hash from the specific version you're using.

---

## Verify It's Working

After loading, run in DevTools Console:

```javascript
Blackout.getStats()
// { active: true, blockedCount: 0, patterns: 18, version: '1.0.0' }

Blackout.wouldBlock('https://api.rb2b.com/collect')
// true

Blackout.wouldBlock('https://example.com')
// false
```
