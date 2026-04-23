import { Controller } from "@hotwired/stimulus"
import { getObservationPhotos } from "../services/inat_api.js"
import { getActiveCoords, onLocationChange } from "../services/location_service.js"

const FILTERS = [
  { label: "All", termId: null, termValueId: null },
  { label: "Flowering", termId: 12, termValueId: 13 },
  { label: "Fruiting", termId: 12, termValueId: 14 },
  { label: "Green Leaves", termId: 36, termValueId: 38 },
  { label: "Budding", termId: 12, termValueId: 15 },
  { label: "Colored Leaves", termId: 36, termValueId: 39 },
  { label: "No Leaves", termId: 36, termValueId: 40 },
  { label: "Leaf Buds", termId: 36, termValueId: 37 },
]

export default class extends Controller {
  static targets = ["tabs", "grid", "empty", "loadMore", "lightbox", "lightboxImg", "lightboxCaption"]

  connect() {
    this.taxonId = null
    this.currentFilter = 0
    this.page = 1
    this.loading = false
    this.allPhotos = []
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
    this.renderTabs()
    this.switchFilter(0)
  }

  renderTabs() {
    this.tabsTarget.innerHTML = FILTERS.map((f, i) =>
      `<li class="${i === 0 ? "is-active" : ""}">
        <a data-action="click->gallery#onTabClick" data-index="${i}">${f.label}</a>
      </li>`
    ).join("")
  }

  onTabClick(event) {
    event.preventDefault()
    const index = parseInt(event.currentTarget.dataset.index)
    this.switchFilter(index)
  }

  switchFilter(index) {
    this.currentFilter = index
    this.page = 1
    this.allPhotos = []

    this.tabsTarget.querySelectorAll("li").forEach((li, i) => {
      li.classList.toggle("is-active", i === index)
    })

    this.gridTarget.innerHTML = this.skeletons()
    this.loadPhotos()
  }

  async loadPhotos() {
    if (this.loading) return
    this.loading = true
    this.loadMoreTarget.style.display = "none"

    const filter = FILTERS[this.currentFilter]
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
        if (this.allPhotos.length < totalResults) {
          this.loadMoreTarget.style.display = ""
        }
      }
      this.page++
    } catch (e) {
      if (this.page === 1) this.showEmpty("Unable to load photos.")
    }
    this.loading = false
  }

  appendPhotos(photos) {
    const startIndex = this.allPhotos.length
    this.allPhotos.push(...photos)

    const html = photos.map((p, i) => `
      <div class="gallery-item" data-action="click->gallery#openLightbox" data-photo-index="${startIndex + i}">
        <img src="${p.small}" alt="Observation photo" loading="lazy">
      </div>
    `).join("")

    this.gridTarget.insertAdjacentHTML("beforeend", html)
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

  // Lightbox

  openLightbox(event) {
    const index = parseInt(event.currentTarget.dataset.photoIndex)
    this.lightboxIndex = index
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
    const photo = this.allPhotos[this.lightboxIndex]
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
    if (this.lightboxIndex > 0) {
      this.lightboxIndex--
      this.showLightboxPhoto()
    }
  }

  nextPhoto(event) {
    event?.stopPropagation()
    if (this.lightboxIndex < this.allPhotos.length - 1) {
      this.lightboxIndex++
      this.showLightboxPhoto()
    }
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
