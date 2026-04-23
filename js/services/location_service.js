const STORAGE_KEY = "plantscope_location"

function loadPersistedState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") } catch { return {} }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    useLocation,
    isCustom,
    activeCoords: isCustom ? activeCoords : null,
    locationName: isCustom ? locationName : null,
  }))
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { "Accept-Language": "en" }
    })
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address || {}
    return [a.city, a.state].join(', ')
    // a.city || a.town || a.village || a.county || a.state || null
  } catch { return null }
}

const persisted = loadPersistedState()
let userCoords = null
let activeCoords = persisted.isCustom ? persisted.activeCoords : null
let isCustom = persisted.isCustom || false
let useLocation = persisted.useLocation || false
let locationName = persisted.locationName || null
const readyListeners = []
const changeListeners = []

export function getUserCoords() { return userCoords }
export function isCustomLocation() { return isCustom }
export function isLocationEnabled() { return useLocation }
export function getLocationName() { return locationName }

export function getActiveCoords() {
  return useLocation ? activeCoords : null
}

export function onCoordsReady(cb) {
  if (userCoords) { cb(userCoords); return }
  readyListeners.push(cb)
}

export function onLocationChange(cb) {
  changeListeners.push(cb)
  return () => {
    const i = changeListeners.indexOf(cb)
    if (i !== -1) changeListeners.splice(i, 1)
  }
}

function notifyChange() {
  changeListeners.forEach(cb => cb())
}

export function setLocationEnabled(val) {
  useLocation = val
  persistState()
  notifyChange()
}

export async function setActiveLocation(lat, lng, radius) {
  activeCoords = {
    lat: Math.round(lat * 100) / 100,
    lng: Math.round(lng * 100) / 100,
    ...(radius != null ? { radius } : {}),
  }
  isCustom = true
  useLocation = true
  locationName = null
  persistState()
  notifyChange()
  locationName = await reverseGeocode(lat, lng)
  persistState()
  notifyChange()
}

export function resetToUserLocation() {
  activeCoords = userCoords
  isCustom = false
  locationName = null
  persistState()
  notifyChange()
}

export function requestLocation() {
  if (!navigator.geolocation || !navigator.onLine) return
  navigator.geolocation.getCurrentPosition(
    ({ coords: c }) => {
      userCoords = {
        lat: Math.round(c.latitude * 100) / 100,
        lng: Math.round(c.longitude * 100) / 100,
      }
      if (!isCustom) activeCoords = userCoords
      readyListeners.forEach(cb => cb(userCoords))
      readyListeners.length = 0
      notifyChange()
    },
    () => {}
  )
}
