import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]

  connect() {
    this.element.style.display = "none"
  }

  show({ detail: { taxon } }) {
    this.element.style.display = ""
    this.render(taxon)
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

    const truncatedSummary = summary.length > 150 ? summary.slice(0, 150) + "…" : summary
    const needsExpand = summary.length > 150

    this.containerTarget.innerHTML = `
      ${photo ? `
        <figure class="image is-3by2 mb-4">
          <img src="${photo.medium_url}" alt="${commonName}" style="object-fit:cover;border-radius:8px;">
        </figure>
      ` : ""}

      <h1 class="title is-3 mb-1">${commonName}</h1>
      <p class="subtitle is-5 is-italic has-text-grey mb-2">${scientificName}</p>
      ${ancestors ? `<p class="is-size-7 has-text-grey-light mb-4">${ancestors}</p>` : ""}

      ${summary ? `
        <div class="box">
          <h2 class="title is-5 mb-3">About</h2>
          <p class="description-text" data-plant-target="descriptionText">${truncatedSummary}</p>
          <p class="description-full is-hidden" data-plant-target="descriptionFull">${summary}</p>
          ${needsExpand ? `
            <a class="is-size-7" data-action="click->plant#toggleDescription" data-plant-target="toggleLink">▼ Read more</a>
          ` : ""}
          ${wikiUrl ? `
            <p class="mt-3">
              <a href="${wikiUrl}" target="_blank" rel="noopener" class="is-size-7">
                📖 View on Wikipedia →
              </a>
            </p>
          ` : ""}
        </div>
      ` : ""}
    `
  }

  toggleDescription(event) {
    event.preventDefault()
    const short = this.element.querySelector('[data-plant-target="descriptionText"]')
    const full = this.element.querySelector('[data-plant-target="descriptionFull"]')
    const link = this.element.querySelector('[data-plant-target="toggleLink"]')

    if (full.classList.contains("is-hidden")) {
      full.classList.remove("is-hidden")
      short.classList.add("is-hidden")
      link.textContent = "▲ Show less"
    } else {
      full.classList.add("is-hidden")
      short.classList.remove("is-hidden")
      link.textContent = "▼ Read more"
    }
  }
}
