import { Controller } from "@hotwired/stimulus"
import { saveNote, deleteNote, getNotesForTaxon, generateId, isBookmarked, saveBookmark } from "../services/storage_service.js"
import { cloneTemplate } from "../lib/templates.js"

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

    this.listTarget.innerHTML = ""
    for (const n of notes) {
      const frag = cloneTemplate("tpl-note-item")
      frag.querySelector(".note-text").textContent = n.text
      if (n.url) {
        frag.querySelector(".note-url-row").hidden = false
        frag.querySelector(".note-url").href = n.url
      }
      const editBtn = frag.querySelector(".note-edit-btn")
      editBtn.dataset.noteId = n.id
      editBtn.dataset.noteText = n.text
      editBtn.dataset.noteUrl = n.url || ""
      frag.querySelector(".note-delete-btn").dataset.noteId = n.id
      this.listTarget.appendChild(frag)
    }
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

