import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Stamp build token at app boot
(window as any).__APP_WARP_BUILD = 'dev-patched-' + Date.now().toString();

createRoot(document.getElementById("root")!).render(<App />);
