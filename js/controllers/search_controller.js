import { Controller } from "@hotwired/stimulus"
import { parseInput, getUrlParams } from "../lib/url_parser.js"
import { searchTaxa, getTaxon, getObservation } from "../services/inat_api.js"
import { getEbirdSciName } from "../services/ebird_api.js"
import { getPrimaryLanguage } from "../services/settings_service.js"

export default class extends Controller {
  static targets = ["input", "results", "error"]

  connect() {
    this.debounceTimer = null
    this.checkUrlParams(false)
    window.addEventListener("popstate", () => this.checkUrlParams(false))
  }

  get navigateTo() {
    return this.element.dataset.searchNavigateTo || null
  }

  get requiresTaxon() {
    return this.element.dataset.searchRequiresTaxon != null
  }

  // Returns the focused input if it's one of ours, otherwise the visible one
  get activeInput() {
    const focused = this.inputTargets.find(el => el === document.activeElement)
    if (focused) return focused
    return this.inputTargets.find(el => el.offsetParent !== null) ?? this.inputTargets[0]
  }

  // Returns the results dropdown paired with the given input (nearest sibling), or the visible one
  activeResultsFor(input) {
    const idx = this.inputTargets.indexOf(input)
    if (idx !== -1 && this.resultsTargets[idx]) return this.resultsTargets[idx]
    return this.resultsTargets.find(el => el.offsetParent !== null) ?? this.resultsTargets[0]
  }

  get activeResults() {
    return this.activeResultsFor(this.activeInput)
  }

  async checkUrlParams(addToHistory = false) {
    const parsed = getUrlParams()
    console.log("[search] checkUrlParams", { parsed, navigateTo: this.navigateTo, requiresTaxon: this.requiresTaxon, search: window.location.search })
    if (!parsed) {
      if (this.requiresTaxon) {
        console.log("[search] no taxon in URL on taxon page → redirecting home")
        window.location.href = "index.html"
      }
      return
    }
    if (parsed.type === "error") {
      this.showError(parsed.message)
      return
    }
    if (this.navigateTo) {
      try {
        const taxonId = await this.toTaxonId(parsed)
        const originalUrl = new URLSearchParams(window.location.search).get("url")
        const dest = new URL(this.navigateTo, window.location)
        dest.searchParams.set("taxon_id", taxonId)
        if (originalUrl) dest.searchParams.set("url", originalUrl)
        window.location.href = dest.toString()
      } catch (e) {
        this.showError(e.message)
      }
      return
    }
    if (parsed.type === "merlin_species") {
      await this.resolveMerlin(parsed.value)
    } else {
      await this.resolve(parsed, addToHistory)
    }
  }

  onInput(event) {
    clearTimeout(this.debounceTimer)
    const input = event.currentTarget
    const value = input.value.trim()
    if (!value) {
      this.clearResults()
      return
    }
    this.debounceTimer = setTimeout(() => this.handleInput(value, input), 300)
  }

  async handleInput(value, input = this.activeInput) {
    const parsed = parseInput(value)
    if (!parsed) return

    if (parsed.type === "error") {
      this.showError(parsed.message)
      return
    }

    if (parsed.type === "search") {
      await this.showAutocomplete(parsed.value, input)
    } else if (parsed.type === "merlin_species") {
      await this.resolveMerlin(parsed.value)
    } else {
      await this.resolve(parsed)
    }
  }

  async toTaxonId(parsed) {
    if (parsed.type === "taxon_id") return parsed.value
    if (parsed.type === "observation_id") {
      const taxon = await getObservation(parsed.value)
      return taxon.id
    }
    if (parsed.type === "merlin_species") {
      const sciName = await getEbirdSciName(parsed.value)
      const results = await searchTaxa(sciName, getPrimaryLanguage(), null)
      if (!results.length) throw new Error(`No iNaturalist taxon found for "${sciName}".`)
      return results[0].id
    }
    throw new Error("Unrecognised input.")
  }

  async resolveMerlin(speciesCode) {
    this.clearError()
    this.dispatch("loading")
    try {
      const sciName = await getEbirdSciName(speciesCode)
      const results = await searchTaxa(sciName, getPrimaryLanguage(), null)
      if (!results.length) throw new Error(`No iNaturalist taxon found for "${sciName}".`)
      await this.resolve({ type: "taxon_id", value: results[0].id }, true)
    } catch (e) {
      this.showError(e.message)
    }
  }

  async showAutocomplete(query, input = this.activeInput) {
    try {
      const results = await searchTaxa(query, getPrimaryLanguage())
      this.renderResults(results, input)
    } catch (e) {
      this.showError("Search failed. Please try again.")
    }
  }

  renderResults(results, input = this.activeInput) {
    const resultsEl = this.activeResultsFor(input)
    this.clearError()
    if (!results.length) {
      resultsEl.innerHTML = `<div class="dropdown-item">No plants found.</div>`
      resultsEl.classList.add("is-active")
      return
    }

    resultsEl.innerHTML = results.map(t => `
      <a class="dropdown-item" data-action="click->search#selectResult" data-taxon-id="${t.id}">
        <div class="is-flex is-align-items-center">
          ${t.default_photo ? `<img src="${t.default_photo.square_url}" class="mr-2" style="width:32px;height:32px;border-radius:4px;object-fit:cover;">` : ""}
          <div>
            <strong>${t.preferred_common_name || t.name}</strong>
            <br><small class="has-text-grey">${t.name}</small>
          </div>
        </div>
      </a>
    `).join("")
    resultsEl.classList.add("is-active")
  }

  async selectResult(event) {
    event.preventDefault()
    const taxonId = event.currentTarget.dataset.taxonId
    this.clearResults()
    this.activeInput.value = ""
    if (this.navigateTo) {
      window.location.href = `${this.navigateTo}?taxon_id=${taxonId}`
      return
    }
    await this.resolve({ type: "taxon_id", value: taxonId }, true)
  }

  async resolve(parsed, addToHistory = true) {
    console.log("[search] resolve", parsed)
    this.clearError()
    this.dispatch("loading")

    try {
      let taxon
      if (parsed.type === "taxon_id") {
        taxon = await getTaxon(parsed.value, getPrimaryLanguage())
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

        console.log("[search] dispatching search:loaded for taxon", taxon.id)
        this.dispatch("loaded", { detail: { taxon } })
        if (window.location.hash) {
          setTimeout(() => {
            const el = document.querySelector(window.location.hash)
            if (el) el.scrollIntoView({ behavior: "instant", block: "start" })
          }, 300)
        }
      } else {
        console.warn("[search] taxon resolved to null/undefined for", parsed)
      }
    } catch (e) {
      console.error("[search] resolve error", e)
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
