# Implementation Plan — PlantScope

## Phases Overview

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| 1 | Project Setup & Core Structure | Buildable project, HTML shell, Stimulus wired |
| 2 | Search & Plant Display | Search works, taxon data renders |
| 3 | Seasonality Chart | Histogram data displayed with filters |
| 4 | Photo Gallery | Filtered photos with tabs, lightbox |
| 5 | Bookmarks & Offline | Save/load plants, service worker |
| 6 | Polish & Deploy | Performance, edge cases, GitHub Pages |

---

## Phase 1: Project Setup & Core Structure

### Tasks
1. Create `index.html` with:
   - Bulma CSS from CDN
   - Import map for Turbo + Stimulus (jsDelivr CDN)
   - `<script type="module" src="./js/application.js">`
2. Create `js/application.js` — Stimulus app initialization
3. Create folder structure: `js/controllers/`, `js/services/`, `js/lib/`, `css/`
4. Create `css/app.css` — custom styles extending Bulma
5. Add basic responsive navbar (app name + bookmarks link)
6. Verify Stimulus connects with a simple test controller
7. Set up GitHub repo (optional at this stage)

No npm, no bundler, no build step. Just files.

### Exit Criteria
- Open `index.html` via local server (`python3 -m http.server`) and page renders
- Stimulus connects (verified with a test controller logging to console)
- Bulma styles render correctly (navbar, columns responsive)
- Import map resolves Turbo + Stimulus from CDN without errors

---

## Phase 2: Search & Plant Display

### Tasks
1. Build `url_parser.js` utility:
   - Parse `?url=` param (full iNat URLs shared from iOS)
   - Parse `?taxon_id=` param (direct links)
   - Extract taxon_id from `/taxa/12345-slug` URLs
   - Extract observation_id from `/observations/12345` URLs
   - Detect plain text vs URL in search input
2. Build `inat_api.js` service:
   - `searchTaxa(query)` → autocomplete
   - `getTaxon(id)` → full taxon data
   - `getObservation(id)` → resolve observation → taxon_id
3. Build `search_controller.js`:
   - On page load: check `?url=` then `?taxon_id=` params
   - Debounced input handling (300ms)
   - Detect if input is a URL (parse it) or text (autocomplete)
   - Autocomplete dropdown rendering
   - Update browser URL on selection (`?taxon_id=` canonical form)
4. Build `plant_controller.js`:
   - Render plant header (names, taxonomy, hero photo)
   - Render description section (collapsible)
   - Wikipedia link
5. Build `wikipedia_api.js` service (supplementary):
   - Fetch extended summary if needed
6. Handle error cases:
   - Invalid/non-iNat URL shared → friendly error message
   - Observation without taxon identification → message

### API Calls
```
GET /taxa/autocomplete?q={query}&per_page=8
GET /taxa/{id}
GET /observations/{id}  (for resolving observation URLs to taxon)
GET https://en.wikipedia.org/api/rest_v1/page/summary/{title}
```

### Exit Criteria
- Can search by name and see autocomplete results
- Can paste iNaturalist URL (any format) and see plant profile
- Direct link with `?taxon_id=X` loads plant
- Shared link with `?url=https://inaturalist.org/taxa/123` loads plant
- Shared link with `?url=https://inaturalist.org/observations/456` resolves and loads
- Invalid URL shows helpful error
- Description shows with collapsible "read more"
- Wikipedia link opens in new tab

---

## Phase 3: Seasonality Chart

### Tasks
1. Extend `inat_api.js`:
   - `getHistogram(taxonId, termId?, termValueId?)` → monthly data
2. Build `seasonality_controller.js`:
   - Fetch histogram data
   - Calculate likelihood percentages
   - Render horizontal bar chart (pure CSS/HTML)
   - Filter dropdown (All / Flowering / Fruiting / Budding)
   - Highlight current month
   - Animate bars on data change
3. Style seasonality component:
   - Responsive bar widths
   - Month labels
   - Percentage labels

### Data Transform
```javascript
// Input: { "1": 4500, "2": 5200, ..., "12": 3800 }
// Output: [{ month: 1, label: "Jan", likelihood: 42 }, ...]
```

### Exit Criteria
- Seasonality chart renders for any plant
- Filter changes update chart with new data
- Current month visually highlighted
- Works on mobile (readable, not cramped)
- Graceful handling when no data available

---

## Phase 4: Photo Gallery

### Tasks
1. Extend `inat_api.js`:
   - `getObservationPhotos(taxonId, options)` → paginated photos
   - Support `term_id` / `term_value_id` params for filtering
   - Handle pagination (page number tracking)
2. Build `gallery_controller.js`:
   - Tab bar rendering and switching
   - Photo grid rendering
   - Lazy loading with Intersection Observer
   - Infinite scroll / "Load more" trigger
   - Loading skeletons
3. Build lightbox functionality:
   - Full-screen overlay
   - Photo attribution display
   - Swipe/arrow navigation
   - Close on backdrop click / escape key
4. Style photo grid:
   - Responsive columns (2 → 3 → 4)
   - Square thumbnails with object-fit
   - Skeleton loading animation

### Photo Tab Filters
```javascript
const PHOTO_FILTERS = [
  { label: "All", termId: null, termValueId: null },
  { label: "Flowering", termId: 12, termValueId: 13 },
  { label: "Fruiting", termId: 12, termValueId: 14 },
  { label: "Budding", termId: 12, termValueId: 15 },
  { label: "Leaf Buds", termId: 36, termValueId: 37 },
  { label: "Green Leaves", termId: 36, termValueId: 38 },
  { label: "Colored Leaves", termId: 36, termValueId: 39 },
  { label: "No Leaves", termId: 36, termValueId: 40 },
];
// Note: No annotation terms exist for Bark or Habitat — omitted from v1
```

### Exit Criteria
- Photo grid loads and displays correctly
- Tab switching fetches filtered photos
- Infinite scroll loads more pages
- Lightbox works on mobile (swipe) and desktop (arrows)
- Attribution shown for all photos
- Graceful empty state per tab

---

## Phase 5: Bookmarks & Offline

### Tasks
1. Build `storage_service.js`:
   - IndexedDB wrapper (open, read, write, delete)
   - Save plant data (taxon + histogram + key photos)
   - Load saved plant list
   - Remove saved plant
   - Ethnobotany notes CRUD (separate store, indexed by taxon_id)
   - UUID generation for note IDs
2. Build `bookmark_controller.js`:
   - Save/unsave toggle button
   - Bookmarks list page rendering
   - Remove with confirmation
   - Relative time display ("3 days ago")
   - Note count badge per bookmarked plant
3. Build `notes_controller.js`:
   - Render notes list for current plant
   - "+ Add note" toggle → inline form
   - Save note (text + optional URL) → persist to IndexedDB
   - Edit note → pre-fill form, update on save
   - Delete note → confirmation → remove
   - Auto-bookmark plant on first note save
   - Toast notifications for save/delete actions
4. Build `cache_service.js`:
   - sessionStorage for API response caching
   - Cache invalidation (TTL-based)
5. Create `bookmarks.html` page
6. Implement Service Worker (`sw.js`):
   - Precache static assets
   - Runtime caching for API responses
   - Image caching (LRU)
   - Offline fallback page
7. Register service worker in main app

### Exit Criteria
- Can save and remove plants from bookmarks
- Bookmarks page shows saved plants with note count badges
- Can add, edit, and delete ethnobotanical notes
- Adding a note to an unsaved plant auto-bookmarks it
- Notes persist across page reloads (IndexedDB)
- Saved plants load when offline (including notes)
- Static assets cached (app shell loads offline)
- Cache doesn't grow unbounded

---

## Phase 6: Polish & Deploy

### Tasks
1. Performance optimization:
   - Image srcset for responsive images
   - Preconnect to API domains
   - Bundle size check (< 50KB JS gzipped)
2. Error handling:
   - API failures show user-friendly messages
   - Retry buttons where appropriate
   - Network status indicator
3. Edge cases:
   - Taxa with no photos
   - Taxa with no histogram data
   - Very long scientific names
   - RTL text handling (if any)
4. SEO & meta:
   - Open Graph tags for shared links
   - Proper page title updates
   - Favicon
5. GitHub Pages deployment:
   - Configure repository
   - GitHub Actions workflow for build + deploy
   - Custom 404 page (redirect to app)
6. Cross-browser testing:
   - iOS Safari
   - Android Chrome
   - Desktop Chrome, Firefox, Safari
7. Lighthouse audit:
   - Performance > 90
   - Accessibility > 90
   - PWA checklist

### Exit Criteria
- Deployed and accessible on GitHub Pages
- Lighthouse scores meet targets
- Works on all target browsers
- No console errors in normal usage
- README with usage instructions

---

## Estimated Timeline

| Phase | Effort Estimate |
|-------|----------------|
| Phase 1: Setup | ~2 hours |
| Phase 2: Search & Display | ~4 hours |
| Phase 3: Seasonality | ~3 hours |
| Phase 4: Photos | ~4 hours |
| Phase 5: Offline | ~4 hours |
| Phase 6: Polish | ~3 hours |
| **Total** | **~20 hours** |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iNat API rate limiting | Photos/search fail | Aggressive caching, debounce, limit per_page |
| Annotation terms (Leaf/Bark) not available via API | Missing photo filters | Fall back to observation field search, or remove tabs |
| CORS issues with Wikipedia API | Description fails | Use iNat's wikipedia_summary as primary source |
| Large photo payloads on mobile | Slow, data expensive | Use thumbnail URLs (small/medium), lazy load |
| IndexedDB quota limits | Can't save many plants | Limit cached photos per plant, show storage usage |

---

## Open Questions (to resolve during implementation)

1. ~~**Leaves term_value_id**~~: RESOLVED — term_id=36, values: 37 (Breaking Leaf Buds), 38 (Green Leaves), 39 (Colored Leaves), 40 (No Live Leaves). No Bark/Habitat terms exist in iNat's annotation system.
2. **Photo sizes**: What URL patterns does iNat use for thumbnail vs. full-size? (likely `square.jpg`, `medium.jpg`, `original.jpg`)
3. **Rate limiting**: What's the actual iNat rate limit? May need to add request queuing.
4. **Wikipedia API CORS**: Does the REST API allow browser-origin requests? If not, fall back to iNat summary only.
