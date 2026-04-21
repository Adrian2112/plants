const CACHE_NAME = "plantscope-v4"
const API_CACHE = "plantscope-api-v1"
const IMG_CACHE = "plantscope-img-v1"
const IMG_CACHE_LIMIT = 200
const API_TTL_MS = 24 * 60 * 60 * 1000

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
    event.respondWith(cacheFirstWithTTL(request, API_CACHE, API_TTL_MS))
    return
  }

  if (url.hostname.includes("inaturalist-open-data") || url.hostname.includes("static.inaturalist")) {
    event.respondWith(cacheFirst(request, IMG_CACHE, IMG_CACHE_LIMIT))
    return
  }

  if (url.origin === location.origin) {
    const update = revalidate(request, CACHE_NAME)
    event.waitUntil(update)
    event.respondWith(
      caches.match(request).then(cached => cached || update)
    )
    return
  }

  event.respondWith(fetch(request))
})

async function cacheFirstWithTTL(request, cacheName, ttl) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) {
    const cachedAt = parseInt(cached.headers.get("x-cached-at") || "0")
    if (Date.now() - cachedAt < ttl) return cached
  }
  try {
    const res = await fetch(request)
    if (!res.ok) return res
    const body = await res.arrayBuffer()
    const headers = new Headers()
    for (const [k, v] of res.headers) {
      if (k !== "content-encoding" && k !== "content-length") headers.set(k, v)
    }
    headers.set("x-cached-at", String(Date.now()))
    const stamped = new Response(body, { status: res.status, statusText: res.statusText, headers })
    await cache.put(request, stamped.clone())
    return stamped
  } catch {
    return cached || new Response("Offline", { status: 503 })
  }
}

async function revalidate(request, cacheName) {
  try {
    const res = await fetch(request)
    if (res.ok) {
      const cache = await caches.open(cacheName)
      await cache.put(request, res.clone())
    }
    return res
  } catch {
    return null
  }
}

async function cacheFirst(request, cacheName, limit) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const res = await fetch(request)
    if (res.ok) {
      const cache = await caches.open(cacheName)
      await cache.put(request, res.clone())
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
