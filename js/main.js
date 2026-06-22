// Single entry point loaded by every page. Registers all components and
// exposes the toast API on window for convenience in inline scripts/demos.
import { toast } from "./components/index.js";
window.toast = toast;
