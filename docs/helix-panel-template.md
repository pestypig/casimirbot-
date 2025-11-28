# Helix Panel Registration Template

Use this as a checklist + copy/paste snippet when wiring a new Helix desktop panel so it shows up in Helix Start, the taskbar, and the desktop window manager.

## Steps
- Build/export the React component under `client/src/components/...` (default export recommended; if named, pass the name to `lazyPanel`).
- Add a manifest entry to `client/src/pages/helix-core.panels.ts` using the template below.
- Pick a Lucide icon for Helix Start (import at the top of `helix-core.panels.ts`).
- Confirm sensible defaults: keep `defaultPosition` on-screen for 1280×720, `defaultSize` within store limits.
- Optional metadata: `keywords` (better search), `endpoints` (documentation only), `pinned`, `skipTaskbar`, `alwaysOnTop`, `noMinimize`.

## Manifest Template
```ts
// Inside client/src/pages/helix-core.panels.ts
{
  id: "panel-id",                        // kebab-case; unique
  title: "Panel Title",                  // appears in Helix Start + window chrome
  icon: LayoutGrid,                      // Lucide icon import (optional but recommended)
  loader: lazyPanel(() => import("@/components/YourPanel")), // or (, "NamedExport")
  defaultSize: { w: 960, h: 640 },       // first-launch size (px)
  defaultPosition: { x: 200, y: 140 },   // first-launch position (px from top-left)
  keywords: ["search", "tags"],          // optional; improves Helix Start search
  endpoints: ["GET /api/helix/pipeline"],// optional; shown in Endpoints panel
  pinned: false,                         // optional; pin to taskbar shelf on first load
  skipTaskbar: false,                    // optional; hide from shelf if true
  alwaysOnTop: false,                    // optional; reserve elevated z-order
  noMinimize: false                      // optional; remove minimize control
}
```

## Quick Notes
- `HELIX_PANELS` (built from entries in `helix-core.panels.ts`) drives Helix Start, the taskbar, and the desktop registry; add the entry there and it propagates everywhere.
- If the component uses a named export, specify it: `lazyPanel(() => import("@/components/MyPanel"), "MyPanel")`.
- Restart Vite dev server if a fresh import is not detected.
- When running the client dev server, open `http://localhost:5173/desktop` (Vite’s default port) to validate the panel.
- To reset saved window state during testing, clear `localStorage["desktop-windows-v2"]`.
