const BASE = "https://api.inaturalist.org/v1"
const TTL = 24 * 60 * 60 * 1000
const STORAGE_KEY = "plantscope_apicache"

const cache = new Map()

// Load persisted entries on module init
;(function loadPersistedCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const now = Date.now()
    for (const [url, entry] of JSON.parse(raw)) {
      if (now - entry.ts < TTL) cache.set(url, entry)
    }
  } catch {}
})()

function persistCache() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...cache.entries()]))
  } catch {}
}

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
  persistCache()
  return data
}

export async function searchTaxa(query, locale = "en") {
  let url = `${BASE}/taxa/autocomplete?q=${encodeURIComponent(query)}&per_page=8&locale=${locale}`
  const data = await apiFetch(url)
  return data.results
}

export async function getTaxon(id, locale = "en") {
  const data = await apiFetch(`${BASE}/taxa/${id}?locale=${locale}`)
  return data.results[0]
}

export async function getLocalizedName(taxonId, locale) {
  const taxon = await getTaxon(taxonId, locale)
  return taxon?.preferred_common_name || null
}

export async function getHistogram(taxonId, termId, termValueId, { lat, lng, radius } = {}) {
  let url = `${BASE}/observations/histogram?taxon_id=${taxonId}&date_field=observed&interval=month_of_year`
  if (termId) url += `&term_id=${termId}`
  if (termValueId) url += `&term_value_id=${termValueId}`
  if (lat != null && lng != null) url += `&lat=${lat}&lng=${lng}&radius=${radius ?? 200}`
  const data = await apiFetch(url)
  return data.results.month_of_year
}

export async function getObservationPhotos(taxonId, { termId, termValueId, page = 1, perPage = 30, lat, lng, radius, userLogin } = {}) {
  let url = `${BASE}/observations?taxon_id=${taxonId}&photos=true&per_page=${perPage}&page=${page}&quality_grade=research&order_by=votes`
  if (termId) url += `&term_id=${termId}`
  if (termValueId) url += `&term_value_id=${termValueId}`
  if (lat != null && lng != null) url += `&lat=${lat}&lng=${lng}&radius=${radius ?? 200}`
  if (userLogin) url += `&user_login=${encodeURIComponent(userLogin)}`
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
        place: obs.place_guess || null,
      })
    }
  }
  return { photos, totalResults: data.total_results, page }
}

export async function getUserSpecies(username, { lat, lng, radius, locale = "en" } = {}) {
  let url = `${BASE}/observations/species_counts?user_login=${encodeURIComponent(username)}&per_page=500&locale=${locale}`
  if (lat != null && lng != null) url += `&lat=${lat}&lng=${lng}&radius=${radius ?? 200}`
  const data = await apiFetch(url)
  return data.results.sort((a, b) => {
    const nameA = a.taxon.preferred_common_name || a.taxon.name
    const nameB = b.taxon.preferred_common_name || b.taxon.name
    return nameA.localeCompare(nameB)
  })
}

export async function getUserObservationDates(username, { lat, lng, radius } = {}) {
  let url = `${BASE}/observations?user_login=${encodeURIComponent(username)}&per_page=500&order_by=observed_on&order=desc&quality_grade=research`
  if (lat != null && lng != null) url += `&lat=${lat}&lng=${lng}&radius=${radius ?? 200}`
  const data = await apiFetch(url)
  const dates = {}
  for (const obs of data.results) {
    const id = obs.taxon?.id
    if (id && obs.observed_on && !dates[id]) dates[id] = obs.observed_on
  }
  return dates
}

export async function getNearbySpecies({ lat, lng, radius, locale = "en" } = {}) {
  if (lat == null || lng == null) return []
  let url = `${BASE}/observations/species_counts?per_page=500&locale=${locale}&lat=${lat}&lng=${lng}&radius=${radius ?? 50}`
  const data = await apiFetch(url)
  return data.results.sort((a, b) => {
    const nameA = a.taxon.preferred_common_name || a.taxon.name
    const nameB = b.taxon.preferred_common_name || b.taxon.name
    return nameA.localeCompare(nameB)
  })
}

export async function getNearbySpeciesForMonth({ lat, lng, radius, month, locale = "en" } = {}) {
  if (lat == null || lng == null) return []
  let url = `${BASE}/observations/species_counts?per_page=500&locale=${locale}&lat=${lat}&lng=${lng}&radius=${radius ?? 50}&month=${month}`
  const data = await apiFetch(url)
  return data.results
}

export async function getObservation(id) {
  const data = await apiFetch(`${BASE}/observations/${id}`)
  const result = data.results[0]
  if (!result || !result.taxon) {
    throw new Error("This observation doesn't have a species identification yet.")
  }
  return result.taxon
}
