# GREYOUT MODE

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓                                        ▓
▓   G R E Y O U T   M O D E              ▓
▓                                        ▓
▓   GTM gets the lead.                   ▓
▓   Vendor gets noise.                   ▓
▓                                        ▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

**Keep RB2B identification working. Strip the data they monetize.**

Unlike full BLACKOUT mode (which blocks everything), Greyout mode **selectively sanitizes** outbound requests—preserving the fields needed for visitor identification while stripping intent, attribution, and cross-site tracking data.

---

## How It Works

Greyout intercepts `fetch()`, `XMLHttpRequest`, and `sendBeacon()` calls to RB2B's API endpoints. Before the request leaves your browser, it:

1. **KEEPS** identification fields (account, hashes, session)
2. **STRIPS** monetizable fields (URL, referrer, pixels, geo precision)
3. **FORWARDS** the sanitized request to RB2B

RB2B receives the request, returns identity data, and your GTM team gets the lead. But RB2B loses:
- Page-level intent (`/pricing` vs `/careers`)
- Traffic attribution (where visitors came from)
- Cross-site tracking (Facebook, HubSpot correlation)
- Precise location (only country preserved)

---

## Installation

### Chrome Extension (Sideload)

1. Download or clone this folder
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `GREYOUT` folder

The extension will show "ON" badge when active.

### Verify It's Working

1. Open DevTools → Console
2. Look for `[GREYOUT] GREYOUT MODE ACTIVE`
3. Visit a site with RB2B installed
4. Watch for `[GREYOUT] Intercepted fetch to:` messages
5. See `[GREYOUT] STRIPPED:` for each sanitized field

---

## What Gets Stripped

### KEEP (Identification Works)

| Field | Purpose |
|-------|---------|
| `account` | Routes data to your RB2B account |
| `rb2b_md5` | Identity hash for person lookup |
| `li_md5` | LinkedIn correlation hash |
| `guid` | Visitor deduplication |
| `session_id` | Groups page views |

### NUKE (Monetization Blocked)

| Field | What RB2B Loses |
|-------|-----------------|
| `url` | Page-level intent |
| `title` | Content context |
| `referrer` | Traffic attribution |
| `fbp`, `fbc` | Facebook cross-site tracking |
| `hs_hubspotutk` | HubSpot ecosystem correlation |
| `utm_*` | Campaign attribution |
| `geo.*` | Precise location (country kept) |

---

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Chrome MV3 extension manifest |
| `greyout-core.js` | Main interception logic (injected into page) |
| `greyout-injector.js` | Content script that injects core.js |
| `background.js` | Service worker for badge updates |
| `popup.html/js` | Extension popup UI |

---

## Customization

Edit `greyout-core.js` to modify:

```javascript
const CONFIG = {
  debug: true,  // Set false to disable console logging

  // Add more domains to intercept
  targetDomains: [
    'execute-api.us-west-2.amazonaws.com',
    // Add others...
  ],

  // Add more fields to preserve
  keepFields: [
    'account',
    'rb2b_md5',
    // Add custom fields...
  ],

  // Add more fields to strip
  nukeFields: [
    'url',
    'title',
    // Add custom fields...
  ],
};
```

---

## Enterprise Deployment

For organization-wide deployment:

### Option 1: Chrome Enterprise Policy

Deploy via `ExtensionInstallForcelist` policy:

```json
{
  "ExtensionInstallForcelist": [
    "EXTENSION_ID;https://your-update-server/greyout.xml"
  ]
}
```

### Option 2: Network Proxy

Deploy the sanitization logic at the network layer:

```nginx
location ~ ^/proxy/rb2b {
    proxy_pass https://execute-api.us-west-2.amazonaws.com;
    # Add body filter to strip fields
}
```

### Option 3: GTM Custom Template

Wrap RB2B in a custom template that sanitizes before sending:

```javascript
// In GTM Custom JavaScript variable
const sanitize = (data) => {
  delete data.url;
  delete data.referrer;
  // ... etc
  return data;
};
```

---

## Verification

### Check Console Logs

```
[GREYOUT] GREYOUT MODE ACTIVE
[GREYOUT] Monitoring domains: ["execute-api.us-west-2.amazonaws.com", ...]
[GREYOUT] KEEP fields: ["account", "rb2b_md5", ...]
[GREYOUT] NUKE fields: ["url", "title", ...]
[GREYOUT] ─────────────────────────────────────
[GREYOUT] GTM gets the lead. Vendor gets noise.
[GREYOUT] ─────────────────────────────────────
[GREYOUT] Intercepted fetch to: https://xyz.execute-api.us-west-2.amazonaws.com/b2b
[GREYOUT] STRIPPED: url → https://example.com/pricing?utm_source=goo...
[GREYOUT] STRIPPED: referrer → https://google.com/search?q=...
[GREYOUT] STRIPPED: fbp → fb.1.1234567890.987654321...
[GREYOUT] Sanitized payload: stripped 6 monetizable fields
[GREYOUT] Request body sanitized
```

### Verify in Network Tab

1. Open DevTools → Network
2. Find requests to `execute-api.amazonaws.com`
3. Check Request Payload
4. Confirm `url`, `referrer`, `fbp` are missing
5. Confirm `account`, `rb2b_md5`, `guid` are present

---

## FAQ

**Q: Will this break RB2B identification?**
A: No. The `KEEP` fields are sufficient for IP-to-Company and person identification. You'll still get leads.

**Q: What does RB2B see?**
A: They receive the request with identity fields intact but intent/attribution fields empty or missing. Their API returns 200 OK with identity data.

**Q: Is this detectable by RB2B?**
A: Yes, they could detect sanitized requests. This is not evasion—it's enforcement. You're explicitly limiting what data you share.

**Q: Can RB2B work around this?**
A: They could change field names or obfuscate payloads. This is cat-and-mouse. BLACKOUT will update signatures as needed.

---

## License

MIT License - See [LICENSE](../LICENSE)

---

```
▓▓ BLACKOUT PROTOCOL ▓▓
▓▓ GREYOUT MODE ▓▓
█ THREAT NEUTRALIZED █
```
