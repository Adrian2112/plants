# iOS Shortcut Integration — PlantScope

## Overview

The iNaturalist iOS app supports sharing taxon/observation pages via the iOS share sheet. We leverage iOS Shortcuts to pipe that shared URL directly into PlantScope in the browser.

## How It Works

```
┌──────────────┐     ┌────────────────┐     ┌──────────────────┐
│  iNat App    │────▶│  iOS Shortcut  │────▶│  Safari opens    │
│  Share Sheet │     │  "PlantScope"  │     │  PlantScope URL  │
└──────────────┘     └────────────────┘     └──────────────────┘
```

1. User views a plant in the iNaturalist iOS app
2. Taps **Share** → selects the "PlantScope" shortcut
3. Shortcut receives the URL, constructs the PlantScope link
4. Opens Safari with the plant loaded

## Shortcut Definition

The iOS Shortcut has only 2 actions:

### Step-by-step Setup (manual)

1. Open **Shortcuts** app on iPhone
2. Tap **+** to create new shortcut
3. Name it: **"PlantScope"**
4. Add action: **Text**
   - Content: `https://<your-github-pages-domain>/?url=`
5. Add action: **URL**
   - Combine: Text + Shortcut Input
6. Add action: **Open URLs**
   - Input: URL from previous step
7. In shortcut settings, enable **"Show in Share Sheet"**
8. Set "Share Sheet Types" to **URLs** only

### Shortcut as pseudo-code

```
RECEIVE input_url FROM share_sheet
SET base = "https://<username>.github.io/plants/"
SET full_url = base + "?url=" + URLENCODE(input_url)
OPEN full_url IN Safari
```

## Supported URL Formats from iNat App

When sharing from the iNat iOS app, these URL formats are sent:

| Share From | URL Format | Example |
|-----------|-----------|---------|
| Taxon page | `/taxa/{id}-{slug}` | `https://www.inaturalist.org/taxa/55879-Quercus-agrifolia` |
| Observation | `/observations/{id}` | `https://www.inaturalist.org/observations/12345678` |
| Search result | `/taxa/{id}` | `https://www.inaturalist.org/taxa/55879` |

All formats are handled by PlantScope's URL parser (see Technical Architecture doc).

## App-side Handling

When PlantScope receives `?url=...`:

```javascript
// On page load:
const params = new URLSearchParams(window.location.search);
const sharedUrl = params.get('url');

if (sharedUrl) {
  // Decode and parse the iNat URL
  const decoded = decodeURIComponent(sharedUrl);
  const resolved = resolveInput(decoded); // → { type: 'taxon_id', value: '55879' }
  loadPlant(resolved);
}
```

## Alternative: Apple Shortcuts with URL Scheme

If we later add a custom URL scheme (e.g., `plantscope://open?url=...`), the shortcut could open the app directly if installed as a PWA. For v1, plain HTTPS URLs work fine.

## User Installation

We should include a **"Get iOS Shortcut"** link on the PlantScope site (perhaps in a footer or help section) that:
1. Links to the shortcut via iCloud sharing link
2. Or provides step-by-step setup instructions with screenshots

### iCloud Shortcut Link

Once the shortcut is created, it can be shared via iCloud:
- Go to Shortcuts app → long press the shortcut → Share → Copy iCloud Link
- This link can be embedded on the PlantScope website for one-tap install

## Testing

To test the flow:
1. Install the shortcut on an iPhone
2. Open iNaturalist app
3. Navigate to any plant (e.g., search "Coast Live Oak")
4. Tap Share → select "PlantScope"
5. Safari should open with the plant profile loaded

## Edge Cases

- **No internet**: If the plant was previously bookmarked, it loads from cache. Otherwise, shows an offline error.
- **Invalid URL shared**: If someone shares a non-iNat URL, show a friendly error: "This doesn't look like an iNaturalist link. Try searching for a plant name instead."
- **Observation without taxon**: Rare, but some observations are unidentified. Show: "This observation hasn't been identified yet."
