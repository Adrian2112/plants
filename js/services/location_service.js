let userCoords = null
let activeCoords = null
let isCustom = false
let useLocation = false
const readyListeners = []
const changeListeners = []

export function getUserCoords() { return userCoords }
export function isCustomLocation() { return isCustom }
export function isLocationEnabled() { return useLocation }

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
  notifyChange()
}

export function setActiveLocation(lat, lng, radius) {
  activeCoords = {
    lat: Math.round(lat * 100) / 100,
    lng: Math.round(lng * 100) / 100,
    ...(radius != null ? { radius } : {}),
  }
  isCustom = true
  useLocation = true
  notifyChange()
}

export function resetToUserLocation() {
  activeCoords = userCoords
  isCustom = false
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
