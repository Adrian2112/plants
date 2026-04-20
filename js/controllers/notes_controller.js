import { Controller } from "@hotwired/stimulus"
import { saveNote, deleteNote, getNotesForTaxon, generateId, isBookmarked, saveBookmark } from "../services/storage_service.js"

export default class extends Controller {
  static targets = ["list", "form", "formText", "formUrl", "addBtn", "empty"]

  connect() {
    this.element.style.display = "none"
    this.taxon = null
    this.editingId = null
  }

  async show({ detail: { taxon } }) {
    this.taxon = taxon
    this.element.style.display = ""
    this.hideForm()
    await this.renderNotes()
  }

  async renderNotes() {
    const notes = await getNotesForTaxon(this.taxon.id)
    if (notes.length === 0) {
      this.listTarget.innerHTML = ""
      this.emptyTarget.style.display = ""
      return
    }

    this.emptyTarget.style.display = "none"
    notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    this.listTarget.innerHTML = notes.map(n => `
      <div class="box mb-2 p-3">
        <p>${escapeHtml(n.text)}</p>
        ${n.url ? `<p class="mt-1"><a href="${escapeHtml(n.url)}" target="_blank" rel="noopener" class="is-size-7">🔗 source</a></p>` : ""}
        <div class="is-flex is-justify-content-flex-end mt-2" style="gap:0.5rem;">
          <button class="button is-small is-text" data-action="click->notes#editNote" data-note-id="${n.id}" data-note-text="${escapeAttr(n.text)}" data-note-url="${escapeAttr(n.url || "")}">✎</button>
          <button class="button is-small is-text has-text-danger" data-action="click->notes#confirmDelete" data-note-id="${n.id}">✕</button>
        </div>
      </div>
    `).join("")
  }

  showForm() {
    this.formTarget.style.display = ""
    this.addBtnTarget.style.display = "none"
    this.formTextTarget.focus()
  }

  hideForm() {
    this.formTarget.style.display = "none"
    this.addBtnTarget.style.display = ""
    this.formTextTarget.value = ""
    this.formUrlTarget.value = ""
    this.editingId = null
  }

  editNote(event) {
    this.editingId = event.currentTarget.dataset.noteId
    this.formTextTarget.value = event.currentTarget.dataset.noteText
    this.formUrlTarget.value = event.currentTarget.dataset.noteUrl
    this.showForm()
  }

  async onSave(event) {
    event.preventDefault()
    const text = this.formTextTarget.value.trim()
    if (!text) return

    const now = new Date().toISOString()
    const note = {
      id: this.editingId || generateId(),
      taxon_id: this.taxon.id,
      text,
      url: this.formUrlTarget.value.trim() || null,
      created_at: this.editingId ? undefined : now,
      updated_at: now,
    }

    if (this.editingId) {
      const existing = (await getNotesForTaxon(this.taxon.id)).find(n => n.id === this.editingId)
      if (existing) note.created_at = existing.created_at
    } else {
      note.created_at = now
    }

    await saveNote(note)

    if (!(await isBookmarked(this.taxon.id))) {
      await saveBookmark(this.taxon)
      this.dispatch("autobookmarked", { detail: { taxon: this.taxon } })
    }

    this.hideForm()
    await this.renderNotes()
  }

  async confirmDelete(event) {
    if (!confirm("Delete this note?")) return
    await deleteNote(event.currentTarget.dataset.noteId)
    await this.renderNotes()
  }
}

function escapeHtml(str) {
  const div = document.createElement("div")
  div.textContent = str
  return div.innerHTML
}

function escapeAttr(str) {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}
