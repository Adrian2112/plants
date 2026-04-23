import { Controller } from "@hotwired/stimulus"
import { getHistogram } from "../services/inat_api.js"
import { getActiveCoords, onLocationChange } from "../services/location_service.js"
import { getFiltersForTaxon } from "../services/taxon_filters.js"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default class extends Controller {
  static targets = ["chart", "filter", "empty"]

  connect() {
    this.taxonId = null
    this.filters = []
    this.cleanupLocationListener = onLocationChange(() => {
      if (this.taxonId) this.loadData()
    })
  }

  disconnect() {
    this.cleanupLocationListener?.()
  }

  show({ detail: { taxon } }) {
    this.taxonId = taxon.id
    this.filters = getFiltersForTaxon(taxon.iconic_taxon_name)
    this.renderFilterOptions()
    this.loadData()
  }

  renderFilterOptions() {
    this.filterTarget.innerHTML = this.filters
      .map(f => `<option>${f.label}</option>`)
      .join("")
  }

  async loadData() {
    const filter = this.filters[this.filterTarget.selectedIndex] || this.filters[0]
    const locationOpts = getActiveCoords() || {}
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
