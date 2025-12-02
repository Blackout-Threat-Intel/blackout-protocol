# Chrome Extension Deployment

Run BLACKOUT Protocol as a browser extension for personal use or testing.

---

## Sideload Installation

### Step 1: Download

Clone or download this repository:

```bash
git clone https://github.com/Blackout-Threat-Intel/blackout-protocol.git
```

Or download the ZIP from [Releases](https://github.com/Blackout-Threat-Intel/blackout-protocol/releases).

### Step 2: Open Chrome Extensions

1. Open Chrome
2. Navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in top right)

### Step 3: Load Extension

1. Click **Load unpacked**
2. Navigate to the `blackout-protocol/extension/` folder
3. Select the folder

### Step 4: Verify

1. You should see "BLACKOUT Protocol" in your extensions list
2. Visit any site
3. Open DevTools Console (F12)
4. Look for the BLACKOUT banner

---

## Extension Files

```
extension/
├── manifest.json        # Chrome extension manifest
├── content-loader.js    # Injects bundle into pages
├── blackout.bundle.js   # The compiled BLACKOUT library
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

---

## How It Works

1. **manifest.json** declares content script permissions
2. **content-loader.js** runs at `document_start` (before page scripts)
3. It injects `blackout.bundle.js` into the page context
4. BLACKOUT initializes and shims network APIs
5. All subsequent tracking requests are intercepted

---

## Permissions

The extension requires:

```json
{
  "permissions": ["scripting", "activeTab"],
  "host_permissions": ["<all_urls>"]
}
```

- `scripting`: Inject content scripts
- `activeTab`: Access current tab
- `<all_urls>`: Run on all websites

---

## Updating

When a new version is released:

1. Download/pull the latest code
2. Go to `chrome://extensions`
3. Click the refresh icon on the BLACKOUT extension
4. Reload any open tabs

---

## Disabling

To temporarily disable:

1. Go to `chrome://extensions`
2. Toggle off the BLACKOUT extension

Or keep it installed and disable per-site in the extension popup (if implemented).

---

## Firefox / Other Browsers

The extension currently targets Chrome Manifest V3. For Firefox:

1. Modify `manifest.json` for Firefox compatibility
2. Use `browser.*` APIs instead of `chrome.*`
3. Load as temporary addon in `about:debugging`

Community contributions for Firefox support welcome.

---

## Enterprise Deployment

For organization-wide deployment:

1. Package the extension as a `.crx` file
2. Configure Chrome policy to force-install
3. Or host on internal Chrome Web Store

See [Chrome Enterprise documentation](https://support.google.com/chrome/a/answer/9296680) for details.
