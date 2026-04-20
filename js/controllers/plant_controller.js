import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]

  connect() {
    this.element.style.display = "none"
  }

  show({ detail: { taxon } }) {
    this.element.style.display = ""
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
          <p>${summary}</p>
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
}
