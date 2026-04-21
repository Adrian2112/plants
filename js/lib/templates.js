export function cloneTemplate(id) {
  return document.getElementById(id).content.cloneNode(true)
}
