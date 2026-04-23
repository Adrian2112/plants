import { Controller } from "@hotwired/stimulus"
import { getUserSpecies } from "../services/inat_api.js"
import { getUsername } from "../services/settings_service.js"
import { getActiveCoords, onLocationChange } from "../services/location_service.js"

export default class extends Controller {
  static targets = ["section", "list"]

  connect() {
    this.allSpecies = []
    this.filterValue = ""
    this.cleanupLocationListener = onLocationChange(() => this.load())
    this.load()
  }

  disconnect() {
    this.cleanupLocationListener?.()
  }

  onSettingsChanged() {
    this.load()
  }

  onFilter({ target: { value } }) {
    this.filterValue = value.toLowerCase().trim()
    this.renderItems()
  }

  async load() {
    const username = getUsername()
    if (!username) {
      this.sectionTarget.style.display = "none"
      return
    }

    this.sectionTarget.style.display = ""
    this.listTarget.innerHTML = `<p class="has-text-grey">Loading…</p>`

    try {
      this.allSpecies = await getUserSpecies(username, getActiveCoords() || {})
      this.renderItems()
    } catch {
      this.listTarget.innerHTML = `<p class="has-text-grey">Unable to load observations.</p>`
    }
  }

  renderItems() {
    const items = this.filterValue
      ? this.allSpecies.filter(({ taxon }) =>
          (taxon.preferred_common_name || "").toLowerCase().includes(this.filterValue) ||
          taxon.name.toLowerCase().includes(this.filterValue))
      : this.allSpecies

    if (items.length === 0) {
      this.listTarget.innerHTML = `<p class="has-text-grey has-text-centered py-4">No species found.</p>`
      return
    }

    const groups = {}
    for (const entry of items) {
      const group = entry.taxon.iconic_taxon_name || "Other"
      if (!groups[group]) groups[group] = []
      groups[group].push(entry)
    }

    this.listTarget.innerHTML = Object.keys(groups).sort().map(group => `
      <details class="mt-3" ${this.filterValue ? "open" : ""}>
        <summary class="has-text-grey is-size-7 mb-2" style="cursor:pointer;text-transform:uppercase;letter-spacing:0.05em;display:flex;align-items:center;gap:0.4rem;">
          <span>${group}</span>
          <span class="tag is-small" style="font-size:0.65rem;">${groups[group].length}</span>
        </summary>
        <div class="bookmarks-list mt-2">
          ${groups[group].map(({ count, taxon }) => `
            <div class="bookmark-item">
              <a class="bookmark-link" href="taxon.html?taxon_id=${taxon.id}">
                <div class="bookmark-thumb">
                  ${taxon.default_photo?.square_url
                    ? `<img src="${taxon.default_photo.square_url}" alt="${taxon.preferred_common_name || taxon.name}">`
                    : `<div class="bookmark-thumb-empty"></div>`}
                </div>
                <div class="bookmark-info">
                  <div class="bookmark-name">${taxon.preferred_common_name || taxon.name}</div>
                  <div class="bookmark-sci">${taxon.name}</div>
                  <div class="bookmark-meta">${count} observation${count !== 1 ? "s" : ""}</div>
                </div>
              </a>
            </div>
          `).join("")}
        </div>
      </details>
    `).join("")
  }
}
