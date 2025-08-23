import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Stamp build token at app boot
(window as any).__APP_WARP_BUILD = import.meta?.env?.VITE_BUILD_HASH || Date.now().toString();

createRoot(document.getElementById("root")!).render(<App />);
