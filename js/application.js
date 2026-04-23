import { Application } from "@hotwired/stimulus"
import * as Turbo from "@hotwired/turbo"
Turbo.session.drive = false

import { requestLocation } from "./services/location_service.js"
requestLocation()

import SearchController from "./controllers/search_controller.js"
import PlantController from "./controllers/plant_controller.js"
import SeasonalityController from "./controllers/seasonality_controller.js"
import GalleryController from "./controllers/gallery_controller.js"
import BookmarkController from "./controllers/bookmark_controller.js"
import NotesController from "./controllers/notes_controller.js"
import MapController from "./controllers/map_controller.js"
import LocationController from "./controllers/location_controller.js"
import SettingsController from "./controllers/settings_controller.js"
import ObservationsController from "./controllers/observations_controller.js"
import SoundsController from "./controllers/sounds_controller.js"

const app = Application.start()
app.register("search", SearchController)
app.register("plant", PlantController)
app.register("seasonality", SeasonalityController)
app.register("gallery", GalleryController)
app.register("bookmark", BookmarkController)
app.register("notes", NotesController)
app.register("map", MapController)
app.register("location", LocationController)
app.register("settings", SettingsController)
app.register("observations", ObservationsController)
app.register("sounds", SoundsController)

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {})
}
