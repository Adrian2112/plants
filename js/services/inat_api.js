const BASE = "https://api.inaturalist.org/v1"
const TTL = 24 * 60 * 60 * 1000

const cache = new Map()

function fromCache(url) {
  const entry = cache.get(url)
  if (!entry) return null
  if (Date.now() - entry.ts > TTL) { cache.delete(url); return null }
  return entry.data
}

async function apiFetch(url) {
  const hit = fromCache(url)
  if (hit) return hit
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  cache.set(url, { data, ts: Date.now() })
  return data
}

export async function searchTaxa(query) {
  const data = await apiFetch(`${BASE}/taxa/autocomplete?q=${encodeURIComponent(query)}&per_page=8&taxon_id=47126`)
  return data.results
}

export async function getTaxon(id) {
  const data = await apiFetch(`${BASE}/taxa/${id}`)
  return data.results[0]
}

export async function getHistogram(taxonId, termId, termValueId, { lat, lng, radius } = {}) {
  let url = `${BASE}/observations/histogram?taxon_id=${taxonId}&date_field=observed&interval=month_of_year`
  if (termId) url += `&term_id=${termId}`
  if (termValueId) url += `&term_value_id=${termValueId}`
  if (lat != null && lng != null) url += `&lat=${lat}&lng=${lng}&radius=${radius ?? 200}`
  const data = await apiFetch(url)
  return data.results.month_of_year
}

export async function getObservationPhotos(taxonId, { termId, termValueId, page = 1, perPage = 30, lat, lng, radius } = {}) {
  let url = `${BASE}/observations?taxon_id=${taxonId}&photos=true&per_page=${perPage}&page=${page}&quality_grade=research&order_by=votes`
  if (termId) url += `&term_id=${termId}`
  if (termValueId) url += `&term_value_id=${termValueId}`
  if (lat != null && lng != null) url += `&lat=${lat}&lng=${lng}&radius=${radius ?? 200}`
  const data = await apiFetch(url)
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
  const data = await apiFetch(`${BASE}/observations/${id}`)
  const result = data.results[0]
  if (!result || !result.taxon) {
    throw new Error("This observation doesn't have a species identification yet.")
  }
  return result.taxon
}
