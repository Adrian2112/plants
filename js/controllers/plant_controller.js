import { Controller } from "@hotwired/stimulus"
import { cloneTemplate } from "../lib/templates.js"

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
    const photo = taxon.default_photo
    const summary = taxon.wikipedia_summary || ""

    const ancestors = (taxon.ancestors || [])
      .filter(a => a.rank_level >= 20)
      .map(a => a.name)
      .join(" › ")

    const frag = cloneTemplate("tpl-plant-header")

    if (photo) {
      const figure = frag.querySelector(".plant-hero-image")
      figure.hidden = false
      figure.querySelector("img").src = photo.medium_url
      figure.querySelector("img").alt = commonName
    }

    frag.querySelector(".plant-common-name").textContent = commonName
    frag.querySelector(".plant-sci-name").textContent = taxon.name

    if (ancestors) {
      const el = frag.querySelector(".plant-ancestors")
      el.hidden = false
      el.textContent = ancestors
    }

    if (summary) {
      const makeAbout = () => {
        const about = cloneTemplate("tpl-plant-about")
        about.querySelector(".plant-summary").innerHTML = summary
        if (taxon.wikipedia_url) {
          about.querySelector(".plant-wiki-row").hidden = false
          about.querySelector(".plant-wiki-link").href = taxon.wikipedia_url
        }
        return about
      }
      frag.querySelector(".plant-about-desktop").appendChild(makeAbout())
      frag.querySelector(".plant-about-mobile").appendChild(makeAbout())
    }

    this.containerTarget.innerHTML = ""
    this.containerTarget.appendChild(frag)
  }
}
