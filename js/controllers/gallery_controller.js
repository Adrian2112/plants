import { Controller } from "@hotwired/stimulus"
import { getObservationPhotos } from "../services/inat_api.js"
import { getActiveCoords, onLocationChange } from "../services/location_service.js"
import { getFiltersForTaxon } from "../services/taxon_filters.js"
import { getUsername } from "../services/settings_service.js"

export default class extends Controller {
  static targets = ["tabs", "grid", "empty", "loadMore", "mineSection", "mineGrid", "lightbox", "lightboxImg", "lightboxCaption"]

  connect() {
    this.taxonId = null
    this.filters = []
    this.currentFilter = 0
    this.page = 1
    this.loading = false
    this.allPhotos = []
    this.minePhotos = []
    this.lightboxPhotos = []
    this.lightboxIndex = 0

    this.handleKey = this.handleKey.bind(this)
    this.handleSwipeStart = this.handleSwipeStart.bind(this)
    this.handleSwipeEnd = this.handleSwipeEnd.bind(this)

    this.cleanupLocationListener = onLocationChange(() => {
      if (this.taxonId) this.switchFilter(this.currentFilter)
    })
  }

  disconnect() {
    this.cleanupLocationListener?.()
  }

  show({ detail: { taxon } }) {
    this.taxonId = taxon.id
    this.filters = getFiltersForTaxon(taxon.iconic_taxon_name)
    this.renderTabs()
    this.switchFilter(0)
    this.loadMinePhotos()
  }

  // Tabs & main grid

  renderTabs() {
    this.tabsTarget.innerHTML = this.filters.map((f, i) =>
      `<li class="${i === 0 ? "is-active" : ""}">
        <a data-action="click->gallery#onTabClick" data-index="${i}">${f.label}</a>
      </li>`
    ).join("")
  }

  onTabClick(event) {
    event.preventDefault()
    this.switchFilter(parseInt(event.currentTarget.dataset.index))
  }

  switchFilter(index) {
    this.currentFilter = index
    this.page = 1
    this.allPhotos = []
    this.tabsTarget.querySelectorAll("li").forEach((li, i) => li.classList.toggle("is-active", i === index))
    this.gridTarget.innerHTML = this.skeletons()
    this.loadPhotos()
  }

  async loadPhotos() {
    if (this.loading) return
    this.loading = true
    this.loadMoreTarget.style.display = "none"

    const filter = this.filters[this.currentFilter] || this.filters[0]
    try {
      const locationOpts = getActiveCoords() || {}
      const { photos, totalResults } = await getObservationPhotos(this.taxonId, {
        termId: filter.termId,
        termValueId: filter.termValueId,
        page: this.page,
        ...locationOpts,
      })

      if (this.page === 1) this.gridTarget.innerHTML = ""

      if (photos.length === 0 && this.page === 1) {
        this.showEmpty(`No ${filter.label.toLowerCase()} photos available for this species.`)
      } else {
        this.emptyTarget.style.display = "none"
        this.appendPhotos(photos)
        if (this.allPhotos.length < totalResults) this.loadMoreTarget.style.display = ""
      }
      this.page++
    } catch {
      if (this.page === 1) this.showEmpty("Unable to load photos.")
    }
    this.loading = false
  }

  appendPhotos(photos) {
    const startIndex = this.allPhotos.length
    this.allPhotos.push(...photos)
    this.gridTarget.insertAdjacentHTML("beforeend", photos.map((p, i) => `
      <div class="gallery-item" data-action="click->gallery#openLightbox" data-photo-index="${startIndex + i}">
        <img src="${p.small}" alt="Observation photo" loading="lazy">
      </div>
    `).join(""))
  }

  onLoadMore(event) {
    event.preventDefault()
    this.loadPhotos()
  }

  showEmpty(message) {
    this.gridTarget.innerHTML = ""
    this.emptyTarget.style.display = ""
    this.emptyTarget.textContent = message
    this.loadMoreTarget.style.display = "none"
  }

  skeletons() {
    return Array(6).fill('<div class="gallery-item skeleton"></div>').join("")
  }

  // Mine section

  async loadMinePhotos() {
    const username = getUsername()
    this.mineSectionTarget.style.display = "none"
    if (!username) return

    try {
      const { photos } = await getObservationPhotos(this.taxonId, { userLogin: username, perPage: 30 })
      if (photos.length === 0) return
      this.minePhotos = photos
      this.mineSectionTarget.style.display = ""
      this.mineGridTarget.innerHTML = photos.map((p, i) => `
        <div class="gallery-item" data-action="click->gallery#openMineLightbox" data-mine-index="${i}">
          <img src="${p.small}" alt="My observation" loading="lazy">
        </div>
      `).join("")
    } catch { /* silently skip */ }
  }

  // Lightbox

  openLightbox(event) {
    this.lightboxPhotos = this.allPhotos
    this.lightboxIndex = parseInt(event.currentTarget.dataset.photoIndex)
    this.showLightbox()
  }

  openMineLightbox(event) {
    this.lightboxPhotos = this.minePhotos
    this.lightboxIndex = parseInt(event.currentTarget.dataset.mineIndex)
    this.showLightbox()
  }

  showLightbox() {
    this.showLightboxPhoto()
    this.lightboxTarget.classList.add("is-active")
    document.addEventListener("keydown", this.handleKey)
    this.lightboxTarget.addEventListener("touchstart", this.handleSwipeStart, { passive: true })
    this.lightboxTarget.addEventListener("touchend", this.handleSwipeEnd, { passive: true })
  }

  closeLightbox() {
    this.lightboxTarget.classList.remove("is-active")
    document.removeEventListener("keydown", this.handleKey)
    this.lightboxTarget.removeEventListener("touchstart", this.handleSwipeStart)
    this.lightboxTarget.removeEventListener("touchend", this.handleSwipeEnd)
  }

  showLightboxPhoto() {
    const photo = this.lightboxPhotos[this.lightboxIndex]
    if (!photo) return
    const img = this.lightboxImgTarget
    img.onerror = null
    if (!navigator.onLine) {
      img.src = photo.small
    } else {
      img.src = photo.large || photo.small
      img.onerror = () => { img.onerror = null; img.src = photo.small }
    }
    this.lightboxCaptionTarget.innerHTML = `
      <span>${photo.attribution || ""}</span>
      ${photo.date ? `<span class="ml-2">${photo.date}</span>` : ""}
    `
  }

  prevPhoto(event) {
    event?.stopPropagation()
    if (this.lightboxIndex > 0) { this.lightboxIndex--; this.showLightboxPhoto() }
  }

  nextPhoto(event) {
    event?.stopPropagation()
    if (this.lightboxIndex < this.lightboxPhotos.length - 1) { this.lightboxIndex++; this.showLightboxPhoto() }
  }

  handleKey(event) {
    if (event.key === "Escape") this.closeLightbox()
    if (event.key === "ArrowLeft") this.prevPhoto()
    if (event.key === "ArrowRight") this.nextPhoto()
  }

  handleSwipeStart(event) {
    this.touchStartX = event.changedTouches[0].screenX
  }

  handleSwipeEnd(event) {
    const diff = event.changedTouches[0].screenX - this.touchStartX
    if (Math.abs(diff) > 50) {
      if (diff > 0) this.prevPhoto()
      else this.nextPhoto()
    }
  }
}
