import { Controller } from "@hotwired/stimulus"
import { getBirdSounds } from "../services/xeno_canto_api.js"
import { getXenoCantoApiKey } from "../services/settings_service.js"

export default class extends Controller {
  static targets = ["container", "grid", "loadMore"]

  connect() {
    this.sciName = null
    this.page = 1
    this.numPages = 1
    this.activeAudio = null
  }

  show({ detail: { taxon } }) {
    if (taxon.iconic_taxon_name !== "Aves") {
      this.containerTarget.style.display = "none"
      return
    }
    this.containerTarget.style.display = ""
    this.sciName = taxon.name
    this.page = 1

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
      const { recordings, numPages, page } = await getBirdSounds(this.sciName, this.page)
      this.numPages = numPages

      if (page === 1) this.gridTarget.innerHTML = ""

      if (recordings.length === 0 && page === 1) {
        this.gridTarget.innerHTML = `<p class="has-text-grey is-size-7">No recordings found.</p>`
        this.loadMoreTarget.style.display = "none"
        return
      }

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

      this.loadMoreTarget.style.display = page < numPages ? "" : "none"
    } catch {
      this.gridTarget.innerHTML = `<p class="has-text-grey is-size-7">Unable to load sounds.</p>`
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

  onLoadMore(event) {
    event.preventDefault()
    this.page++
    this.loadSounds()
  }

  skeletons() {
    return Array(4).fill(`<div class="sound-item skeleton" style="height:4rem;border-radius:6px;"></div>`).join("")
  }

  disconnect() {
    this.activeAudio?.pause()
  }
}

function formatLength(len) {
  if (!len) return ""
  const parts = len.split(":")
  if (parts.length === 2) return `${parts[0]}m${parts[1]}s`
  return len
}
