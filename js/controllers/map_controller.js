import { Controller } from "@hotwired/stimulus"

const DEFAULT_CENTER = [20, 0]
const DEFAULT_ZOOM = 3
const USER_ZOOM = 8

export default class extends Controller {
  static targets = ["container"]

  connect() {
    this.element.style.display = "none"
    this.map = null
    this.heatmapLayer = null
    this.taxonId = null
  }

  async show({ detail: { taxon } }) {
    this.taxonId = taxon.id
    this.element.style.display = ""

    const L = await import("leaflet")

    if (!this.map) {
      this.map = L.map(this.containerTarget, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      this.containerTarget._map = this.map

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 16,
      }).addTo(this.map)

      this.locateUser(L)
    }

    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer)
    }

    this.heatmapLayer = L.tileLayer(
      `https://api.inaturalist.org/v1/heatmap/{z}/{x}/{y}.png?taxon_id=${this.taxonId}`,
      { opacity: 0.5, maxZoom: 16 }
    ).addTo(this.map)

    setTimeout(() => this.map.invalidateSize(), 100)
  }

  locateUser(L) {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        this.map.setView([latitude, longitude], USER_ZOOM)
        L.circleMarker([latitude, longitude], {
          radius: 6, color: "#4CAF50", fillColor: "#4CAF50", fillOpacity: 0.8,
        }).addTo(this.map)
      },
      () => {}
    )
  }
}
