import { Controller } from "@hotwired/stimulus"
import { parseInput, getUrlParams } from "../lib/url_parser.js"
import { searchTaxa, getTaxon, getObservation } from "../services/inat_api.js"
import { cloneTemplate } from "../lib/templates.js"

export default class extends Controller {
  static targets = ["input", "results", "error"]

  connect() {
    this.debounceTimer = null
    this.checkUrlParams(false)
    window.addEventListener("popstate", () => this.checkUrlParams(false))
  }

  // Returns the currently visible input (navbar on desktop, main on mobile)
  get activeInput() {
    return this.inputTargets.find(el => el.offsetParent !== null) ?? this.inputTargets[0]
  }

  // Returns the results dropdown associated with the visible input
  get activeResults() {
    return this.resultsTargets.find(el => el.offsetParent !== null) ?? this.resultsTargets[0]
  }

  async checkUrlParams(addToHistory = false) {
    const parsed = getUrlParams()
    if (!parsed) return
    if (parsed.type === "error") {
      this.showError(parsed.message)
      return
    }
    await this.resolve(parsed, addToHistory)
  }

  onInput() {
    clearTimeout(this.debounceTimer)
    const value = this.activeInput.value.trim()
    if (!value) {
      this.clearResults()
      return
    }
    this.debounceTimer = setTimeout(() => this.handleInput(value), 300)
  }

  async handleInput(value) {
    const parsed = parseInput(value)
    if (!parsed) return

    if (parsed.type === "error") {
      this.showError(parsed.message)
      return
    }

    if (parsed.type === "search") {
      await this.showAutocomplete(parsed.value)
    } else {
      await this.resolve(parsed)
    }
  }

  async showAutocomplete(query) {
    try {
      const results = await searchTaxa(query)
      this.renderResults(results)
    } catch (e) {
      this.showError("Search failed. Please try again.")
    }
  }

  renderResults(results) {
    this.clearError()
    if (!results.length) {
      this.activeResults.innerHTML = `<div class="dropdown-item">No plants found.</div>`
      this.activeResults.classList.add("is-active")
      return
    }

    this.activeResults.innerHTML = ""
    for (const t of results) {
      const frag = cloneTemplate("tpl-search-result")
      frag.querySelector(".dropdown-item").dataset.taxonId = t.id
      if (t.default_photo) {
        const img = frag.querySelector(".search-result-img")
        img.src = t.default_photo.square_url
        img.alt = t.preferred_common_name || t.name
        img.hidden = false
      }
      frag.querySelector(".search-result-name").textContent = t.preferred_common_name || t.name
      frag.querySelector(".search-result-sci").textContent = t.name
      this.activeResults.appendChild(frag)
    }
    this.activeResults.classList.add("is-active")
  }

  async selectResult(event) {
    event.preventDefault()
    const taxonId = event.currentTarget.dataset.taxonId
    this.clearResults()
    this.activeInput.value = ""
    await this.resolve({ type: "taxon_id", value: taxonId }, true)
  }

  async resolve(parsed, addToHistory = true) {
    this.clearError()
    this.dispatch("loading")

    try {
      let taxon
      if (parsed.type === "taxon_id") {
        taxon = await getTaxon(parsed.value)
      } else if (parsed.type === "observation_id") {
        taxon = await getObservation(parsed.value)
      }

      if (taxon) {
        if (addToHistory) {
          const url = new URL(window.location)
          url.searchParams.set("taxon_id", taxon.id)
          url.searchParams.delete("url")
          window.history.pushState({ taxonId: taxon.id }, "", url)
        }

        this.dispatch("loaded", { detail: { taxon } })
        if (window.location.hash) {
          setTimeout(() => {
            const el = document.querySelector(window.location.hash)
            if (el) el.scrollIntoView({ behavior: "instant", block: "start" })
          }, 300)
        }
      }
    } catch (e) {
      this.showError(e.message)
    }
  }

  showError(message) {
    this.clearResults()
    this.errorTarget.innerHTML = `
      <div class="notification is-danger is-light">
        <button class="delete" data-action="click->search#clearError"></button>
        ${message}
      </div>
    `
  }

  clearError() {
    this.errorTarget.innerHTML = ""
  }

  clearResults() {
    this.resultsTargets.forEach(el => {
      el.innerHTML = ""
      el.classList.remove("is-active")
    })
  }
}
