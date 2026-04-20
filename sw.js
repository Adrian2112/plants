const CACHE_NAME = "plantscope-v1"
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/bookmarks.html",
  "/css/app.css",
  "/js/application.js",
  "/js/controllers/search_controller.js",
  "/js/controllers/plant_controller.js",
  "/js/controllers/seasonality_controller.js",
  "/js/controllers/gallery_controller.js",
  "/js/controllers/bookmark_controller.js",
  "/js/controllers/notes_controller.js",
  "/js/services/inat_api.js",
  "/js/services/storage_service.js",
  "/js/services/cache_service.js",
  "/js/lib/url_parser.js",
]

const API_CACHE = "plantscope-api-v1"
const IMG_CACHE = "plantscope-img-v1"
const IMG_CACHE_LIMIT = 200

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

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

  if (request.destination === "image" && (url.hostname.includes("inaturalist") || url.hostname.includes("static.inaturalist"))) {
    event.respondWith(cacheFirst(request, IMG_CACHE, IMG_CACHE_LIMIT))
    return
  }

  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request, CACHE_NAME))
    return
  }

  event.respondWith(fetch(request))
})

async function networkFirst(request, cacheName) {
  try {
    const res = await fetch(request)
    if (res.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, res.clone())
    }
    return res
  } catch {
    const cached = await caches.match(request)
    return cached || new Response("Offline", { status: 503 })
  }
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
