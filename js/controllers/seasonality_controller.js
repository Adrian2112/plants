import { Controller } from "@hotwired/stimulus"
import { getHistogram } from "../services/inat_api.js"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const FILTERS = [
  { label: "All", termId: null, termValueId: null },
  { label: "Flowering", termId: 12, termValueId: 13 },
  { label: "Fruiting", termId: 12, termValueId: 14 },
  { label: "Budding", termId: 12, termValueId: 15 },
]

export default class extends Controller {
  static targets = ["chart", "filter", "empty", "locationToggle"]

  connect() {
    this.taxonId = null
    this.coords = null
    this.nearMe = false
  }

  show({ detail: { taxon } }) {
    this.taxonId = taxon.id
    this.loadData()
    this.requestLocation()
  }

  requestLocation() {
    if (!navigator.geolocation || !navigator.onLine) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.coords = { lat: coords.latitude, lng: coords.longitude }
        this.nearMe = true
        this.renderLocationToggle()
        this.loadData()
      },
      () => {}
    )
  }

  renderLocationToggle() {
    this.locationToggleTarget.innerHTML = `
      <button class="button is-small ${this.nearMe ? "is-success" : "is-outlined"}"
        data-action="click->seasonality#toggleLocation"
        style="border-radius:999px;font-size:0.75rem;">
        📍 Near me
      </button>
    `
  }

  toggleLocation() {
    this.nearMe = !this.nearMe
    this.renderLocationToggle()
    this.loadData()
  }

  async loadData() {
    const filter = FILTERS[this.filterTarget.selectedIndex || 0]
    const locationOpts = (this.nearMe && this.coords) ? this.coords : {}
    try {
      const histogram = await getHistogram(this.taxonId, filter.termId, filter.termValueId, locationOpts)
      this.renderChart(histogram)
    } catch (e) {
      this.showEmpty("Unable to load seasonality data.")
    }
  }

  onFilterChange() {
    this.loadData()
  }

  renderChart(histogram) {
    if (!histogram || Object.keys(histogram).length === 0) {
      this.showEmpty("Not enough data to show seasonality for this filter.")
      return
    }

    this.emptyTarget.style.display = "none"
    const max = Math.max(...Object.values(histogram))
    if (max === 0) {
      this.showEmpty("Not enough data to show seasonality for this filter.")
      return
    }

    const currentMonth = new Date().getMonth() + 1

    this.chartTarget.innerHTML = Object.entries(histogram).map(([month, count]) => {
      const likelihood = count > 0 ? Math.max(1, Math.round((count / max) * 100)) : 0
      const isCurrent = parseInt(month) === currentMonth
      const label = MONTHS[parseInt(month) - 1]
      return `
        <div class="seasonality-row ${isCurrent ? "is-current" : ""}">
          <span class="seasonality-label">${label}</span>
          <div class="seasonality-bar-track">
            <div class="seasonality-bar" style="width:${likelihood}%"></div>
          </div>
        </div>
      `
    }).join("")
  }

  showEmpty(message) {
    this.chartTarget.innerHTML = ""
    this.emptyTarget.style.display = ""
    this.emptyTarget.textContent = message
  }
}
