import { Controller } from "@hotwired/stimulus"
import { saveBookmark, removeBookmark, isBookmarked, getAllBookmarks, getNoteCountForTaxon } from "../services/storage_service.js"

export default class extends Controller {
  static targets = ["star", "list", "toast", "savedCount", "panel", "filterInput"]

  connect() {
    this.taxon = null
    this.saved = false
    this.allBookmarks = []
    this.filterValue = ""
    if (this.hasListTarget) this.renderList()
    this.updateCount()
  }

  async show({ detail: { taxon } }) {
    this.taxon = taxon
    this.saved = await isBookmarked(taxon.id)
    this.updateStar()
  }

  updateStar() {
    if (!this.hasStarTarget) return
    this.starTarget.textContent = this.saved ? "★" : "☆"
    this.starTarget.classList.toggle("is-saved", this.saved)
  }

  async updateCount() {
    const bookmarks = await getAllBookmarks()
    const n = bookmarks.length
    this.savedCountTargets.forEach(el => {
      el.textContent = n
      el.style.display = n > 0 ? "" : "none"
    })
  }

  async toggle() {
    if (!this.taxon) return
    if (this.saved) {
      if (!confirm("Remove this plant from bookmarks?")) return
      await removeBookmark(this.taxon.id)
      this.saved = false
      this.showToast("Plant removed from bookmarks")
    } else {
      await saveBookmark(this.taxon)
      this.saved = true
      this.showToast("Plant saved for offline viewing")
    }
    this.updateStar()
    this.updateCount()
  }

  async autoBookmark(taxon) {
    if (await isBookmarked(taxon.id)) return
    await saveBookmark(taxon)
    this.saved = true
    this.updateStar()
    this.updateCount()
    this.showToast("Plant saved to bookmarks")
  }

  showToast(message) {
    if (!this.hasToastTarget) return
    this.toastTarget.textContent = message
    this.toastTarget.classList.add("is-active")
    setTimeout(() => this.toastTarget.classList.remove("is-active"), 3000)
  }

  onFilter() {
    this.filterValue = this.filterInputTarget.value.toLowerCase().trim()
    this.renderItems()
  }

  async renderList() {
    if (!this.hasListTarget) return
    const bookmarks = await getAllBookmarks()

    if (bookmarks.length === 0) {
      this.listTarget.innerHTML = `
        <p class="has-text-grey has-text-centered py-6">
          No saved plants yet. Search for a plant and tap the star to save it.
        </p>
      `
      return
    }

    bookmarks.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at))
    this.allBookmarks = await Promise.all(bookmarks.map(async b => ({
      ...b, noteCount: await getNoteCountForTaxon(b.taxon_id)
    })))
    this.renderItems()
  }

  renderItems() {
    if (!this.hasListTarget) return
    const items = this.filterValue
      ? this.allBookmarks.filter(b =>
          b.common_name.toLowerCase().includes(this.filterValue) ||
          b.scientific_name.toLowerCase().includes(this.filterValue))
      : this.allBookmarks

    if (items.length === 0) {
      this.listTarget.innerHTML = `<p class="has-text-grey has-text-centered py-4">No matches.</p>`
      return
    }

    this.listTarget.innerHTML = items.map(b => `
      <div class="bookmark-item">
        <a class="bookmark-link" href="/taxon?taxon_id=${b.taxon_id}">
          <div class="bookmark-thumb">
            ${b.thumbnail_url
              ? `<img src="${b.thumbnail_url}" alt="${b.common_name}">`
              : `<div class="bookmark-thumb-empty"></div>`}
          </div>
          <div class="bookmark-info">
            <div class="bookmark-name">${b.common_name}</div>
            <div class="bookmark-sci">${b.scientific_name}</div>
            <div class="bookmark-meta">
              ${relativeTime(b.saved_at)}
              ${b.noteCount > 0 ? `<span class="bookmark-notes-badge">📝 ${b.noteCount}</span>` : ""}
            </div>
          </div>
        </a>
        <button class="bookmark-remove" data-action="click->bookmark#removeFromList" data-taxon-id="${b.taxon_id}" title="Remove">✕</button>
      </div>
    `).join("")
  }

  async removeFromList(event) {
    const taxonId = parseInt(event.currentTarget.dataset.taxonId)
    if (!confirm("Remove this plant from bookmarks?")) return
    await removeBookmark(taxonId)
    await this.renderList()
    this.updateCount()
  }
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`
  const weeks = Math.floor(days / 7)
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`
}
