# Technical Architecture — PlantScope

## Technology Stack

| Layer        | Technology        | Rationale                                      |
|--------------|-------------------|------------------------------------------------|
| JS Framework | Hotwire (Turbo + Stimulus) | Rails-compatible, lightweight, progressive enhancement |
| CSS          | Bulma 1.0 (CDN)   | Component-rich, no JS dep, mobile-first grid   |
| Build        | None (ES modules)  | No build step, browsers handle modules natively |
| Hosting      | GitHub Pages       | Free, static, custom domain support            |
| Offline      | Service Worker + IndexedDB | Cache assets + saved plant data       |
| Package Mgr  | None               | All deps loaded from CDN via import maps       |

## Zero-Build Architecture

No `npm install`, no bundler, no `node_modules`. The project is plain static files:

- **Libraries via CDN** — Turbo, Stimulus, and Bulma loaded from jsDelivr
- **ES Modules** — Our JS uses native `import`/`export`, supported by all modern browsers
- **Import Maps** — Browser-native mapping from package names to CDN URLs
- **Deploy = push** — GitHub Pages serves the files directly, no build step

```html
<!-- In index.html <head> -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1/css/bulma.min.css">

<script type="importmap">
{
  "imports": {
    "@hotwired/turbo": "https://cdn.jsdelivr.net/npm/@hotwired/turbo@8/dist/turbo.es2017-esm.js",
    "@hotwired/stimulus": "https://cdn.jsdelivr.net/npm/@hotwired/stimulus@3/dist/stimulus.js"
  }
}
</script>

<script type="module" src="./js/application.js"></script>
```

### Browser Compatibility

Import maps are supported in all modern browsers (Chrome 89+, Safari 16.4+, Firefox 108+).
This covers ~95% of users. For the remaining ~5%, we accept graceful degradation — the app
simply won't load on IE or very old browsers, which is acceptable for our audience.

### Future Rails Migration

When moving to Rails:
- Add `importmap-rails` gem (uses the same import map pattern)
- Move CDN pins to `config/importmap.rb`
- Stimulus controllers work unchanged
- Zero rewrite needed — this is the exact pattern Rails 7+ uses

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Browser                         │
├─────────────────────────────────────────────────┤
│  Turbo Drive (SPA-like navigation)              │
│  ┌───────────────────────────────────────────┐  │
│  │  Stimulus Controllers                     │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐  │  │
│  │  │ Search  │ │  Plant   │ │ Bookmark  │  │  │
│  │  │Controller│ │Controller│ │Controller │  │  │
│  │  └────┬────┘ └────┬─────┘ └─────┬─────┘  │  │
│  │       │            │              │        │  │
│  │  ┌────▼────────────▼──────────────▼────┐   │  │
│  │  │        Service Layer                │   │  │
│  │  │  ┌──────────┐  ┌───────────────┐   │   │  │
│  │  │  │ iNat API │  │ Wikipedia API │   │   │  │
│  │  │  │  Client  │  │    Client     │   │   │  │
│  │  │  └──────────┘  └───────────────┘   │   │  │
│  │  │  ┌──────────┐  ┌───────────────┐   │   │  │
│  │  │  │  Cache   │  │   Storage     │   │   │  │
│  │  │  │  Layer   │  │  (IndexedDB)  │   │   │  │
│  │  │  └──────────┘  └───────────────┘   │   │  │
│  │  └────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  Service Worker (offline + asset caching)       │
└─────────────────────────────────────────────────┘
```

## API Integration

### iNaturalist API v1

Base URL: `https://api.inaturalist.org/v1`

No authentication required for read-only access. Rate limit: ~100 requests/minute (undocumented, be conservative).

#### Endpoints Used

| Endpoint | Purpose | Key Params |
|----------|---------|------------|
| `GET /taxa/autocomplete` | Search suggestions | `q`, `per_page` |
| `GET /taxa/{id}` | Taxon details | — |
| `GET /observations` | Photos with filters | `taxon_id`, `term_id`, `term_value_id`, `photos=true`, `per_page`, `page` |
| `GET /observations/histogram` | Seasonality data | `taxon_id`, `date_field=observed`, `interval=month_of_year`, `term_id`, `term_value_id` |

#### Annotation Term IDs

These are the controlled terms used to filter observations:

**Plant Phenology (term_id = 12)**

| Filter    | term_id | term_value_id | Notes |
|-----------|---------|---------------|-------|
| Flowering | 12      | 13            | Plant Phenology = Flowering |
| Fruiting  | 12      | 14            | Plant Phenology = Fruiting |
| Budding   | 12      | 15            | Plant Phenology = Flower Budding |
| No Evidence | 12    | 21            | No Evidence of Flowering |

**Leaves (term_id = 36)**

| Filter             | term_id | term_value_id | Notes |
|--------------------|---------|---------------|-------|
| Breaking Leaf Buds | 36      | 37            | Early spring leaf emergence |
| Green Leaves       | 36      | 38            | Active/healthy foliage |
| Colored Leaves     | 36      | 39            | Fall color / senescence |
| No Live Leaves     | 36      | 40            | Dormant / deciduous bare |

> Note: There are no dedicated annotation terms for "Bark" or "Habitat" in iNat's
> controlled terms system. These could potentially be sourced via observation fields
> or tags, but are not first-class filters. For v1, we'll offer leaf sub-filters
> and skip bark/habitat.

#### Example API Calls

```
# Taxon details (e.g., Coast Live Oak)
GET /taxa/55879

# All observation photos
GET /observations?taxon_id=55879&photos=true&per_page=30&page=1&quality_grade=research

# Flowering photos only
GET /observations?taxon_id=55879&photos=true&term_id=12&term_value_id=13&per_page=30

# Seasonality histogram (all observations)
GET /observations/histogram?taxon_id=55879&date_field=observed&interval=month_of_year

# Seasonality histogram (flowering only)
GET /observations/histogram?taxon_id=55879&date_field=observed&interval=month_of_year&term_id=12&term_value_id=13
```

### Wikipedia API (REST)

Base URL: `https://en.wikipedia.org/api/rest_v1`

Used as supplementary source when iNat `wikipedia_summary` is insufficient.

```
# Get page summary
GET /page/summary/{title}

# Returns: extract (text), thumbnail, description, content_urls
```

## Data Flow

### URL Parsing Logic

The app accepts multiple input formats and resolves all of them to a `taxon_id`:

```javascript
// URL param priority: ?url= takes precedence, then ?taxon_id=, then search input

function resolveInput(input) {
  // Case 1: Direct taxon_id param
  // ?taxon_id=12345
  if (/^\d+$/.test(input)) return { type: 'taxon_id', value: input };

  // Case 2: iNat taxon URL
  // https://www.inaturalist.org/taxa/12345-Common-Name
  // https://inaturalist.org/taxa/12345
  const taxonMatch = input.match(/inaturalist\.org\/taxa\/(\d+)/);
  if (taxonMatch) return { type: 'taxon_id', value: taxonMatch[1] };

  // Case 3: iNat observation URL (needs API call to resolve taxon)
  // https://www.inaturalist.org/observations/99999
  const obsMatch = input.match(/inaturalist\.org\/observations\/(\d+)/);
  if (obsMatch) return { type: 'observation_id', value: obsMatch[1] };

  // Case 4: Plain text → search
  return { type: 'search', value: input };
}
```

For observation URLs, an additional API call resolves the taxon:
```
GET /observations/{id} → response.results[0].taxon.id
```

### Plant Lookup Flow

```
Input Source
    │
    ├─ ?url= param (from iOS Shortcut / share)
    │     │
    │     └─ Parse URL → taxon_id or observation_id
    │                          │
    │         observation_id? ─┼─ YES → GET /observations/{id} → extract taxon_id
    │                          │
    │                          └─ NO → use taxon_id directly
    │
    ├─ ?taxon_id= param (direct link)
    │     │
    │     └─ Use directly
    │
    └─ Search input (typed text or pasted URL)
          │
          ├─ Looks like URL? → Parse (same as above)
          │
          └─ Text? → GET /taxa/autocomplete?q={text}
                          │
                          └─ User selects → taxon_id
                                  │
                                  ▼
                    GET /taxa/{taxon_id}
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
               Description    Photos       Histogram
               (from taxon   (parallel    (parallel
                response)     fetch)       fetch)
```

### Seasonality Calculation

```javascript
// Raw histogram: { "1": 4500, "2": 5200, ..., "12": 3800 }
// Convert to percentage (relative likelihood):

const max = Math.max(...Object.values(histogram));
const seasonality = Object.entries(histogram).map(([month, count]) => ({
  month: parseInt(month),
  likelihood: Math.round((count / max) * 100)
}));
// Result: [{ month: 1, likelihood: 42 }, { month: 2, likelihood: 48 }, ...]
```

## Offline Strategy

### Service Worker
- Precache: HTML shell, CSS, JS bundles, Bulma
- Runtime cache: API responses (network-first with fallback)
- Image cache: LRU cache with size limit (~50MB)

### IndexedDB Schema

```
Database: plantscope_db

Store: bookmarks
  Key: taxon_id (integer)
  Value: {
    taxon_id: number,
    common_name: string,
    scientific_name: string,
    thumbnail_url: string,
    wikipedia_summary: string,
    taxon_data: object,       // full taxon API response
    seasonality: object,      // histogram data
    saved_at: ISO date string,
    cached_photos: string[]   // base64 or blob URLs for key photos
  }

Store: ethnobotany_notes
  Key: auto-increment (integer)
  Index: taxon_id (non-unique, for querying all notes per plant)
  Value: {
    id: string (UUID),
    taxon_id: number,
    text: string,             // usage description
    url: string | null,       // optional reference link
    created_at: ISO date string,
    updated_at: ISO date string
  }
```

### localStorage Usage

```
Key: plantscope_bookmarks_index
Value: [{ taxon_id, common_name, thumbnail_url, saved_at }]
// Quick index for bookmarks list without opening IndexedDB
```

## Caching Strategy

| Resource | Strategy | TTL |
|----------|----------|-----|
| Static assets (CSS/JS) | Cache-first | Until new deploy |
| Taxon data | Network-first, cache fallback | 24 hours |
| Photos | Cache-first after first load | 7 days |
| Histogram data | Network-first, cache fallback | 24 hours |
| Autocomplete | Network-only (no cache) | — |

## File Structure

```
plants/
├── docs/                      # Specification documents
├── index.html                 # Main HTML shell (served directly)
├── bookmarks.html             # Saved plants page
├── css/
│   └── app.css                # Custom styles (extends Bulma)
├── js/
│   ├── application.js         # Entry point, Stimulus app init
│   ├── controllers/           # Stimulus controllers
│   │   ├── search_controller.js
│   │   ├── plant_controller.js
│   │   ├── gallery_controller.js
│   │   ├── seasonality_controller.js
│   │   ├── bookmark_controller.js
│   │   └── notes_controller.js
│   ├── services/              # API clients & business logic
│   │   ├── inat_api.js
│   │   ├── wikipedia_api.js
│   │   ├── cache_service.js
│   │   └── storage_service.js
│   └── lib/                   # Utilities
│       └── url_parser.js
├── sw.js                      # Service worker
└── README.md
```

No `package.json`, no `node_modules`, no `dist/` folder. The repo root IS the deployable site.

## Development

```bash
# Just serve the files locally. Any static server works:
python3 -m http.server 8000
# or
npx serve .
# or just open index.html in browser (service worker won't work without a server)
```

## Deploy

GitHub Pages serves the repo root directly. Setup:
1. Go to repo Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: `main`, folder: `/ (root)`
4. Done — pushes to main auto-deploy

## Security Considerations

- No secrets/API keys (iNat API is public, no auth needed)
- Content Security Policy headers via meta tags
- Sanitize any HTML from API responses before rendering
- No user-generated content stored server-side

## Future Rails Migration Path

When transitioning to Rails backend:
- Stimulus controllers remain unchanged (copy `js/controllers/` into `app/javascript/controllers/`)
- Turbo Drive enables server-rendered partials
- Import map pins move to `config/importmap.rb` (same CDN URLs, just declared in Ruby)
- API calls move from client-side JS to Rails controllers
- IndexedDB → PostgreSQL for persistent storage
- Service layer becomes Rails service objects
- No bundler migration needed — Rails 7+ uses `importmap-rails` by default
