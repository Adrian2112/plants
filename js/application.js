import { Application } from "@hotwired/stimulus"
import * as Turbo from "@hotwired/turbo"
Turbo.session.drive = false

import SearchController from "./controllers/search_controller.js"
import PlantController from "./controllers/plant_controller.js"
import SeasonalityController from "./controllers/seasonality_controller.js"
import GalleryController from "./controllers/gallery_controller.js"
import BookmarkController from "./controllers/bookmark_controller.js"
import NotesController from "./controllers/notes_controller.js"

const app = Application.start()
app.register("search", SearchController)
app.register("plant", PlantController)
app.register("seasonality", SeasonalityController)
app.register("gallery", GalleryController)
app.register("bookmark", BookmarkController)
app.register("notes", NotesController)

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {})
}
