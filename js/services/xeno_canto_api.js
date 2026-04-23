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

export async function getBirdSounds(sciName, page = 1) {
  const apiKey = getXenoCantoApiKey()
  if (!apiKey) throw new Error("Xeno-canto API key not set in Settings.")
  const encodedName = sciName.replace(/ /g, "%20")
  const query = `sp:%22${encodedName}%22+q:%22%3EB%22`
  const url = `${BASE}/recordings?query=${query}&page=${page}&per_page=5&key=${apiKey}`
  const data = await apiFetch(url)
  return {
    recordings: (data.recordings || []).slice(0, 5),
    numPages: data.numPages || 1,
    page: data.page || 1,
  }
}
