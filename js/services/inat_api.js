const BASE = "https://api.inaturalist.org/v1"

export async function searchTaxa(query) {
  const res = await fetch(`${BASE}/taxa/autocomplete?q=${encodeURIComponent(query)}&per_page=8&taxon_id=47126`)
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

export async function getHistogram(taxonId, termId, termValueId, { lat, lng, radius } = {}) {
  let url = `${BASE}/observations/histogram?taxon_id=${taxonId}&date_field=observed&interval=month_of_year`
  if (termId) url += `&term_id=${termId}`
  if (termValueId) url += `&term_value_id=${termValueId}`
  if (lat != null && lng != null) url += `&lat=${lat}&lng=${lng}&radius=${radius ?? 200}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load seasonality data")
  const data = await res.json()
  return data.results.month_of_year
}

export async function getObservationPhotos(taxonId, { termId, termValueId, page = 1, perPage = 30 } = {}) {
  let url = `${BASE}/observations?taxon_id=${taxonId}&photos=true&per_page=${perPage}&page=${page}&quality_grade=research&order_by=votes`
  if (termId) url += `&term_id=${termId}`
  if (termValueId) url += `&term_value_id=${termValueId}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load photos")
  const data = await res.json()
  const photos = []
  for (const obs of data.results) {
    for (const p of obs.photos || []) {
      photos.push({
        id: p.id,
        small: p.url?.replace("square", "small"),
        medium: p.url?.replace("square", "medium"),
        large: p.url?.replace("square", "large"),
        attribution: p.attribution,
        observer: obs.user?.login,
        date: obs.observed_on,
      })
    }
  }
  return { photos, totalResults: data.total_results, page }
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
