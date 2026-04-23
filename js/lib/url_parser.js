export function parseInput(input) {
  if (!input || !input.trim()) return null

  const trimmed = input.trim()

  if (/^\d+$/.test(trimmed)) {
    return { type: "taxon_id", value: trimmed }
  }

  const taxonMatch = trimmed.match(/inaturalist\.org\/taxa\/(\d+)/)
  if (taxonMatch) return { type: "taxon_id", value: taxonMatch[1] }

  const obsMatch = trimmed.match(/inaturalist\.org\/observations\/(\d+)/)
  if (obsMatch) return { type: "observation_id", value: obsMatch[1] }

  if (trimmed.includes("inaturalist.org")) {
    return { type: "error", message: "Couldn't parse that iNaturalist URL. Try a taxon or observation link." }
  }

  const merlinMatch = trimmed.match(/merlinbirds\.org\/species\/([^?#/]+)/)
  if (merlinMatch) return { type: "merlin_species", value: merlinMatch[1] }

  return { type: "search", value: trimmed }
}

export function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  const url = params.get("url")
  const taxonId = params.get("taxon_id")

  if (taxonId) return { type: "taxon_id", value: taxonId }
  if (url) return parseInput(url)
  return null
}
