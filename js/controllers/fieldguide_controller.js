import { Controller } from "@hotwired/stimulus"
import { getNearbySpecies, getNearbySpeciesForMonth, getUserSpecies, getHistogram } from "../services/inat_api.js"
import { getActiveCoords, getLocationName, onLocationChange, setActiveLocation } from "../services/location_service.js"
import { getUsername, getPrimaryLanguage } from "../services/settings_service.js"
import { getDisplayName } from "../services/taxon_filters.js"

const TAB_ICONS = {
  Birds: "🐦", Plants: "🌿", Insects: "🦋", Mammals: "🦊", Reptiles: "🦎",
  Amphibians: "🐸", Fish: "🐟", Arachnids: "🕷", Fungi: "🍄", Other: "🌍",
}

const TAB_ORDER = ["Birds", "Plants", "Insects", "Mammals", "Reptiles", "Amphibians", "Fish", "Arachnids", "Fungi", "Other"]

const FILTER_LABELS = { all: "All", unseen: "Unseen", seen: "Seen" }
const SEASON_LABELS = { any: "Any season", inseason: "🌱 In season", soon: "🔜 Coming soon", off: "❄ Off season" }
const SORT_LABELS   = { popular: "↓ Popular", availability: "↓ Availability", az: "A → Z", unseen: "Unseen first" }

export default class extends Controller {
  static targets = [
    "tabs", "contents",
    "filterLabel", "seasonLabel", "sortLabel",
    "search", "locationName", "radiusBadge",
    "totalSeen", "totalUnseen", "totalTotal",
    "sheet", "sheetBackdrop", "sheetThumb", "sheetName", "sheetSci", "sheetObs",
    "sheetBadges", "sheetMapContainer", "sheetChart", "sheetLink",
    "areaPicker", "areaMap",
  ]

  static values = {
    filter: { type: String, default: "all" },
    season: { type: String, default: "any" },
    sort:   { type: String, default: "popular" },
    radius: { type: Number, default: 50 },
  }

  connect() {
    this.allSpecies   = []
    this.inSeasonIds  = new Set()
    this.soonIds      = new Set()
    this.seenIds      = new Set()
    this.activeTab    = null
    this.sheetMapInst = null
    this.sheetHeatLayer = null
    this.areaMapInst  = null
    this.areaCircle   = null
    this.L            = null
    this.searchQuery  = ""
    this.pendingRadius = this.radiusValue

    this.closeDropdownsOnOutsideClick = () => this.closeAllDropdowns()
    document.addEventListener("click", this.closeDropdownsOnOutsideClick)

    this.cleanupLocation = onLocationChange(() => {
      this.updateLocationUI()
      this.load()
    })

    this.updateLocationUI()
    if (getActiveCoords()) {
      this.load()
    } else {
      this.showNoLocation()
    }
  }

  disconnect() {
    this.cleanupLocation?.()
    document.removeEventListener("click", this.closeDropdownsOnOutsideClick)
  }

  // ─── Location UI ───────────────────────────────────────────────────────────

  updateLocationUI() {
    const name = getLocationName()
    if (this.hasLocationNameTarget) {
      this.locationNameTarget.textContent = name || "Your location"
    }
    const coords = getActiveCoords()
    const r = coords?.radius ?? this.radiusValue
    if (this.hasRadiusBadgeTarget) {
      this.radiusBadgeTarget.textContent = `${r} km radius`
    }
  }

  // ─── Data loading ──────────────────────────────────────────────────────────

  showNoLocation() {
    this.tabsTarget.innerHTML = ""
    this.contentsTarget.innerHTML = `
      <div style="padding:2.5rem 1rem;text-align:center;color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:0.75rem;">📍</div>
        <p style="font-size:0.875rem;">Enable location or set a map area<br>to see nearby species.</p>
      </div>`
    this.setTotals(0, 0, 0)
  }

  showLoading() {
    this.tabsTarget.innerHTML = ""
    this.contentsTarget.innerHTML = `
      <div style="padding:2rem 1rem;text-align:center;color:var(--text-muted);">
        <p style="font-size:0.875rem;">Loading nearby species…</p>
      </div>`
  }

  showError() {
    this.tabsTarget.innerHTML = ""
    this.contentsTarget.innerHTML = `
      <div style="padding:2rem 1rem;text-align:center;color:var(--text-muted);">
        <p style="font-size:0.875rem;">Unable to load species. Try again later.</p>
      </div>`
  }

  async load() {
    const coords = getActiveCoords()
    if (!coords) { this.showNoLocation(); return }

    const { lat, lng } = coords
    const radius  = coords.radius ?? this.radiusValue
    const locale  = getPrimaryLanguage()
    const month   = new Date().getMonth() + 1
    const nextMo  = month === 12 ? 1 : month + 1

    this.showLoading()

    try {
      const [all, thisMonth, nextMonth] = await Promise.all([
        getNearbySpecies({ lat, lng, radius, locale }),
        getNearbySpeciesForMonth({ lat, lng, radius, locale, month }),
        getNearbySpeciesForMonth({ lat, lng, radius, locale, month: nextMo }),
      ])

      this.allSpecies  = all.sort((a, b) => b.count - a.count)
      this.inSeasonIds = new Set(thisMonth.map(e => e.taxon.id))
      this.soonIds     = new Set(nextMonth.filter(e => !this.inSeasonIds.has(e.taxon.id)).map(e => e.taxon.id))

      const username = getUsername()
      if (username) {
        try {
          const seen = await getUserSpecies(username, { lat, lng, radius, locale })
          this.seenIds = new Set(seen.map(e => e.taxon.id))
        } catch { this.seenIds = new Set() }
      } else {
        this.seenIds = new Set()
      }

      this.render()
    } catch {
      this.showError()
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  render() {
    const filtered = this.getFiltered()
    this.updateTotals()
    this.renderPanel(filtered)
  }

  getFiltered() {
    let list = [...this.allSpecies]

    if (this.searchQuery) {
      const q = this.searchQuery
      list = list.filter(({ taxon }) =>
        (taxon.preferred_common_name || "").toLowerCase().includes(q) ||
        taxon.name.toLowerCase().includes(q)
      )
    }

    if (this.filterValue === "seen")   list = list.filter(({ taxon }) =>  this.seenIds.has(taxon.id))
    if (this.filterValue === "unseen") list = list.filter(({ taxon }) => !this.seenIds.has(taxon.id))

    if (this.seasonValue === "inseason") list = list.filter(({ taxon }) =>  this.inSeasonIds.has(taxon.id))
    if (this.seasonValue === "soon")     list = list.filter(({ taxon }) =>  this.soonIds.has(taxon.id))
    if (this.seasonValue === "off")      list = list.filter(({ taxon }) => !this.inSeasonIds.has(taxon.id) && !this.soonIds.has(taxon.id))

    if (this.sortValue === "availability") {
      list.sort((a, b) => {
        const score = t => this.inSeasonIds.has(t.id) ? 2 : this.soonIds.has(t.id) ? 1 : 0
        return score(b.taxon) - score(a.taxon) || b.count - a.count
      })
    } else if (this.sortValue === "az") {
      list.sort((a, b) => (a.taxon.preferred_common_name || a.taxon.name).localeCompare(b.taxon.preferred_common_name || b.taxon.name))
    } else if (this.sortValue === "unseen") {
      list.sort((a, b) => (this.seenIds.has(a.taxon.id) ? 1 : 0) - (this.seenIds.has(b.taxon.id) ? 1 : 0) || b.count - a.count)
    }
    // "popular" is already sorted by count desc from load()

    return list
  }

  updateTotals() {
    const seen  = this.allSpecies.filter(({ taxon }) => this.seenIds.has(taxon.id)).length
    const total = this.allSpecies.length
    this.setTotals(seen, total - seen, total)
  }

  setTotals(seen, unseen, total) {
    if (this.hasTotalSeenTarget)   this.totalSeenTarget.textContent   = seen
    if (this.hasTotalUnseenTarget) this.totalUnseenTarget.textContent = unseen
    if (this.hasTotalTotalTarget)  this.totalTotalTarget.textContent  = total
  }

  renderPanel(filtered) {
    // Group by iconic taxon display name
    const groups = {}
    for (const entry of filtered) {
      const g = getDisplayName(entry.taxon.iconic_taxon_name)
      if (!groups[g]) groups[g] = []
      groups[g].push(entry)
    }

    const names = TAB_ORDER.filter(g => groups[g])
    for (const g of Object.keys(groups)) {
      if (!names.includes(g)) names.push(g)
    }

    if (!names.length) {
      this.tabsTarget.innerHTML = ""
      this.contentsTarget.innerHTML = `
        <div style="padding:2rem 1rem;text-align:center;color:var(--text-muted);">
          <p style="font-size:0.875rem;">No species match the current filters.</p>
        </div>`
      return
    }

    if (!this.activeTab || !groups[this.activeTab]) this.activeTab = names[0]

    this.tabsTarget.innerHTML = names.map(g => {
      const seenCount = groups[g].filter(({ taxon }) => this.seenIds.has(taxon.id)).length
      return `
        <a class="${g === this.activeTab ? "is-active" : ""}" data-tab="${g}"
           data-action="click->fieldguide#switchTab">
          ${TAB_ICONS[g] || "🌍"} <span class="dex-tab-label">${g}</span>
          <span class="dex-tab-badge">${seenCount}/${groups[g].length}</span>
        </a>`
    }).join("")
    this.tabsTarget.scrollLeft = 0

    this.contentsTarget.innerHTML = names.map(g => `
      <div class="dex-tab-content ${g === this.activeTab ? "is-active" : ""}" data-content="${g}">
        ${this.renderItems(groups[g])}
      </div>`
    ).join("")
  }

  renderItems(items) {
    return items.map(({ count, taxon }) => {
      const seen     = this.seenIds.has(taxon.id)
      const inSeason = this.inSeasonIds.has(taxon.id)
      const soon     = this.soonIds.has(taxon.id)
      const name     = taxon.preferred_common_name || taxon.name
      const photo    = taxon.default_photo?.square_url || ""
      const icon     = TAB_ICONS[getDisplayName(taxon.iconic_taxon_name)] || "🌍"

      const seasonPill = inSeason
        ? `<span class="dex-season-pill is-inseason">🌱 In season</span>`
        : soon
        ? `<span class="dex-season-pill is-soon">🔜 Coming soon</span>`
        : `<span class="dex-season-pill">❄ Off season</span>`

      return `
        <a class="panel-block dex-block ${seen ? "is-seen" : ""} ${soon && !inSeason ? "is-soon" : ""}"
           href="#"
           data-action="click->fieldguide#openSheet"
           data-taxon-id="${taxon.id}"
           data-taxon-name="${name}"
           data-taxon-sci="${taxon.name}"
           data-taxon-count="${count}"
           data-taxon-photo="${photo}"
           data-taxon-seen="${seen}"
           data-taxon-inseason="${inSeason}"
           data-taxon-soon="${soon}"
           data-taxon-group="${getDisplayName(taxon.iconic_taxon_name)}">
          <div class="dex-block-thumb">
            ${photo
              ? `<img src="${photo}" alt="${name}" loading="lazy">`
              : `<span style="font-size:1.4rem;">${icon}</span>`}
            ${seen ? `<span class="dex-seen-dot"></span>` : ""}
          </div>
          <div class="dex-block-body">
            <div class="dex-block-name">${name}</div>
            <div class="dex-block-sci">${taxon.name}</div>
            <div class="dex-block-footer">
              <span class="dex-block-meta">${count.toLocaleString()} obs</span>
              ${seasonPill}
              ${seen ? `<span class="dex-seen-label">Seen ✓</span>` : ""}
            </div>
          </div>
        </a>`
    }).join("")
  }

  // ─── Tab switching ─────────────────────────────────────────────────────────

  switchTab(e) {
    e.preventDefault()
    const key = e.currentTarget.dataset.tab
    this.activeTab = key
    this.tabsTarget.querySelectorAll("a").forEach(a => a.classList.toggle("is-active", a.dataset.tab === key))
    this.contentsTarget.querySelectorAll(".dex-tab-content").forEach(c => c.classList.toggle("is-active", c.dataset.content === key))
    e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }

  // ─── Dropdowns ─────────────────────────────────────────────────────────────

  toggleFilterDropdown(e) { e.stopPropagation(); this.toggleDropdown("filterDropdown") }
  toggleSeasonDropdown(e) { e.stopPropagation(); this.toggleDropdown("seasonDropdown") }
  toggleSortDropdown(e)   { e.stopPropagation(); this.toggleDropdown("sortDropdown")   }

  toggleDropdown(id) {
    const dd = this.element.querySelector(`#${id}`)
    const wasOpen = dd.classList.contains("is-active")
    this.closeAllDropdowns()
    if (!wasOpen) dd.classList.add("is-active")
  }

  closeAllDropdowns() {
    this.element.querySelectorAll(".dex-dropdown").forEach(d => d.classList.remove("is-active"))
  }

  setFilter(e) {
    e.stopPropagation()
    const val = e.currentTarget.dataset.value
    this.filterValue = val
    this.filterLabelTarget.textContent = FILTER_LABELS[val] || val
    this.markActive("filterDropdown", val)
    this.closeAllDropdowns()
    this.render()
  }

  setSeason(e) {
    e.stopPropagation()
    const val = e.currentTarget.dataset.value
    this.seasonValue = val
    this.seasonLabelTarget.textContent = SEASON_LABELS[val] || val
    this.markActive("seasonDropdown", val)
    this.closeAllDropdowns()
    this.render()
  }

  setSort(e) {
    e.stopPropagation()
    const val = e.currentTarget.dataset.value
    this.sortValue = val
    this.sortLabelTarget.textContent = SORT_LABELS[val] || val
    this.markActive("sortDropdown", val)
    this.closeAllDropdowns()
    this.render()
  }

  markActive(ddId, activeVal) {
    this.element.querySelector(`#${ddId}`).querySelectorAll(".dex-dd-item").forEach(item => {
      item.classList.toggle("is-active", item.dataset.value === activeVal)
    })
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  onSearch(e) {
    this.searchQuery = e.target.value.toLowerCase().trim()
    this.render()
  }

  // ─── Area picker ───────────────────────────────────────────────────────────

  async onAreaPickerToggle(e) {
    if (!e.target.open || this.areaMapInst) return

    const L = await this.loadLeaflet()
    const coords = getActiveCoords()
    const center = coords ? [coords.lat, coords.lng] : [20, 0]
    const zoom   = coords ? 8 : 3

    this.areaMapInst = L.map(this.areaMapTarget, {
      zoomControl: true, scrollWheelZoom: false,
    }).setView(center, zoom)

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OSM &copy; CARTO", maxZoom: 16,
    }).addTo(this.areaMapInst)

    if (coords) {
      const r = (coords.radius ?? this.radiusValue) * 1000
      this.areaCircle = L.circle(center, {
        radius: r, color: "#4CAF50", fillColor: "#4CAF50", fillOpacity: 0.08, weight: 2,
      }).addTo(this.areaMapInst)
      L.circleMarker(center, { radius: 6, color: "#4CAF50", fillColor: "#4CAF50", fillOpacity: 0.9 }).addTo(this.areaMapInst)
    }

    setTimeout(() => this.areaMapInst.invalidateSize(), 50)
  }

  selectRadius(e) {
    this.element.querySelectorAll(".dex-radius-pill").forEach(b => b.classList.remove("is-active"))
    e.currentTarget.classList.add("is-active")
    this.pendingRadius = parseInt(e.currentTarget.dataset.radius)
    if (this.areaCircle) this.areaCircle.setRadius(this.pendingRadius * 1000)
    if (this.hasRadiusBadgeTarget) this.radiusBadgeTarget.textContent = `${this.pendingRadius} km radius`
  }

  applyArea() {
    const coords = getActiveCoords()
    if (!coords) return
    setActiveLocation(coords.lat, coords.lng, this.pendingRadius)
    if (this.hasAreaPickerTarget) this.areaPickerTarget.open = false
  }

  // ─── Species sheet ─────────────────────────────────────────────────────────

  openSheet(e) {
    e.preventDefault()
    const el = e.currentTarget
    const { taxonId, taxonName, taxonSci, taxonCount, taxonPhoto, taxonSeen, taxonInseason, taxonSoon } = el.dataset
    const seen     = taxonSeen === "true"
    const inSeason = taxonInseason === "true"
    const soon     = taxonSoon === "true"

    this.sheetThumbTarget.innerHTML = taxonPhoto
      ? `<img src="${taxonPhoto.replace("square", "medium")}" alt="${taxonName}" style="width:100%;height:100%;object-fit:cover;">`
      : `<span style="font-size:2.5rem;">${TAB_ICONS[el.dataset.taxonGroup] || "🌍"}</span>`

    this.sheetNameTarget.textContent = taxonName
    this.sheetSciTarget.textContent  = taxonSci
    this.sheetObsTarget.textContent  = `${parseInt(taxonCount).toLocaleString()} observations nearby`
    this.sheetLinkTarget.href        = `taxon.html?taxon_id=${taxonId}`

    const seasonBadge = inSeason
      ? `<span class="dex-sheet-badge is-season">🌱 In season</span>`
      : soon
      ? `<span class="dex-sheet-badge" style="background:rgba(255,152,0,.12);color:#FFB74D;border-color:rgba(255,152,0,.3);">🔜 Coming soon</span>`
      : `<span class="dex-sheet-badge" style="background:rgba(96,125,139,.12);color:#90a4ae;border-color:rgba(96,125,139,.3);">❄ Off season</span>`

    this.sheetBadgesTarget.innerHTML =
      `${seen ? `<span class="dex-sheet-badge is-seen">✓ Observed by you</span>` : ""}${seasonBadge}`

    this.sheetChartTarget.innerHTML =
      `<div style="color:var(--text-muted);font-size:0.75rem;text-align:center;padding-top:0.5rem;">Loading…</div>`

    this.sheetTarget.classList.add("is-open")
    this.sheetBackdropTarget.classList.add("is-open")

    this.loadSheetMap(taxonId)
    this.loadSheetChart(taxonId)
  }

  closeSheet() {
    this.sheetTarget.classList.remove("is-open")
    this.sheetBackdropTarget.classList.remove("is-open")
  }

  async loadSheetMap(taxonId) {
    const L = await this.loadLeaflet()
    const el = this.sheetMapContainerTarget

    if (!this.sheetMapInst) {
      const coords = getActiveCoords()
      const center = coords ? [coords.lat, coords.lng] : [20, 0]

      this.sheetMapInst = L.map(el, {
        zoomControl: true, scrollWheelZoom: false, attributionControl: false,
      }).setView(center, 9)

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 16,
      }).addTo(this.sheetMapInst)

      if (coords) {
        L.circleMarker([coords.lat, coords.lng], {
          radius: 6, color: "#4CAF50", fillColor: "#4CAF50", fillOpacity: 0.9, weight: 2,
        }).addTo(this.sheetMapInst)
      }
    }

    if (this.sheetHeatLayer) this.sheetMapInst.removeLayer(this.sheetHeatLayer)
    this.sheetHeatLayer = L.tileLayer(
      `https://api.inaturalist.org/v1/heatmap/{z}/{x}/{y}.png?taxon_id=${taxonId}`,
      { opacity: 0.7, maxZoom: 16 }
    ).addTo(this.sheetMapInst)

    setTimeout(() => this.sheetMapInst.invalidateSize(), 60)
  }

  async loadSheetChart(taxonId) {
    const coords = getActiveCoords()
    if (!coords) return
    try {
      const histogram = await getHistogram(taxonId, null, null, {
        lat: coords.lat, lng: coords.lng, radius: coords.radius ?? this.radiusValue,
      })
      this.renderChart(histogram)
    } catch { /* chart is optional */ }
  }

  renderChart(histogram) {
    const labels = ["J","F","M","A","M","J","J","A","S","O","N","D"]
    const counts = Array.from({ length: 12 }, (_, i) => histogram[i + 1] || 0)
    const max    = Math.max(...counts, 1)
    const cur    = new Date().getMonth()

    this.sheetChartTarget.innerHTML = labels.map((m, i) => {
      const h = Math.max(Math.round((counts[i] / max) * 100), 3)
      const active = i === cur
      return `
        <div class="dex-mini-col ${active ? "is-current" : ""}">
          <div class="dex-mini-bar-wrap">
            <div class="dex-mini-bar ${active ? "is-current" : ""}" style="height:${h}%"></div>
          </div>
          <span>${m}</span>
        </div>`
    }).join("")
  }

  // ─── Leaflet ───────────────────────────────────────────────────────────────

  async loadLeaflet() {
    if (!this.L) this.L = await import("leaflet")
    return this.L
  }
}
