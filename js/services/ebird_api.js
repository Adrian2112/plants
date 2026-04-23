const BASE = "https://api.ebird.org/v2"
const TTL = 24 * 60 * 60 * 1000

const cache = new Map()

async function apiFetch(url) {
  const entry = cache.get(url)
  if (entry && Date.now() - entry.ts < TTL) return entry.data
  const res = await fetch(url)
  if (!res.ok) throw new Error(`eBird API error ${res.status}`)
  const data = await res.json()
  cache.set(url, { data, ts: Date.now() })
  return data
}

export async function getEbirdSciName(speciesCode) {
  const data = await apiFetch(`${BASE}/ref/taxonomy/ebird?fmt=json&species=${encodeURIComponent(speciesCode)}`)
  if (!data.length) throw new Error(`No eBird species found for code "${speciesCode}".`)
  return data[0].sciName
}
