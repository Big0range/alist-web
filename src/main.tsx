/* @refresh reload */
import { Router } from "@solidjs/router"
import { render } from "solid-js/web"
import "./utils/webUpdateNotice"
import { Index } from "./app"

declare global {
  interface Window {
    [key: string]: any
  }
}

declare module "solid-js" {
  namespace JSX {
    interface CustomEvents extends HTMLElementEventMap {}
    interface CustomCaptureEvents extends HTMLElementEventMap {}
  }
}

render(
  () => (
    <Router>
      {123132}
      <Index />
    </Router>
  ),
  document.getElementById("root") as HTMLElement,
)
