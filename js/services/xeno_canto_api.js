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

export async function getSounds(sciName) {
  const apiKey = getXenoCantoApiKey()
  if (!apiKey) throw new Error("Xeno-canto API key not set in Settings.")
  const encodedName = sciName.replace(/ /g, "%20")
  const query = `sp:%22${encodedName}%22+q:%22%3ED%22`
  const url = `${BASE}/recordings?query=${query}&page=1&per_page=50&key=${apiKey}`
  const data = await apiFetch(url)
  const sorted = (data.recordings || [])
    .sort((a, b) => (QUALITY_RANK[a.q] ?? 9) - (QUALITY_RANK[b.q] ?? 9))
    .slice(0, 5)
  return { recordings: sorted }
}
