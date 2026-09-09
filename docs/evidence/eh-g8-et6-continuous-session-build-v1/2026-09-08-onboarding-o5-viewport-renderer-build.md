# O5 viewport/input regression and renderer build

Classification: test harness. Expanded the isolated durable-pairing Chromium
fixture to pointer and keyboard cases at 375px and 1280px widths, each 640px high.
Pointer cases scroll the consent control into view, place a fixed covering
overlay, click the checkbox's physical coordinates and verify consent remains
unchecked with zero writes. Closing the fixture overlay permits ordinary control
activation. Keyboard cases use focus, ArrowDown/Enter and Space. All four cases
retain same-request reconciliation after reload. No force-click bypass is used.

`npx playwright test --config playwright.onboarding.config.ts durable-pairing.spec.ts`
passed 4/4 on 2026-09-08 at approximately 21:45 local. This is a standalone
rendered component with intercepted APIs, not full workstation CSS, production
overlays, native Electron or an integrated real-handler browser session.

Before building, host memory reported 2,931,136 KiB free physical memory and
6,012,372 KiB free virtual memory. Only one heavy worker tree was run at a time.
`npm run build:client` then passed, transforming 3,333 modules in 48.53 seconds
using the existing 2304 MiB Node heap limit. It regenerated document metadata
through the normal build script. No keyed service was restarted or replaced.

Build warnings: outdated Browserslist dataset; browser externalization of
node:crypto from code-index/snapshot and fs/promises/module from web-tree-sitter;
web-tree-sitter eval; mixed static/dynamic panelActionAdapters imports; large
chunks. These warnings were not repaired or treated as pairing failures.

This proves current renderer compilation and the bounded fixture input cases.
It does not establish package/content parity, native launch, acceptance, automatic
delivery, gameplay execution or any original CS1–CS4 exit. Full O5/O6, full
identity/continuation regression and final CS5 remain due; ET6/NAV are unchanged.
