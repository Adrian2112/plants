const KEY = "plantscope_settings"

function getAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es-mx", label: "Español Mexico" },
  //{ code: "fr", label: "French" },
  //{ code: "pt", label: "Portuguese" },
  //{ code: "de", label: "German" },
  //{ code: "it", label: "Italian" },
  //{ code: "nl", label: "Dutch" },
  //{ code: "ca", label: "Catalan" },
  //{ code: "eu", label: "Basque" },
  //{ code: "pl", label: "Polish" },
  //{ code: "sv", label: "Swedish" },
  //{ code: "da", label: "Danish" },
  //{ code: "nb", label: "Norwegian" },
  //{ code: "fi", label: "Finnish" },
  //{ code: "ru", label: "Russian" },
  //{ code: "tr", label: "Turkish" },
  //{ code: "ar", label: "Arabic" },
  //{ code: "ja", label: "Japanese" },
  //{ code: "zh", label: "Chinese" },
  //{ code: "ko", label: "Korean" },
]

export function getUsername() { return getAll().username || null }
export function getPrimaryLanguage() { return getAll().primaryLanguage || "en" }
export function getSecondaryLanguage() { return getAll().secondaryLanguage || null }
export function getXenoCantoApiKey() { return getAll().xenoCantoApiKey || null }

export function saveSettings({ username, primaryLanguage, secondaryLanguage, xenoCantoApiKey }) {
  localStorage.setItem(KEY, JSON.stringify({
    ...getAll(),
    username: username || null,
    primaryLanguage: primaryLanguage || "en",
    secondaryLanguage: secondaryLanguage || null,
    xenoCantoApiKey: xenoCantoApiKey || null,
  }))
}
