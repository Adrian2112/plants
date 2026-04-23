const KEY = "plantscope_settings"

function getAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}

export function getUsername() {
  return getAll().username || null
}

export function saveUsername(username) {
  localStorage.setItem(KEY, JSON.stringify({ ...getAll(), username: username || null }))
}
