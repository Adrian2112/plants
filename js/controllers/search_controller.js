import { Controller } from "@hotwired/stimulus"
import { parseInput, getUrlParams } from "../lib/url_parser.js"
import { searchTaxa, getTaxon, getObservation } from "../services/inat_api.js"

export default class extends Controller {
  static targets = ["input", "results", "error"]

  connect() {
    this.debounceTimer = null
    this.checkUrlParams()
  }

  async checkUrlParams() {
    const parsed = getUrlParams()
    if (!parsed) return
    if (parsed.type === "error") {
      this.showError(parsed.message)
      return
    }
    await this.resolve(parsed)
  }

  onInput() {
    clearTimeout(this.debounceTimer)
    const value = this.inputTarget.value.trim()
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
      this.resultsTarget.innerHTML = `<div class="dropdown-item">No plants found.</div>`
      this.resultsTarget.classList.add("is-active")
      return
    }

    this.resultsTarget.innerHTML = results.map(t => `
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
    this.resultsTarget.classList.add("is-active")
  }

  async selectResult(event) {
    event.preventDefault()
    const taxonId = event.currentTarget.dataset.taxonId
    this.clearResults()
    this.inputTarget.value = ""
    await this.resolve({ type: "taxon_id", value: taxonId })
  }

  async resolve(parsed) {
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
        const url = new URL(window.location)
        url.searchParams.set("taxon_id", taxon.id)
        url.searchParams.delete("url")
        window.history.replaceState({}, "", url)

        this.dispatch("loaded", { detail: { taxon } })
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
    this.resultsTarget.innerHTML = ""
    this.resultsTarget.classList.remove("is-active")
  }
}
