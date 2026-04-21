import { Controller } from "@hotwired/stimulus"
import { getHistogram } from "../services/inat_api.js"
import { cloneTemplate } from "../lib/templates.js"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const FILTERS = [
  { label: "All", termId: null, termValueId: null },
  { label: "Flowering", termId: 12, termValueId: 13 },
  { label: "Fruiting", termId: 12, termValueId: 14 },
  { label: "Budding", termId: 12, termValueId: 15 },
]

export default class extends Controller {
  static targets = ["chart", "filter", "empty", "locationToggle", "locationBtn"]

  connect() {
    this.element.style.display = "none"
    this.taxonId = null
    this.coords = null
    this.nearMe = false
  }

  show({ detail: { taxon } }) {
    this.taxonId = taxon.id
    this.element.style.display = ""
    this.loadData()
    this.requestLocation()
  }

  requestLocation() {
    if (!navigator.geolocation) return
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
    this.locationBtnTarget.style.display = ""
    this.locationBtnTarget.classList.toggle("is-success", this.nearMe)
    this.locationBtnTarget.classList.toggle("is-outlined", !this.nearMe)
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

    this.chartTarget.innerHTML = ""
    for (const [month, count] of Object.entries(histogram)) {
      const frag = cloneTemplate("tpl-seasonality-row")
      const row = frag.querySelector(".seasonality-row")
      const likelihood = count > 0 ? Math.max(1, Math.round((count / max) * 100)) : 0
      row.classList.toggle("is-current", parseInt(month) === currentMonth)
      row.querySelector(".seasonality-label").textContent = MONTHS[parseInt(month) - 1]
      row.querySelector(".seasonality-bar").style.width = `${likelihood}%`
      this.chartTarget.appendChild(frag)
    }
  }

  showEmpty(message) {
    this.chartTarget.innerHTML = ""
    this.emptyTarget.style.display = ""
    this.emptyTarget.textContent = message
  }
}
