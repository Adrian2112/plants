const CACHE_NAME = "plantscope-v3"
const API_CACHE = "plantscope-api-v1"
const IMG_CACHE = "plantscope-img-v1"
const IMG_CACHE_LIMIT = 200

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== API_CACHE && k !== IMG_CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin === "https://api.inaturalist.org") {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  if (url.hostname.includes("inaturalist-open-data") || url.hostname.includes("static.inaturalist")) {
    event.respondWith(cacheFirst(request, IMG_CACHE, IMG_CACHE_LIMIT))
    return
  }

  if (url.origin === location.origin) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME))
    return
  }

  event.respondWith(fetch(request))
})

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(request)
    if (res.ok) cache.put(request, res.clone())
    return res
  } catch {
    const cached = await cache.match(request)
    return cached || new Response("Offline", { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then(res => {
    if (res.ok) cache.put(request, res.clone())
    return res
  }).catch(() => null)

  return cached || await fetchPromise || new Response("Offline", { status: 503 })
}

async function cacheFirst(request, cacheName, limit) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const res = await fetch(request)
    if (res.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, res.clone())
      if (limit) trimCache(cacheName, limit)
    }
    return res
  } catch {
    return new Response("Offline", { status: 503 })
  }
}

async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > limit) {
    await cache.delete(keys[0])
    trimCache(cacheName, limit)
  }
}
