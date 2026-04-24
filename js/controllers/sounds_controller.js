import { Controller } from "@hotwired/stimulus"
import { getSounds } from "../services/xeno_canto_api.js"
import { getXenoCantoApiKey } from "../services/settings_service.js"
import { getActiveCoords } from "../services/location_service.js"

export default class extends Controller {
  static targets = ["container", "grid", "loadMore"]

  connect() {
    this.sciName = null
    this.activeAudio = null
  }

  show({ detail: { taxon } }) {
    this.stopAudio()
    const supported = ["Aves", "Mammalia", "Amphibia", "Insecta"]
    if (!supported.includes(taxon.iconic_taxon_name)) {
      this.containerTarget.style.display = "none"
      this.setNavLink(false)
      return
    }
    this.containerTarget.style.display = ""
    this.sciName = taxon.name

    if (!getXenoCantoApiKey()) {
      this.gridTarget.innerHTML = `<p class="has-text-grey is-size-7">Add a Xeno-canto API key in <a href="#" data-action="click->settings#open">Settings</a> to load sounds.</p>`
      this.loadMoreTarget.style.display = "none"
      return
    }

    this.gridTarget.innerHTML = this.skeletons()
    this.loadSounds()
  }

  async loadSounds() {
    try {
      const { recordings } = await getSounds(this.sciName, getActiveCoords())

      if (recordings.length === 0) {
        this.containerTarget.style.display = "none"
        this.setNavLink(false)
        return
      }

      this.gridTarget.innerHTML = ""
      this.gridTarget.insertAdjacentHTML("beforeend", recordings.map(r => `
        <div class="sound-item">
          <div class="sound-info">
            ${r.loc ? `<div class="is-size-7">${r.loc}</div>` : ""}
            <div class="has-text-grey is-size-7">${[r.date, r.rec].filter(Boolean).join(" · ")}</div>
          </div>
          <div class="sound-play-group">
            <span class="has-text-grey is-size-7">${formatLength(r.length)}</span>
            <button class="sound-play-btn" data-file="${r.file}" data-action="click->sounds#togglePlay" aria-label="Play">▶</button>
          </div>
        </div>
      `).join(""))

      this.loadMoreTarget.style.display = "none"
      this.setNavLink(true)
    } catch {
      this.containerTarget.style.display = "none"
      this.setNavLink(false)
    }
  }

  togglePlay(event) {
    const btn = event.currentTarget
    const file = btn.dataset.file

    if (this.activeAudio && !this.activeAudio.paused) {
      this.activeAudio.pause()
      this.activeAudio = null
      this.gridTarget.querySelectorAll(".sound-play-btn").forEach(b => b.textContent = "▶")
      if (btn.dataset.active) { delete btn.dataset.active; return }
    }

    const audio = new Audio(file)
    this.activeAudio = audio
    btn.textContent = "⏹"
    btn.dataset.active = "1"
    audio.play()
    audio.onended = () => { btn.textContent = "▶"; delete btn.dataset.active; this.activeAudio = null }
    audio.onerror = () => { btn.textContent = "▶"; delete btn.dataset.active; this.activeAudio = null }
  }

  setNavLink(visible) {
    const link = document.querySelector("a[href='#section-sounds']")
    if (link) link.style.display = visible ? "" : "none"
  }

  skeletons() {
    return Array(4).fill(`<div class="sound-item skeleton" style="height:4rem;border-radius:6px;"></div>`).join("")
  }

  stopAudio() {
    if (this.activeAudio) {
      this.activeAudio.pause()
      this.activeAudio = null
    }
  }

  disconnect() {
    this.stopAudio()
  }
}

function formatLength(len) {
  if (!len) return ""
  const parts = len.split(":")
  if (parts.length === 2) return `${parts[0]}m${parts[1]}s`
  return len
}
