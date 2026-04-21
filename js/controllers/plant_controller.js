import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]

  show({ detail: { taxon } }) {
    this.render(taxon)
    document.title = `${taxon.preferred_common_name || taxon.name} — PlantScope`
    const nav = document.getElementById("section-nav")
    if (nav) nav.style.display = ""
  }

  render(taxon) {
    const commonName = taxon.preferred_common_name || taxon.name
    const scientificName = taxon.name
    const photo = taxon.default_photo
    const summary = taxon.wikipedia_summary || ""
    const wikiUrl = taxon.wikipedia_url

    const ancestors = (taxon.ancestors || [])
      .filter(a => a.rank_level >= 20)
      .map(a => a.name)
      .join(" › ")

    const heroPhoto = photo ? `
      <figure class="image is-3by2 plant-hero-image">
        <img src="${photo.medium_url}" alt="${commonName}" style="object-fit:cover;border-radius:8px;">
      </figure>
    ` : ""

    const aboutBox = summary ? `
      <div class="box mt-4">
        <h2 class="title is-5 mb-3">About</h2>
        <p>${summary}</p>
        ${wikiUrl ? `
          <p class="mt-3">
            <a href="${wikiUrl}" target="_blank" rel="noopener" class="is-size-7">
              📖 View on Wikipedia →
            </a>
          </p>
        ` : ""}
      </div>
    ` : ""

    this.containerTarget.innerHTML = `
      <div class="plant-header">
        <div class="plant-hero">
          ${heroPhoto}
        </div>
        <div class="plant-meta">
          <div class="is-flex is-align-items-center mb-1" style="gap:0.6rem;">
            <h1 class="title is-3 mb-0">${commonName}</h1>
            <button class="plant-star-btn" data-bookmark-target="star" data-action="click->bookmark#toggle">☆</button>
          </div>
          <p class="subtitle is-5 is-italic has-text-grey mb-2">${scientificName}</p>
          ${ancestors ? `<p class="is-size-7 has-text-grey-light mb-4">${ancestors}</p>` : ""}
          <div class="is-hidden-touch">${aboutBox}</div>
        </div>
      </div>
      <div class="is-hidden-desktop">${aboutBox}</div>
    `
  }
}
