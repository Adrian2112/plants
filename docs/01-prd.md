# Product Requirements Document — PlantScope

## Overview

PlantScope is a mobile-first web application that displays comprehensive plant information sourced from iNaturalist and Wikipedia. Users paste or type an iNaturalist taxon URL/name to view a rich plant profile including descriptions, filtered photo galleries, and seasonality data.

## Target Users

- Naturalists and plant enthusiasts who want quick visual identification aids
- Hikers/foragers who want to know what's in bloom when
- Gardeners researching native plants

## Core Features

### F1: Plant Search & Input
- Text input field at top of page (always visible)
- Accepts: iNaturalist taxon URLs (`inaturalist.org/taxa/12345-...`) or plant common/scientific names
- URL parameter support (multiple formats for flexibility):
  - `?taxon_id=12345` — direct taxon ID
  - `?url=https://www.inaturalist.org/taxa/12345-Name` — full iNat taxon URL
  - `?url=https://www.inaturalist.org/observations/99999` — observation URL (resolves taxon from observation)
- Auto-suggest from iNaturalist taxon autocomplete API
- **iOS Share Sheet support**: Designed to receive shared URLs from the iNaturalist iOS app via an iOS Shortcut (see F7)

### F2: Plant Overview
- Common name (large heading)
- Scientific name (italic, below heading)
- Taxonomy breadcrumb (Kingdom > ... > Species)
- Default/hero photo from iNaturalist

### F3: Description Section
- Summary paragraph (from iNat `wikipedia_summary` field)
- Collapsible "Read more" section for extended content
- External link to full Wikipedia article (opens in new tab)
- If iNaturalist has its own taxon description, show that separately

### F4: Photo Gallery with Phenology Tabs
- Tab bar with filters: All | Flowering | Fruiting | Budding | Leaf Buds | Green Leaves | Colored Leaves | No Leaves
- Grid layout of observation photos from iNaturalist
- Lazy-loading / infinite scroll for photos
- Tap to view full-size photo with attribution
- Photos sourced via iNat observations API with annotation term filters

### F5: Seasonality Chart
- Positioned above the photo gallery section
- Horizontal bar/dot chart showing 12 months (Jan–Dec)
- Shows likelihood percentage (0–100%) of observing the plant per month
- Calculated from histogram data: `(month_count / max_month_count) * 100`
- Filter dropdown/tabs to switch between: All observations | Flowering | Fruiting | Budding
- Visual indicator of current month highlighted
- Responsive: works on small screens

### F6: Bookmarks / Saved Plants
- "Save" button on plant profile
- Saved plants stored in browser localStorage
- Bookmarks page/section showing saved plants with thumbnail + name
- Offline access to saved plant data (cached in localStorage/IndexedDB)
- Remove from bookmarks option

### F7: Ethnobotanical Notes
- User-contributed notes section on each plant profile
- Each note consists of:
  - **Text**: Description of the usage (e.g., "Acorns leached and ground into flour")
  - **Reference URL** (optional): Link to source material
- Notes stored in IndexedDB, keyed by taxon_id
- CRUD operations: add, edit, delete individual notes
- Adding a note auto-bookmarks the plant (so notes are never orphaned)
- Notes visible on plant profile in a dedicated "Ethnobotany" section
- Notes included in offline/cached data for bookmarked plants
- Export: future consideration (JSON export of all notes)

### F8: iOS Shortcut Integration (Share from iNat App)
- iOS Shortcut receives shared URL from iNaturalist app's share sheet
- Shortcut constructs PlantScope URL: `https://<your-domain>/?url={shared_url}`
- Opens in Safari/default browser
- Supports all iNat URL formats:
  - `https://www.inaturalist.org/taxa/12345-Common-Name`
  - `https://www.inaturalist.org/taxa/12345`
  - `https://inaturalist.org/observations/99999`
- No app installation required — just a 2-step iOS Shortcut

## Non-Functional Requirements

### Performance
- First meaningful paint < 2 seconds on 4G
- Photos lazy-loaded, thumbnails first
- API responses cached in sessionStorage

### Offline Support
- Saved/bookmarked plants available offline (description + cached photos)
- Service worker for caching static assets
- Clear indicator when viewing cached vs. live data

### Accessibility
- Semantic HTML throughout
- ARIA labels on interactive elements
- Keyboard navigable
- Color contrast meets WCAG AA

### Hosting
- Static site on GitHub Pages
- No server-side dependencies for v1
- All API calls client-side

## Out of Scope (v1)
- User accounts / authentication
- Plant comparisons (side-by-side)
- Geolocation-based suggestions
- Contributing observations back to iNaturalist
- Backend / Ruby on Rails (future phase)

## Success Metrics
- Page loads within performance budget
- All iNaturalist photo annotation filters functional
- Offline bookmarks working reliably
- Works on iOS Safari and Android Chrome
