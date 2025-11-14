# Helix Desktop Panels & Helix Start Launch Config

This note captures everything Codex needs to wire new UI panels into the `/desktop` experience, including the Helix Start launcher menu and the window manager configuration.

## Mental Model

- `client/src/pages/desktop.tsx` bootstraps the desktop by calling `registerFromManifest(panelRegistry)` and rendering a `<DesktopWindow>` per open entry.
- `client/src/lib/desktop/panelRegistry.ts` is the manifest consumed by the desktop store. It contains the bespoke system panels (`live-energy`, `taskbar`, etc.) and spreads in every Helix panel exported from `client/src/pages/helix-core.panels.ts`.
- `client/src/pages/helix-core.panels.ts` is the only place Helix-core panels need to be registered. Those entries are re-used by the Helix Start launcher, the taskbar shelf, and the Endpoints panel.
- `client/src/components/desktop/DesktopTaskbar.tsx` holds the Helix Start (`HelixStartLauncher`) popover. The menu lists whatever is present in `HELIX_PANELS`.
- Window state (position, size, z-index, opacity, etc.) is owned by `client/src/store/useDesktopStore.ts` and persisted under the `desktop-windows-v2` key in `localStorage`.

When you add a new entry to `HELIX_PANELS`, it automatically:

1. Appears as a launchable item inside the Helix Start popover.
2. Becomes available to `/desktop` (because `panelRegistry` spreads `...HELIX_PANELS`).
3. Shows endpoint metadata inside `EndpointsPanel` if `endpoints` are declared.

## Workflow For New Panels

1. **Create (or expose) the panel component.**
   - Panels usually live in `client/src/components/` and should export either a default component or a named component that can be referenced by the loader.
   - Gate expensive data fetches (queries, WebGL init, etc.) behind React hooks so repeated open/close flows stay responsive.

2. **Register the panel inside `client/src/pages/helix-core.panels.ts`.**
   - Use the `lazyPanel` helper for dynamic imports.
   - Provide a unique `id` (kebab case keeps things readable) and a human-facing `title`.
   - Pick an icon from `lucide-react` to keep the Helix Start list coherent.
   - Example snippet:

     ```ts
     // client/src/pages/helix-core.panels.ts
     {
       id: "shell-outline",
       title: "Shell Outline Visualizer",
       icon: LayoutGrid,
       loader: lazyPanel(() => import("@/components/ShellOutlineVisualizer")),
       defaultSize: { w: 720, h: 520 },
       defaultPosition: { x: 240, y: 440 },
       endpoints: [API.pipelineGet]
     }
     ```

   - If the component exports a named symbol, pass it as the second argument: `loader: lazyPanel(() => import("@/components/MyPanel"), "MyPanel")`.

3. **Set the window launch configuration.**
   - `defaultSize`: width/height in pixels for the first launch.
   - `defaultPosition`: top-left desktop origin (pixels). Use values that keep the panel within view on 1280x720 displays.
   - Optional flags:
     - `pinned`: pin the panel to the taskbar shelf by default.
     - `skipTaskbar`: hide it from the shelf (used by the floating taskbar window).
     - `alwaysOnTop`: reserve a top-layer z-index (e.g., the fixed taskbar).
     - `noMinimize`: disable the minimize icon for utility windows.
   - Endpoints metadata (array of strings like `"GET /api/helix/pipeline"`) feeds the Endpoints panel so operators can see which APIs a tool hits.

4. **Hook up any behaviors the panel depends on.**
   - Panels can call `useDesktopStore()` to query their window state or trigger `openInHelix` when they need to route a user into `/helix-core`.
   - Use `useGlobalPhase`, `useEnergyPipeline`, etc., as needed -- nothing special is required for desktop panels beyond the manifest entry.

5. **Test the launch path.**
   - `pnpm dev --filter client -- --host` (or your usual dev task) and open `http://localhost:5173/desktop`.
   - Click the Helix Start button in the taskbar; the new entry should appear alphabetically with its icon.
   - Launch the panel, confirm the initial bounds and resize/drag/minimize workflows.
   - If window state needs to be reset during testing, clear `localStorage["desktop-windows-v2"]`.

6. **Document special requirements.**
   - If the panel expects certain hardware streams or feature flags, append a note in its `HELIX_PANELS` comment block or reference that in `docs/sweeps.md`/`docs/AGI-ROADMAP.md` as appropriate.

## Manifest Field Reference

| Field | Defined In | Purpose / Notes |
| --- | --- | --- |
| `id` | `HelixPanelRef` | Unique stable identifier used by the desktop store, URL params, and taskbar. Stick to lowercase + hyphen. |
| `title` | `HelixPanelRef` | Display name in Helix Start, taskbar tooltips, and window chrome. |
| `icon` | `HelixPanelRef` | Optional Lucide icon class rendered inside Helix Start and pinned tiles. |
| `loader` | `HelixPanelRef` | `lazyPanel`-based import that returns `{ default: Component }`. Missing exports will throw when the window renders, so keep the string key updated. |
| `defaultSize` | `HelixPanelRef` | `{ w, h }` in pixels. Enforced minimum/maximum are defined in `client/src/store/useDesktopStore.ts`. |
| `defaultPosition` | `HelixPanelRef` | `{ x, y }` in pixels. Values are clamped to the viewport each time the desktop mounts. |
| `endpoints` | `HelixPanelRef` | Optional string array used purely for documentation (Endpoints panel). |
| `pinned` | `HelixPanelRef` | Makes the taskbar shelf show the panel as pinned on first load. |
| `skipTaskbar` | `PanelDefinition` | Skip normal taskbar chrome (useful for the floating taskbar admin window). |
| `alwaysOnTop` / `noMinimize` | `PanelDefinition` | Force elevated z-order or remove minimize control. Only use for utility shells that must stay visible. |

Non-Helix system panels (Live Energy, Endpoints, Taskbar) are declared directly inside `panelRegistry`. Follow the same structure as above if you ever need a desktop-only tool that should *not* appear in Helix Start.

## Troubleshooting Checklist

- **Entry missing from Helix Start:** Ensure it was added to `HELIX_PANELS` (not just `panelRegistry`) and that the dev server restarted so Vite picks up the dynamic import.
- **Window opens off-screen:** Tweak `defaultPosition` and remember that `DesktopWindow` clamps values to the viewport minus the 48px taskbar height.
- **Loader throws about missing export:** Double-check the component's export name matches the key passed into `lazyPanel`.
- **State feels stale after refactors:** Clear `localStorage["desktop-windows-v2"]` so persisted bounds/opacities do not override new defaults.

With this guide in place, Codex can confidently add or adjust Helix panels without re-reading the entire desktop subsystem.
