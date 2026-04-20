import { Application } from "@hotwired/stimulus"
import "@hotwired/turbo"

import SearchController from "./controllers/search_controller.js"
import PlantController from "./controllers/plant_controller.js"
import SeasonalityController from "./controllers/seasonality_controller.js"
import GalleryController from "./controllers/gallery_controller.js"

const app = Application.start()
app.register("search", SearchController)
app.register("plant", PlantController)
app.register("seasonality", SeasonalityController)
app.register("gallery", GalleryController)
