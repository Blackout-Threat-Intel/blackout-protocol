# Google Tag Manager Deployment

Deploy BLACKOUT Protocol through GTM for centralized control.

---

## Method 1: Custom HTML Tag (Recommended)

### Step 1: Create New Tag

1. Go to GTM → Tags → New
2. Choose **Custom HTML**
3. Name it: `BLACKOUT Protocol`

### Step 2: Paste Code

```html
<script>
(function() {
  // Load BLACKOUT bundle
  var script = document.createElement('script');
  script.src = 'https://unpkg.com/blackout-protocol/extension/blackout.bundle.js';
  script.onload = function() {
    Blackout.initBlackout({
      debug: false, // Set true to see blocked requests in console
      onBlock: function(result) {
        // Optional: Push to dataLayer for GTM visibility
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'blackout_block',
          blockedUrl: result.url,
          matchedPattern: result.matchedPattern
        });
      }
    });
  };
  document.head.appendChild(script);
})();
</script>
```

### Step 3: Set Trigger

1. Click **Triggering**
2. Choose **All Pages** with trigger type **Page View**
3. Set priority to fire **before** other tags:
   - Tag firing priority: `9999` (higher = fires first)

### Step 4: Test & Publish

1. Use GTM Preview mode to verify
2. Check Console for BLACKOUT banner
3. Publish when confirmed

---

## Method 2: External Script Tag

If you prefer not to inline JavaScript:

### Tag Configuration

1. Tag Type: **Custom HTML**
2. HTML:

```html
<script src="https://unpkg.com/blackout-protocol/extension/blackout.bundle.js" data-auto-init data-debug></script>
```

3. Trigger: **All Pages - Page View**
4. Tag firing priority: `9999`

---

## Firing Order

BLACKOUT must fire **before** tracking tags:

| Tag | Priority |
|-----|----------|
| BLACKOUT Protocol | 9999 |
| Google Analytics | (default) |
| RB2B Pixel | (default) |
| Facebook Pixel | (default) |

Higher priority numbers fire first in GTM.

---

## Verify in GTM Preview

1. Enable Preview mode
2. Load your site
3. In the Tags tab, verify firing order:
   - BLACKOUT should show first
4. In Console, look for:
   ```
   [BLACKOUT] v1.0.0 initialized
   [BLACKOUT] fetch BLOCKED: https://api.rb2b.com/...
   ```

---

## DataLayer Events

If you configured the `onBlock` callback, you can create triggers based on blocks:

```javascript
// In your BLACKOUT tag
onBlock: function(result) {
  dataLayer.push({
    event: 'blackout_block',
    blockedUrl: result.url,
    matchedPattern: result.matchedPattern
  });
}
```

Then create a Custom Event trigger in GTM:
- Event name: `blackout_block`
- Use for: Logging, analytics, monitoring

---

## Environment-Specific Deployment

Use GTM Environments or Lookup Tables to enable debug mode only in staging:

```html
<script>
(function() {
  var isDebug = {{Debug Mode}}; // GTM variable

  var script = document.createElement('script');
  script.src = 'https://unpkg.com/blackout-protocol/extension/blackout.bundle.js';
  script.onload = function() {
    Blackout.initBlackout({ debug: isDebug });
  };
  document.head.appendChild(script);
})();
</script>
```

Create a GTM Variable `Debug Mode`:
- Type: Lookup Table
- Input: `{{Page Hostname}}`
- Staging hostname → `true`
- Production hostname → `false`
