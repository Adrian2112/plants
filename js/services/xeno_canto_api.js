import { getXenoCantoApiKey } from "./settings_service.js"

const BASE = "https://xeno-canto.org/api/3"
const TTL = 24 * 60 * 60 * 1000

const cache = new Map()

async function apiFetch(url) {
  const entry = cache.get(url)
  if (entry && Date.now() - entry.ts < TTL) return entry.data
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Xeno-canto API error ${res.status}`)
  const data = await res.json()
  cache.set(url, { data, ts: Date.now() })
  return data
}

const QUALITY_RANK = { A: 0, B: 1, C: 2, D: 3, E: 4 }

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function proximityTier(rec, coords) {
  if (!coords || !rec.lat || !rec.lng) return 3
  const km = haversineKm(coords.lat, coords.lng, parseFloat(rec.lat), parseFloat(rec.lng))
  if (km < 500)  return 0
  if (km < 2000) return 1
  return 2
}

export async function getSounds(sciName, coords = null) {
  const apiKey = getXenoCantoApiKey()
  if (!apiKey) throw new Error("Xeno-canto API key not set in Settings.")
  const encodedName = sciName.replace(/ /g, "%20")
  const query = `sp:%22${encodedName}%22+q:%22%3ED%22`
  const url = `${BASE}/recordings?query=${query}&page=1&per_page=100&key=${apiKey}`
  const data = await apiFetch(url)
  const sorted = (data.recordings || [])
    .sort((a, b) => {
      const qA = QUALITY_RANK[a.q] ?? 9
      const qB = QUALITY_RANK[b.q] ?? 9
      const pA = proximityTier(a, coords)
      const pB = proximityTier(b, coords)
      return (qA + pA) - (qB + pB)
    })
    .slice(0, 5)
  return { recordings: sorted }
}
