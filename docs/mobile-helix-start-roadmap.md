## Mobile Helix Start "home screen" roadmap

### Goals
- Auto-route mobile visitors to `/mobile` and present Helix Start as app tiles → full-screen panels with a home button and task switcher.
- Reuse existing panel loaders/metadata while avoiding the desktop window chrome.
- Keep desktop behavior unchanged; add a narrow, mobile-safe allowlist first.
- Treat "mobile OS" differences as "browser capability differences" (iOS WebKit vs Android Chromium) and use progressive enhancement.
- Optional-but-recommended: make `/mobile` installable as a PWA app shell (manifest + service worker) so Helix Start can run as a standalone "web app" surface.
- Assume WebKit-first on iOS/iPadOS (Safari baseline), Chromium-first on Android (install prompts, push).

### Codex ticket breakdown (use for /mobile build chats)
- Routing + detection: add `/mobile` route (`client/src/App.tsx`), `useIsMobileViewport` helper, redirect `/` and `/start` on mobile ergonomics; respect `?desktop=1` override and `?mobile=1` force.
- Mobile shell: create `MobileStartPage` with app grid from `MOBILE_HELIX_PANELS`, Home button, recent/empty state, full-screen host; no desktop chrome.
- Panel allowlist: extend `HelixPanelRef` with `mobileReady?: boolean`; define `MOBILE_HELIX_PANELS = HELIX_PANELS.filter(p => p.mobileReady)`; seed with safe panels.
- Mobile store: build `useMobileAppStore` (stack, activeId, open/activate/close/closeAll, dedupe on open; optional sessionStorage persistence).
- Panel host component: add `MobilePanelHost` (safe-area top bar, min-height 100dvh fallback 100vh, `touch-action: manipulation`, safe-area padding) that renders active panel via `Suspense`.
- Task switcher: long-press Home (~500-700ms) to toggle switcher overlay with Activate/Close and Close All; add visible Switcher button fallback for mouse pointers.
- Input/layout hardening: touch-to-mouse shim where feasible; enforce `min-h-screen`, `overflow-hidden`, `max-width: 100vw`, safe-area padding; keep pinch zoom but snap back to scale 1 after pinch end.
- PWA shell: add manifest + icons, conservative service worker (HTML/CSS/JS/fonts); track display mode (`standalone` vs browser tab).
- Install UX: Android/Chromium `beforeinstallprompt` CTA; iOS helper card for "Share -> Add to Home Screen"; avoid assuming Android-style prompt on Safari.
- Performance guardrails: keep suspense fallback light; optional `heavy` flag warning; cap mounted panels on small devices (e.g., >4 -> close LRU/prompt).
- Telemetry: emit enter `/mobile`, panel open/close events; track install prompt shown/accepted and display-mode.
- QA checklist: run section 9 tests (redirects, grid, switcher, safe-area, panel compatibility, install flows, push gating).

### 0) 2025 mobile OS + browser constraints (design inputs)
- iOS/iPadOS:
  - Assume WebKit-first behavior for compatibility testing; alternative engines may appear regionally, but do not depend on them yet.
  - Install UX: Safari uses "Add to Home Screen" (no reliable Android-style install prompt event).
  - Web Push: supported for **Home Screen web apps** on iOS 16.4+; gate behind "installed + permission + support."
  - UA Client Hints: treat as unsupported on Safari; do not build critical routing on UA-CH.
- Android:
  - PWA install prompts available on Chromium (`beforeinstallprompt`); can offer an explicit "Install" CTA.
- Layout:
  - Prefer modern viewport units (`dvh/svh`) + `env(safe-area-inset-*)` instead of `100vh` for full-screen stability.

### 1) Mobile routing + detection
- Add a mobile route: `client/src/App.tsx` → route `/mobile` to a new `MobileStartPage`.
- Detection: small helper (e.g., `useIsMobileViewport` in `client/src/hooks`) that checks a composite:
  - `matchMedia("(max-width: 900px)")`
  - `matchMedia("(hover: none) and (pointer: coarse)")` (phone ergonomics)
  - UA fallback only as a last resort (avoid UA-CH; treat Safari/WebKit as lacking UA Client Hints)
- Redirect: on load of `/` or `/start`, if "mobile ergonomics", redirect to `/mobile`.
- Preserve manual override: if a query like `?desktop=1` is present, skip redirect to avoid trapping testers.
- Add symmetric override: `?mobile=1` forces redirect for QA.

### 1.5) PWA app shell (installability baseline)
- Add Web App Manifest + icons for `/mobile` so the "home screen" metaphor maps to real OS install surfaces.
- Add service worker for app-shell caching (keep it conservative: HTML/CSS/JS + critical fonts only).
- Install UX:
  - Android/Chromium: expose an "Install Helix Start" CTA driven by `beforeinstallprompt`.
  - iOS/Safari: show a small helper card explaining "Share → Add to Home Screen".
- Track display mode (`standalone` vs browser tab) for layout tweaks and telemetry.
- Web Push: gate behind "installed + permission + support"; iOS path is Home Screen web app on 16.4+ only, Android via Chromium when available.

### 2) Panel allowlist + metadata
- Extend `HelixPanelRef` (`client/src/pages/helix-core.panels.ts`) with optional `mobileReady?: boolean`.
- Start with a conservative allowlist (lightweight, non-mouse-heavy panels); mark those entries `mobileReady: true`.
- Export `MOBILE_HELIX_PANELS = HELIX_PANELS.filter(p => p.mobileReady)` for reuse.

### 3) Mobile app state store
- Create `useMobileAppStore` (e.g., `client/src/store/useMobileAppStore.ts`):
  - State: `{ stack: Array<{ panelId: string; title: string; loader: LoaderFactory; openedAt: number }>, activeId?: string }`.
  - Actions: `open(panelId)`, `activate(panelId)`, `close(panelId)`, `closeAll()`.
  - When opening, dedupe: if already open, just activate.
  - Persistence: keep in-memory only by default (no cross-device bleed); OPTIONAL: sessionStorage to survive reloads on mobile.

### 4) Mobile UI shell
- New page `client/src/pages/mobile-start.tsx`:
  - Header with brand + "Home" pill; long-press on Home opens task switcher.
  - App grid: tiles for `MOBILE_HELIX_PANELS` (icon, title, optional keywords). Tap → open + activate.
  - Full-screen host: renders the active panel via `React.Suspense` with loader; uses 100% viewport height/width, no desktop chrome.
  - Empty state when no app open: show instructions and a "recent" section using stack order.
- Add `MobilePanelHost` component (inline or in `client/src/components/mobile/MobilePanelHost.tsx`):
  - Props: `{ panelId, loader, title, onHome, onShowSwitcher }`.
  - Minimal top bar with back/home button and optional panel title; safe-area padding for notches.
  - Use modern viewport units: container `min-height: 100dvh` (fallback to `100vh`) and pad with `env(safe-area-inset-top/bottom)`; prefer `dvh/svh` where supported.

### 5) Task switcher (long-press)
- Implement a long-press handler on the Home button (press ~500-700ms) to toggle a task switcher overlay.
- Task switcher UI: list or cards of open apps (from store.stack) with "Activate" + "Close" buttons and a "Close all" affordance.
- Accessibility: fall back to a visible button (e.g., "Switcher") on desktop or if pointer is mouse.

### 6) Input & layout hardening
- Add a small compatibility shim for panels expecting mouse events:
  - Wrap host content in a `div` with `touch-action: manipulation` and ensure scroll works.
  - For panels with drag-only UX, add a helper hook to translate simple touch to mouse events where feasible, or exclude them from `mobileReady`.
- Zoom behavior: keep pinch zoom enabled, but inside the mobile host optionally detect pinch (pointer/touch events) and animate the host back to scale 1 on gesture end; avoid `user-scalable=no` at the page level.
- Enforce viewport-fitting: `min-h-screen`, `overflow-hidden`, safe-area inset padding, and `max-width: 100vw`.
- Keyboard resilience (recommended): on focus of inputs, consider `visualViewport` to avoid bottom bars/keyboard covering critical controls.
- Prefer `dvh/svh` units over `vh` for full-screen hosts to reduce iOS/Android browser chrome issues; add `env(safe-area-inset-*)` padding to respect notches/home indicators.

### 7) Performance safeguards
- Lazy-load as today; keep suspense fallback lightweight.
- Consider a per-panel "heavy" flag; if `mobileReady` is true but `heavy`, show a warning/toast before mounting.
- Avoid keeping more than N panels mounted on very small devices: if stack > N (e.g., 4), close LRU or prompt to close.
- PWA caching discipline: do not pre-cache large 3D assets unless strictly required; prefer runtime caching with tight quotas.

### 8) Telemetry & routing glue
- On `/mobile` mount, record a simple event (e.g., `recordPanelActivity("mobile-shell", "enter")` if acceptable).
- When a panel opens/closes via mobile store, optionally emit the same activity reporter used by desktop to keep parity.
- Track install + display-mode:
  - `display-mode: standalone` (installed) vs browser tab
  - `beforeinstallprompt` shown/accepted (Android/Chromium only)

### 9) Testing checklist
- Viewport redirect works: `/` and `/start` push to `/mobile` on small screens; `?desktop=1` bypasses.
- App grid shows only `mobileReady` panels; tapping opens and focuses.
- Home returns to grid; long-press shows switcher; switcher close/activate works.
- Safe-area padding on iOS/Android; no horizontal scroll; host respects orientation changes.
- Representative panels render without fatal mouse-only assumptions; non-mobile-ready panels stay hidden.
- PWA checks:
  - Android: install prompt path works (`beforeinstallprompt`)
  - iOS: Add-to-Home-Screen instructions + standalone display-mode layout is correct; no auto install prompt expected
  - Push (if enabled): confirm gating to iOS 16.4+ installed web apps with permission + support, and Android Chromium path

### 10) Rollout plan
- Phase 0 (dev/internal): ship `/mobile` route + shell behind a feature flag; no auto-redirect; QA with `?mobile=1`.
- Phase 1 (opt-in): add a banner CTA on small screens ("Try Helix Start Mobile") that links to `/mobile`.
- Phase 2 (soft default): enable auto-redirect for a small percentage of mobile sessions; monitor bounce + panel crash rates.
- Phase 3 (default): make `/mobile` the default for mobile ergonomics; keep `?desktop=1` escape hatch.
- Phase 4 (PWA polish): add install CTAs (Android) + iOS add-to-home guidance; optionally add web push for installed apps.  
Suggestions to align layout across iPad and iPhone while supporting all Helix panels

Suggestions to align layout across iPad and iPhone while supporting all Helix panels

Routing/detection: In client/src/App.tsx keep /mobile reachable on iPad by using composite detection (max-width, coarse pointer) but allow a ?mobile=1 force for QA. Consider widening the breakpoint for tablets (e.g., up to 1200px when pointer: coarse) so iPad lands on /mobile when touch-primary.

Viewport units & safe area: Standardize min-height: 100dvh with 100vh fallback and padding: env(safe-area-inset-*) in the mobile shell host; ensure landscape also respects bottom inset for the home indicator.

Grid responsiveness: Build the app grid with CSS grid auto-fit + minmax to adapt from 2 cols (small iPhone) up to 4 cols (iPad); cap tile width and lock row height to avoid jumpy layouts on rotation.

Panel host constraints: Wrap panels in a container that enforces max-width: 100vw, overflow: hidden, and touch-action: manipulation; apply a scrollable inner area with momentum scrolling to prevent horizontal drift on narrow phones.

Typography and chrome: Reduce fixed header height and use compact icon+label buttons to preserve vertical space on iPhone; keep the same component on iPad but allow slightly larger padding via media queries tied to width (not UA).

Controls & hit targets: Ensure primary buttons and tab targets are 44–48px touch targets; add hover styles when hover: hover for iPad keyboards/mice without changing layout.

Panel readiness: Extend HelixPanelRef with mobileReady and audit panels that rely on drag-only or hover-only interactions; add touch-to-mouse shims where feasible, or adapt those panels with explicit mobile affordances (e.g., tap-to-toggle instead of hover).

Orientation resilience: Test both portrait and landscape on iPhone; avoid assuming tall viewports. Keep headers sticky and avoid elements anchored to bottom without inset padding.

Install/standalone parity: Ensure PWA manifest + service worker work identically; on iPad/iPhone, surface the Add to Home Screen helper card; on Android show beforeinstallprompt CTA.

Performance guardrails: On small phones limit concurrent mounted panels (e.g., close LRU after 4); on iPad you can allow more but keep suspense fallback light.