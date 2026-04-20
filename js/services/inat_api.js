const BASE = "https://api.inaturalist.org/v1"

export async function searchTaxa(query) {
  const res = await fetch(`${BASE}/taxa/autocomplete?q=${encodeURIComponent(query)}&per_page=8`)
  if (!res.ok) throw new Error("Search failed")
  const data = await res.json()
  return data.results
}

export async function getTaxon(id) {
  const res = await fetch(`${BASE}/taxa/${id}`)
  if (!res.ok) throw new Error("Failed to load taxon")
  const data = await res.json()
  return data.results[0]
}

export async function getHistogram(taxonId, termId, termValueId) {
  let url = `${BASE}/observations/histogram?taxon_id=${taxonId}&date_field=observed&interval=month_of_year`
  if (termId) url += `&term_id=${termId}`
  if (termValueId) url += `&term_value_id=${termValueId}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load seasonality data")
  const data = await res.json()
  return data.results.month_of_year
}

export async function getObservation(id) {
  const res = await fetch(`${BASE}/observations/${id}`)
  if (!res.ok) throw new Error("Failed to load observation")
  const data = await res.json()
  const result = data.results[0]
  if (!result || !result.taxon) {
    throw new Error("This observation doesn't have a species identification yet.")
  }
  return result.taxon
}
