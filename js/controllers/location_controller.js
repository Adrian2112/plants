import { Controller } from "@hotwired/stimulus"
import {
  getUserCoords, isCustomLocation, isLocationEnabled,
  setLocationEnabled, resetToUserLocation, onLocationChange,
} from "../services/location_service.js"

export default class extends Controller {
  static targets = ["toggle"]

  connect() {
    this.cleanupListener = onLocationChange(() => this.render())
  }

  disconnect() {
    this.cleanupListener?.()
  }

  toggle() {
    setLocationEnabled(!isLocationEnabled())
  }

  reset(event) {
    event.stopPropagation()
    resetToUserLocation()
  }

  render() {
    if (!getUserCoords() && !isCustomLocation()) {
      this.toggleTargets.forEach(el => { el.innerHTML = "" })
      return
    }

    const enabled = isLocationEnabled()
    const isCustom = isCustomLocation()
    const label = isCustom ? "Near location" : "Near me"
    const html = `
      <button class="button is-small ${enabled ? "is-success" : "is-outlined"}"
        data-action="click->location#toggle"
        style="border-radius:999px;font-size:0.75rem;">
        📍 ${label}
      </button>
      ${isCustom ? `<button class="button is-small ml-1" data-action="click->location#reset" style="border-radius:999px;font-size:0.75rem;" title="Reset to GPS location">↩ Near me</button>` : ""}
    `
    this.toggleTargets.forEach(el => { el.innerHTML = html })
  }
}
