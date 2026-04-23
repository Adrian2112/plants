const DB_NAME = "plantscope_db"
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains("bookmarks")) {
        db.createObjectStore("bookmarks", { keyPath: "taxon_id" })
      }
      if (!db.objectStoreNames.contains("notes")) {
        const store = db.createObjectStore("notes", { keyPath: "id" })
        store.createIndex("taxon_id", "taxon_id", { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(storeName, mode, callback) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode)
      const store = transaction.objectStore(storeName)
      const result = callback(store)
      transaction.oncomplete = () => resolve(result.result !== undefined ? result.result : undefined)
      transaction.onerror = () => reject(transaction.error)
    })
  })
}

// Bookmarks

export async function saveBookmark(taxon, seasonality) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction("bookmarks", "readwrite")
    t.objectStore("bookmarks").put({
      taxon_id: taxon.id,
      common_name: taxon.preferred_common_name || taxon.name,
      scientific_name: taxon.name,
      thumbnail_url: taxon.default_photo?.square_url,
      wikipedia_summary: taxon.wikipedia_summary || "",
      taxon_data: taxon,
      seasonality: seasonality || null,
      saved_at: new Date().toISOString(),
    })
    t.oncomplete = () => {
      updateBookmarkIndex()
      resolve()
    }
    t.onerror = () => reject(t.error)
  })
}

export async function removeBookmark(taxonId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction("bookmarks", "readwrite")
    t.objectStore("bookmarks").delete(taxonId)
    t.oncomplete = () => {
      updateBookmarkIndex()
      resolve()
    }
    t.onerror = () => reject(t.error)
  })
}

export async function getBookmark(taxonId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction("bookmarks", "readonly")
    const req = t.objectStore("bookmarks").get(taxonId)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllBookmarks() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction("bookmarks", "readonly")
    const req = t.objectStore("bookmarks").getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function isBookmarked(taxonId) {
  const bm = await getBookmark(taxonId)
  return !!bm
}

function updateBookmarkIndex() {
  getAllBookmarks().then(bookmarks => {
    const index = bookmarks.map(b => ({
      taxon_id: b.taxon_id,
      common_name: b.common_name,
      thumbnail_url: b.thumbnail_url,
      saved_at: b.saved_at,
    }))
    localStorage.setItem("plantscope_bookmarks_index", JSON.stringify(index))
  })
}

// Notes

export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export async function saveNote(note) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction("notes", "readwrite")
    t.objectStore("notes").put(note)
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}

export async function deleteNote(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction("notes", "readwrite")
    t.objectStore("notes").delete(id)
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}

export async function getNotesForTaxon(taxonId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction("notes", "readonly")
    const index = t.objectStore("notes").index("taxon_id")
    const req = index.getAll(taxonId)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getNoteCountForTaxon(taxonId) {
  const notes = await getNotesForTaxon(taxonId)
  return notes.length
}
