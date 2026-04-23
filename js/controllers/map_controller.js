import { Controller } from "@hotwired/stimulus"
import { onCoordsReady, setActiveLocation, isCustomLocation, isLocationEnabled, onLocationChange } from "../services/location_service.js"

const DEFAULT_CENTER = [20, 0]
const DEFAULT_ZOOM = 3
const USER_ZOOM = 8

export default class extends Controller {
  static targets = ["container", "viewToggle"]

  connect() {
    this.map = null
    this.L = null
    this.heatmapLayer = null
    this.taxonId = null
    this.customMarker = null
    this.cleanupLocationListener = onLocationChange(() => {
      if (!isCustomLocation() && this.customMarker) {
        this.customMarker.remove()
        this.customMarker = null
      }
      if (this.map) this.renderViewToggle()
    })
  }

  disconnect() {
    this.cleanupLocationListener?.()
  }

  async show({ detail: { taxon } }) {
    this.taxonId = taxon.id

    if (!this.L) this.L = await import("leaflet")
    const L = this.L

    if (!this.map) {
      this.map = L.map(this.containerTarget, { zoomControl: true, scrollWheelZoom: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)

      this.containerTarget.addEventListener("wheel", (e) => {
        if (e.ctrlKey || e.metaKey) {
          this.map.scrollWheelZoom.enable()
        } else {
          this.map.scrollWheelZoom.disable()
        }
      })
      this.containerTarget._map = this.map

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 16,
      }).addTo(this.map)

      this.locateUser(L)
    }

    this.renderViewToggle()

    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer)
    }

    this.heatmapLayer = L.tileLayer(
      `https://api.inaturalist.org/v1/heatmap/{z}/{x}/{y}.png?taxon_id=${this.taxonId}`,
      { opacity: 0.5, maxZoom: 16 }
    ).addTo(this.map)

    setTimeout(() => this.map.invalidateSize(), 100)
  }

  renderViewToggle() {
    const active = isLocationEnabled() && isCustomLocation()
    this.viewToggleTarget.innerHTML = `
      <button class="button is-small ${active ? "is-success" : "is-outlined"}"
        data-action="click->map#filterByMapView"
        style="border-radius:999px;font-size:0.75rem;">
        🗺 Filter by map view
      </button>
    `
  }

  filterByMapView() {
    const center = this.map.getCenter()
    const bounds = this.map.getBounds()
    const radiusKm = Math.round(this.map.distance(center, bounds.getNorthEast()) / 1000)

    if (this.customMarker) this.customMarker.remove()
    this.customMarker = this.L.circleMarker([center.lat, center.lng], {
      radius: 6, color: "#ff9800", fillColor: "#ff9800", fillOpacity: 0.9,
    }).addTo(this.map)

    setActiveLocation(center.lat, center.lng, radiusKm)
  }

  locateUser(L) {
    onCoordsReady(({ lat, lng }) => {
      this.map.setView([lat, lng], USER_ZOOM)
      L.circleMarker([lat, lng], {
        radius: 6, color: "#4CAF50", fillColor: "#4CAF50", fillOpacity: 0.8,
      }).addTo(this.map)
    })
  }
}
