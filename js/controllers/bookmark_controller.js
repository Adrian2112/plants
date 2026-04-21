import { Controller } from "@hotwired/stimulus"
import { saveBookmark, removeBookmark, isBookmarked, getAllBookmarks, getNoteCountForTaxon } from "../services/storage_service.js"

export default class extends Controller {
  static targets = ["star", "list", "toast", "savedCount"]
  static values = { page: Boolean }

  connect() {
    this.taxon = null
    this.saved = false
    if (this.pageValue && this.hasListTarget) this.renderList()
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

  // Bookmarks list page

  async renderList() {
    if (!this.hasListTarget) return
    const bookmarks = await getAllBookmarks()

    if (bookmarks.length === 0) {
      this.listTarget.innerHTML = `
        <p class="has-text-grey has-text-centered py-6">
          No saved plants yet. Search for a plant and tap Save to add it here.
        </p>
      `
      return
    }

    bookmarks.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at))

    const items = await Promise.all(bookmarks.map(async (b) => {
      const noteCount = await getNoteCountForTaxon(b.taxon_id)
      return `
        <div class="box mb-3">
          <article class="media">
            <figure class="media-left">
              <p class="image is-64x64">
                ${b.thumbnail_url ? `<img src="${b.thumbnail_url}" style="border-radius:4px;object-fit:cover;width:64px;height:64px;">` : ""}
              </p>
            </figure>
            <div class="media-content">
              <a href="/?taxon_id=${b.taxon_id}" class="has-text-dark">
                <strong>${b.common_name}</strong>
                <br><small class="has-text-grey is-italic">${b.scientific_name}</small>
              </a>
              <br>
              <small class="has-text-grey-light">${relativeTime(b.saved_at)}</small>
              ${noteCount > 0 ? `<span class="tag is-small is-info is-light ml-2">${noteCount} note${noteCount > 1 ? "s" : ""}</span>` : ""}
            </div>
            <div class="media-right">
              <button class="delete" data-action="click->bookmark#removeFromList" data-taxon-id="${b.taxon_id}"></button>
            </div>
          </article>
        </div>
      `
    }))

    this.listTarget.innerHTML = items.join("")
  }

  async removeFromList(event) {
    const taxonId = parseInt(event.currentTarget.dataset.taxonId)
    if (!confirm("Remove this plant from bookmarks?")) return
    await removeBookmark(taxonId)
    this.renderList()
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
