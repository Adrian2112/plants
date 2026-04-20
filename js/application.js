import { Application } from "@hotwired/stimulus"
import "@hotwired/turbo"

import HelloController from "./controllers/hello_controller.js"

const app = Application.start()
app.register("hello", HelloController)
