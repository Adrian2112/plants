import { Controller } from "@hotwired/stimulus"
import { getUsername, saveUsername } from "../services/settings_service.js"

export default class extends Controller {
  static targets = ["modal", "usernameInput"]

  open() {
    this.usernameInputTarget.value = getUsername() || ""
    this.modalTarget.classList.add("is-active")
  }

  close() {
    this.modalTarget.classList.remove("is-active")
  }

  save() {
    const username = this.usernameInputTarget.value.trim()
    saveUsername(username)
    this.close()
    this.dispatch("changed", { target: document.documentElement, detail: { username } })
  }
}
