const DEFAULT_TTL = 24 * 60 * 60 * 1000

export function getCached(key) {
  try {
    const raw = sessionStorage.getItem(`ps_cache_${key}`)
    if (!raw) return null
    const { data, expires } = JSON.parse(raw)
    if (Date.now() > expires) {
      sessionStorage.removeItem(`ps_cache_${key}`)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    sessionStorage.setItem(`ps_cache_${key}`, JSON.stringify({
      data,
      expires: Date.now() + ttl,
    }))
  } catch {
    // sessionStorage full — clear old entries
    clearExpired()
  }
}

function clearExpired() {
  const now = Date.now()
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i)
    if (!key?.startsWith("ps_cache_")) continue
    try {
      const { expires } = JSON.parse(sessionStorage.getItem(key))
      if (now > expires) sessionStorage.removeItem(key)
    } catch {
      sessionStorage.removeItem(key)
    }
  }
}
