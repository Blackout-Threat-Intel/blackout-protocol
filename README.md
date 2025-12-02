# BLACKOUT Protocol

```
██████╗ ██╗      █████╗  ██████╗██╗  ██╗ ██████╗ ██╗   ██╗████████╗
██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝██╔═══██╗██║   ██║╚══██╔══╝
██████╔╝██║     ███████║██║     █████╔╝ ██║   ██║██║   ██║   ██║
██╔══██╗██║     ██╔══██║██║     ██╔═██╗ ██║   ██║██║   ██║   ██║
██████╔╝███████╗██║  ██║╚██████╗██║  ██╗╚██████╔╝╚██████╔╝   ██║
╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝

                    ▓▓ THREAT NEUTRALIZED ▓▓
```

**Zero-trust network interception for blocking surveillance trackers.**

For too long, the "tax" for identifying a visitor on your website has been your entire audience's behavioral graph.

They give you a name.
They take... everything else.

**We just reversed the flow.**

---

## What It Does

BLACKOUT Protocol intercepts all outbound network requests at the browser level and blocks surveillance trackers from ever reaching their servers. Synthetic `200 OK` responses ensure your site doesn't break.

```
┌─────────────────────────────────────────────────────────┐
│  BEFORE BLACKOUT                                        │
│  ═══════════════                                        │
│  Your Site → Vendor → Identity + Behavioral Graph       │
│              (they keep everything)                     │
├─────────────────────────────────────────────────────────┤
│  AFTER BLACKOUT                                         │
│  ══════════════                                         │
│  Your Site → BLACKOUT → Vendor                          │
│              ▓▓ BLOCKED ▓▓                              │
│                                                         │
│  Surveillance: ████ SEVERED                             │
│  Your Users:   INVISIBLE                                │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Option 1: Script Tag (Fastest)

```html
<script src="https://unpkg.com/blackout-protocol/extension/blackout.bundle.js" data-auto-init></script>
```

### Option 2: npm

```bash
npm install blackout-protocol
```

```typescript
import { initBlackout, getStats } from 'blackout-protocol'

initBlackout({ debug: true })

// Check what's being blocked
console.log(getStats())
// { active: true, blockedCount: 42, patterns: 18, version: '1.0.0' }
```

### Option 3: Chrome Extension (Sideload)

1. Download this repo
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension/` folder

---

## Kill List

These domains are blocked by default:

| Domain | Status |
|--------|--------|
| `rb2b.com` | BLOCKED |
| `*.rb2b.com` | BLOCKED |
| `api.rb2b.com` | BLOCKED |
| `cdn.rb2b.com` | BLOCKED |
| `track.rb2b.com` | BLOCKED |
| `pixel.rb2b.com` | BLOCKED |
| `events.rb2b.com` | BLOCKED |
| `data.rb2b.com` | BLOCKED |
| `collect.rb2b.com` | BLOCKED |
| `rb2b.io` | BLOCKED |
| `*.rb2b.io` | BLOCKED |
| `rb2b.net` | BLOCKED |
| `*.rb2b.net` | BLOCKED |
| `ddwl4m2hdecbv.cloudfront.net` | BLOCKED |

**Zero traffic escaped. Synthetic 200 OK returned.**

---

## API Reference

### `initBlackout(config?)`

Initialize BLACKOUT and start intercepting requests.

```typescript
initBlackout({
  debug: true,                        // Log blocked requests
  additionalPatterns: ['*.evil.com'], // Extend kill list
  onBlock: (result) => {              // Callback on block
    console.log('Blocked:', result.url)
  }
})
```

### `disableBlackout()`

Restore original browser APIs.

### `getStats()`

```typescript
{
  active: boolean      // Is BLACKOUT running?
  blockedCount: number // Total requests blocked
  patterns: number     // Kill list size
  version: string      // Library version
}
```

### `wouldBlock(url)`

Test if a URL would be blocked without making a request.

```typescript
wouldBlock('https://api.rb2b.com/collect') // true
wouldBlock('https://example.com')          // false
```

### `addPatterns(patterns)`

Extend the kill list at runtime.

```typescript
addPatterns(['*.newtracker.io', 'spy.example.com'])
```

### `getBlockLog()`

Get full history of blocked requests.

```typescript
[
  {
    timestamp: 1701234567890,
    url: 'https://api.rb2b.com/collect',
    type: 'fetch',
    matchedPattern: '*.rb2b.com'
  }
]
```

---

## How It Works

BLACKOUT shims three browser APIs at the network layer:

1. **`fetch()`** - Modern HTTP requests
2. **`XMLHttpRequest`** - Legacy AJAX
3. **`navigator.sendBeacon()`** - Analytics beacons

Every outbound request is evaluated against the kill list. Matches get blocked and receive a synthetic successful response. The calling code never knows the request was intercepted.

```
Request → PolicyEngine.evaluate(url)
              │
              ├─ ALLOW → Original API
              │
              └─ BLOCK → MockFactory.createResponse()
                         └─ { status: 200, body: { success: true } }
```

---

## Architecture

```
blackout-protocol/
├── src/
│   ├── index.ts           # Public API
│   ├── types.ts           # TypeScript definitions
│   ├── policy-engine.ts   # Kill list + pattern matching
│   ├── network-sniffer.ts # fetch/XHR/beacon shims
│   ├── mock-factory.ts    # Synthetic response generator
│   └── cli.ts             # Terminal display
├── extension/
│   ├── manifest.json      # Chrome MV3 manifest
│   ├── content-loader.js  # Injection script
│   └── blackout.bundle.js # Compiled bundle
├── FRAMEWORK/             # Methodology documentation
├── KITS/                  # Deployment guides
└── ASSETS/                # Branding
```

---

## CLI

```bash
npx blackout-protocol           # Show status
npx blackout-protocol kill      # Show kill confirmation
npx blackout-protocol help      # Usage info
```

Output:
```
  BLACKOUT v1.0.0

  ██ THREAT DETECTED ██
  RB2B SURVEILLANCE
  ▓▓ NEUTRALIZED ▓▓

  KILL LIST:

  ░ rb2b.com                     BLOCKED
  ░ *.rb2b.com                   BLOCKED
  ░ api.rb2b.com                 BLOCKED
  ...

  Zero traffic escaped.
  Synthetic 200 OK returned.
```

---

## Documentation

- **[FRAMEWORK/](./FRAMEWORK/)** - The Doctrine: Zero-Trust GTM methodology
- **[KITS/](./KITS/)** - Deployment guides for GTM, script tags, extensions

---

## Trust is Good. Enforcement is Better.

This is a new architecture for GTM Security.

**Your users deserve to be invisible.**

---

## License

MIT License - See [LICENSE](./LICENSE)

---

<p align="center">
  <strong>▓▓ BLACKOUT PROTOCOL ▓▓</strong><br>
  <em>THREAT NEUTRALIZED</em>
</p>
