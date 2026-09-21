Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.RIGHTS / CFP-1.DISTRIBUTION independent source audit
Capability or component: Current desktop selector/source refresh 291 and component-review backlinks
Lifecycle stage: planned release-source specification before qualified rights return
Reaction timescale: mutable worktree read and later reserved signed cohort
Authority owner: Independent technical reviewer checks source and claims; qualified rights reviewer disposes components; release owner verifies built bytes
Current maturity: specified
Target maturity: specified with qualified C01–C15 disposition and exact planned source boundary
Required evidence: inspected HEAD/status, entrypoint imports, builder/stager selectors, source hashes and resolved links
Explicit non-goals: no authentication acceptance, license clearance, signed-byte proof, publication, code or production change
Downstream gate unlocked: none automatically; D11/D12 and CFP-1 remain open

# CFP-1 desktop-selector independent review — 2026-09-21

An independent read-only reviewer checked [source refresh 291](2026-09-21-cfp1-desktop-distribution-selector-source-refresh-291.md) and its links in the C01–C15 decision sheet, component-rights submission and canonical work program. Verdict: **PASS**, no actionable correction. The reviewer matched the stated HEAD, modified/untracked Auth0 files and two source hashes, confirmed `main.ts` imports the new callback and is bundled by `build-host.mjs`, and found no changed desktop package/lockfile or builder/stager file. The new module uses `node:http` and introduces no declared desktop dependency. The local archived-development-package folder remains outside the inspected package selectors.

The reviewer also confirmed that the source build still copies both C13 solar JSON inputs and the builder still points C15 publishing at the old draft GitHub feed. The public packet treats the Auth0 callback as mutable candidate source, not accepted authentication or a signed release. This technical review supplies neither a qualified rights disposition nor the later CFP-3 artifact proof; CFP-1 remains active (`specified`), CFP-2/3 blocked and G8 active.
