# UI/UX Design Specification — PlantScope

## Design Principles

1. **Mobile-first**: Design for 375px width, enhance upward
2. **Content density**: Maximize useful information per screen
3. **Progressive disclosure**: Summary first, details on demand
4. **Fast interaction**: Minimal taps to reach any content

## Visual Style

- **Theme**: Clean, minimal, nature-adjacent
- **Colors**: Bulma defaults with a green primary override
- **Typography**: System font stack (fast, native feel)
- **Spacing**: Consistent 8px grid
- **Borders**: Subtle, rounded corners (4px)

### Color Palette

| Role       | Color   | Usage                    |
|------------|---------|--------------------------|
| Primary    | #2E7D32 | Buttons, active tabs, links |
| Primary Light | #A5D6A7 | Seasonality bars, highlights |
| Background | #FAFAFA | Page background          |
| Surface    | #FFFFFF | Cards, sections          |
| Text       | #212121 | Primary text             |
| Text Light | #757575 | Secondary text, captions |
| Accent     | #FF8F00 | Current month indicator  |

## Layout & Wireframes

### Mobile Layout (375px)

```
┌─────────────────────────────────┐
│  🌿 PlantScope    [☆ Saved]    │  ← Navbar (sticky)
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ 🔍 Search plant or paste URL││  ← Search input
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │      [Hero Photo]           ││  ← Default taxon photo
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│  Coast Live Oak                 │  ← Common name (h1)
│  Quercus agrifolia              │  ← Scientific name (italic)
│  Plantae > ... > Fagaceae       │  ← Taxonomy breadcrumb
│                                 │
│  [★ Save Plant]                 │  ← Bookmark button
│                                 │
├─────────────────────────────────┤
│  About                          │
│  ─────────────────────────────  │
│  Oak native to coastal CA...    │  ← Wikipedia summary
│  [▼ Read more]                  │  ← Expand for full text
│  📖 View on Wikipedia →         │  ← External link
│                                 │
├─────────────────────────────────┤
│  Seasonality                    │
│  ─────────────────────────────  │
│  [All ▼] ← filter dropdown     │
│                                 │
│  J ████████████░░░░░░░░  42%   │
│  F █████████████░░░░░░░  48%   │
│  M ███████████████████░  85%   │
│  A ████████████████████ 100%   │  ← Peak month
│  M ██████████████████░░  92%   │
│  J █████████████████░░░  78%   │
│  J ████████████████░░░░  72%   │
│  A ██████████████░░░░░░  65%   │
│  S █████████████░░░░░░░  58%   │
│  O ███████████░░░░░░░░░  52%   │
│  N ████████░░░░░░░░░░░░  38%   │
│  D ███████░░░░░░░░░░░░░  35%   │
│                                 │
│  * = current month highlighted  │
│                                 │
├─────────────────────────────────┤
│  Photos                         │
│  ─────────────────────────────  │
│  [All|Flower|Fruit|Bud|Leaf|..] │  ← Tab bar (scrollable)
│                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ img  │ │ img  │ │ img  │   │  ← Photo grid (2 col)
│  └──────┘ └──────┘ └──────┘   │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ img  │ │ img  │ │ img  │   │
│  └──────┘ └──────┘ └──────┘   │
│                                 │
│  [Load more...]                 │  ← Infinite scroll trigger
│                                 │
├─────────────────────────────────┤
│  Ethnobotany                    │
│  ─────────────────────────────  │
│                                 │
│  ┌─────────────────────────────┐│
│  │ Acorns leached and ground   ││
│  │ into flour by Ohlone people ││
│  │ 🔗 source  [✎] [✕]         ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ Bark tea used as astringent ││
│  │ 🔗 source  [✎] [✕]         ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ + Add note                  ││  ← Tap to expand form
│  │  ┌───────────────────────┐  ││
│  │  │ Note text...          │  ││
│  │  └───────────────────────┘  ││
│  │  ┌───────────────────────┐  ││
│  │  │ Reference URL (opt.)  │  ││
│  │  └───────────────────────┘  ││
│  │  [Save]                     ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

### Desktop Layout (1024px+)

```
┌───────────────────────────────────────────────────────────────┐
│  🌿 PlantScope          [🔍 Search...]           [☆ Saved]   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────┐  ┌──────────────────────────────┐│
│  │                        │  │                              ││
│  │     [Hero Photo]       │  │  Coast Live Oak              ││
│  │                        │  │  Quercus agrifolia           ││
│  │                        │  │  Plantae > ... > Fagaceae    ││
│  │                        │  │                              ││
│  │                        │  │  [★ Save Plant]              ││
│  │                        │  │                              ││
│  └────────────────────────┘  │  About                       ││
│                              │  ───────────────────          ││
│                              │  Oak native to...            ││
│                              │  [▼ Read more]               ││
│                              │  📖 View on Wikipedia →      ││
│                              └──────────────────────────────┘│
│                                                               │
├───────────────────────────────────────────────────────────────┤
│  Seasonality        [All | Flowering | Fruiting | Budding ▼]  │
│  ─────────────────────────────────────────────────────────── │
│  J   F   M   A   M   J   J   A   S   O   N   D              │
│  ██  ██  ██  ██  ██  ██  ██  ██  ██  ██  ██  ██             │
│  42  48  85 100  92  78  72  65  58  52  38  35              │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│  Photos  [All | Flowering | Fruiting | Budding | Leaf | ...]  │
│  ─────────────────────────────────────────────────────────── │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │      │ │      │ │      │ │      │ │      │ │      │    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │      │ │      │ │      │ │      │ │      │ │      │    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
└───────────────────────────────────────────────────────────────┘
```

### Bookmarks Page

```
┌─────────────────────────────────┐
│  🌿 PlantScope    [☆ Saved]    │
├─────────────────────────────────┤
│                                 │
│  Saved Plants (3)               │
│  ─────────────────────────────  │
│                                 │
│  ┌─────────────────────────────┐│
│  │ [img] Coast Live Oak        ││
│  │       Quercus agrifolia     ││
│  │       Saved 3 days ago  [✕] ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ [img] California Poppy      ││
│  │       Eschscholzia calif.   ││
│  │       Saved 1 week ago  [✕] ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ [img] Manzanita             ││
│  │       Arctostaphylos        ││
│  │       Saved 2 weeks ago [✕] ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

## Component Breakdown

### 1. Navbar
- Fixed/sticky at top
- App name/logo (left)
- Bookmarks link (right)
- On desktop: search input integrated in navbar

### 2. Search Input
- Full-width on mobile (below navbar)
- Debounced autocomplete (300ms)
- Dropdown results showing: thumbnail, common name, scientific name
- Clear button (×)
- Loading spinner during search

### 3. Plant Header
- Hero photo (full-width mobile, 40% on desktop)
- Name hierarchy: common > scientific > taxonomy
- Save/bookmark toggle button

### 4. Description Card
- Collapsible content (Bulma's `is-collapsible` pattern)
- Default: show first ~150 characters
- Expanded: full wikipedia_summary
- External Wikipedia link (icon + text)

### 5. Seasonality Chart
- Custom component (no chart library — keep it simple)
- Horizontal bars using CSS (Bulma `progress` elements or custom)
- Filter selector: dropdown on mobile, pills/tabs on desktop
- Current month highlighted with accent color
- Percentage label on each bar
- Responsive: stacks naturally

### 6. Photo Gallery
- Scrollable tab bar for filters (horizontal scroll on mobile)
- CSS grid: 2 columns mobile, 3 columns tablet, 4+ desktop
- Aspect ratio: square thumbnails (object-fit: cover)
- Tap/click opens lightbox (fullscreen on mobile)
- Attribution text below lightbox image
- "Load more" button or intersection observer for infinite scroll
- Loading skeleton placeholders

### 7. Photo Lightbox
- Full-screen overlay
- Swipe to navigate (mobile)
- Arrow keys to navigate (desktop)
- Close button + tap-outside-to-close
- Shows: full photo, observer name, date, attribution

### 8. Ethnobotany Notes Section
- Section header: "Ethnobotany"
- List of note cards, each showing:
  - Note text
  - Reference link (if provided) — rendered as clickable "source" link
  - Edit (✎) and Delete (✕) buttons
- "Add note" button that expands an inline form:
  - Textarea for note text (required)
  - Input for reference URL (optional)
  - Save / Cancel buttons
- Edit mode: same form, pre-filled with existing values
- Delete: confirmation prompt before removing
- Empty state: "No ethnobotanical notes yet. Add one above."
- Auto-bookmarks plant on first note save (with subtle toast notification)

### 9. Bookmark Card
- Horizontal card layout
- Thumbnail (left), text (right)
- Relative date ("3 days ago")
- Badge showing note count if plant has notes (e.g., "2 notes")
- Remove button (×) with confirmation

## Interaction Patterns

### Search Flow
1. User types in search field
2. After 300ms pause → autocomplete API call
3. Dropdown appears with results (max 8)
4. User taps result → page scrolls to plant content
5. URL updates to `?taxon_id=12345` (enables sharing)

### Seasonality Filter Change
1. User taps filter dropdown/pills
2. Loading indicator on chart
3. New histogram data fetched
4. Bars animate to new values (CSS transition)
5. Labels update

### Photo Tab Switch
1. User taps tab (e.g., "Flowering")
2. Grid shows skeleton placeholders
3. Fetch observations with annotation filter
4. Photos fade in as loaded
5. Scroll position resets to top of gallery

### Save Plant
1. User taps "Save Plant" button
2. Button changes to "Saved ✓" (filled star)
3. Plant data + key photos cached to IndexedDB
4. Toast notification: "Plant saved for offline viewing"

### Add Ethnobotanical Note
1. User taps "+ Add note" button
2. Form expands inline (textarea + URL input + Save/Cancel)
3. User fills in note text (required) and optional URL
4. Taps "Save"
5. Note appears in list above the form
6. If plant wasn't bookmarked, it's auto-saved (toast: "Plant saved to bookmarks")
7. Form collapses back to "+ Add note" button

### Edit/Delete Note
1. User taps ✎ (edit) → form appears inline with values pre-filled
2. User modifies and taps "Save" → note updates in place
3. User taps ✕ (delete) → confirmation: "Delete this note?" → removes from list

## Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|---------------|
| < 768px (mobile) | Single column, stacked sections, 2-col photo grid |
| 768–1023px (tablet) | Hero + info side-by-side, 3-col photo grid |
| ≥ 1024px (desktop) | Full 2-panel layout, horizontal seasonality, 4-col photos |

## Loading States

- **Initial load**: Skeleton screen (grey pulsing blocks)
- **Search**: Spinner in input field
- **Photos**: Skeleton grid squares, images fade in
- **Seasonality**: Bars at 0% width, animate to final value
- **Error**: Bulma notification (red) with retry button

## Empty States

- **No search results**: "No plants found. Try a different name or paste an iNaturalist URL."
- **No photos for filter**: "No [flowering] photos available for this species."
- **No seasonality data**: "Not enough data to show seasonality for this filter."
- **No bookmarks**: "No saved plants yet. Search for a plant and tap Save to add it here."

## Animations

- Seasonality bars: `transition: width 0.4s ease-out`
- Photo fade-in: `opacity 0 → 1` over 0.3s
- Collapsible sections: `max-height` transition
- Tab indicator: slide animation on active tab
- Save button: brief scale pulse on tap
