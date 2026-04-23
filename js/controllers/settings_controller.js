import { Controller } from "@hotwired/stimulus"
import { getUsername, getPrimaryLanguage, getSecondaryLanguage, getXenoCantoApiKey, saveSettings, LANGUAGES } from "../services/settings_service.js"

export default class extends Controller {
  static targets = ["modal", "usernameInput", "primaryLanguageSelect", "secondaryLanguageSelect", "xenoCantoApiKeyInput"]

  open() {
    this.usernameInputTarget.value = getUsername() || ""
    this.renderLanguageOptions(this.primaryLanguageSelectTarget, getPrimaryLanguage(), false)
    this.renderLanguageOptions(this.secondaryLanguageSelectTarget, getSecondaryLanguage(), true)
    this.xenoCantoApiKeyInputTarget.value = getXenoCantoApiKey() || ""
    this.modalTarget.classList.add("is-active")
  }

  close() {
    this.modalTarget.classList.remove("is-active")
  }

  renderLanguageOptions(select, selected, includeNone) {
    const noneOption = includeNone ? `<option value="" ${!selected ? "selected" : ""}>None</option>` : ""
    select.innerHTML = noneOption + LANGUAGES.map(l =>
      `<option value="${l.code}" ${l.code === selected ? "selected" : ""}>${l.label}</option>`
    ).join("")
  }

  save() {
    const username = this.usernameInputTarget.value.trim()
    const primaryLanguage = this.primaryLanguageSelectTarget.value || "en"
    const secondaryLanguage = this.secondaryLanguageSelectTarget.value || null
    const xenoCantoApiKey = this.xenoCantoApiKeyInputTarget.value.trim() || null
    saveSettings({ username, primaryLanguage, secondaryLanguage, xenoCantoApiKey })
    this.close()
    this.dispatch("changed", { target: document.documentElement, detail: { username } })
  }
}
