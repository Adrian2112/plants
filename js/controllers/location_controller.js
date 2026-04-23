import { Controller } from "@hotwired/stimulus"
import {
  getUserCoords, getActiveCoords, isCustomLocation, isLocationEnabled, getLocationName,
  setLocationEnabled, setActiveLocation, resetToUserLocation, onLocationChange,
} from "../services/location_service.js"

export default class extends Controller {
  static targets = ["toggle"]

  connect() {
    this.debounceTimer = null
    this.cleanupListener = onLocationChange(() => this.render())
    this.render()
  }

  disconnect() {
    this.cleanupListener?.()
  }

  render() {
    const name = isCustomLocation() ? (getLocationName() || "Near location") : ""
    const html = `
      <div class="location-search" style="position:relative;">
        <div class="control has-icons-left" style="width:170px;">
          <input class="input is-small location-search-input" type="text"
            placeholder="Near me"
            value="${name}"
            autocomplete="off"
            data-action="input->location#onInput focus->location#onFocus blur->location#onBlur"
            style="border-radius:999px;font-size:0.75rem;padding-left:1.75rem;${isLocationEnabled() ? "border-color:#4CAF50;" : ""}">
          <span class="icon is-left is-small" style="pointer-events:none;">📍</span>
        </div>
        <div class="location-search-dropdown box p-0" style="display:none;position:absolute;top:calc(100% + 4px);left:0;min-width:220px;z-index:100;overflow:hidden;"></div>
      </div>
    `
    this.toggleTargets.forEach(el => { el.innerHTML = html })
  }

  onFocus(event) {
    const input = event.currentTarget
    this.showDropdown(input, [])
  }

  onBlur(event) {
    const input = event.currentTarget
    setTimeout(() => {
      const dropdown = this.getDropdown(input)
      if (dropdown) dropdown.style.display = "none"
    }, 150)
  }

  onInput(event) {
    clearTimeout(this.debounceTimer)
    const input = event.currentTarget
    const query = input.value.trim()
    if (!query) { this.showDropdown(input, []); return }
    this.debounceTimer = setTimeout(() => this.search(input, query), 300)
  }

  async search(input, query) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
        headers: { "Accept-Language": "en" }
      })
      const results = await res.json()
      this.showDropdown(input, results)
    } catch { /* ignore */ }
  }

  showDropdown(input, results) {
    const dropdown = this.getDropdown(input)
    if (!dropdown) return
    const items = [
      `<a class="dropdown-item" style="font-size:0.85rem;" data-action="click->location#selectNearMe">📍 Near me</a>`,
      ...results.map(r => {
        const label = r.display_name.split(",").slice(0, 2).join(",").trim()
        return `<a class="dropdown-item" style="font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" data-action="click->location#selectResult" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${label}">${label}</a>`
      })
    ]
    dropdown.innerHTML = items.join("")
    dropdown.style.display = ""
  }

  selectNearMe(event) {
    event.preventDefault()
    resetToUserLocation()
    setLocationEnabled(!!getUserCoords())
    this.closeDropdown(event.currentTarget)
  }

  selectResult(event) {
    event.preventDefault()
    const { lat, lng, name } = event.currentTarget.dataset
    setActiveLocation(parseFloat(lat), parseFloat(lng), 50)
    this.closeDropdown(event.currentTarget)
  }

  closeDropdown(el) {
    const dropdown = el.closest(".location-search")?.querySelector(".location-search-dropdown")
    if (dropdown) dropdown.style.display = "none"
  }

  getDropdown(input) {
    return input.closest(".location-search")?.querySelector(".location-search-dropdown")
  }
}
