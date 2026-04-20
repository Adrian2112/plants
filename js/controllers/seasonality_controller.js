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
  static targets = ["chart", "filter", "empty"]

  connect() {
    this.element.style.display = "none"
    this.taxonId = null
  }

  show({ detail: { taxon } }) {
    this.taxonId = taxon.id
    this.element.style.display = ""
    this.loadData()
  }

  async loadData() {
    const filter = FILTERS[this.filterTarget.selectedIndex || 0]
    try {
      const histogram = await getHistogram(this.taxonId, filter.termId, filter.termValueId)
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
      const likelihood = Math.round((count / max) * 100)
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
