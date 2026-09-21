Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.RIGHTS / CFP-1.DISTRIBUTION current source boundary
Capability or component: C01 desktop callback code, C02 dependency manifests, C13 service data and C15 feed selector
Lifecycle stage: planned release-component specification before qualified rights return
Reaction timescale: current mutable worktree and one later reserved signed cohort
Authority owner: Product owner selects planned components; qualified reviewer disposes rights; CFP-3 release owner proves exact built bytes
Current maturity: specified
Target maturity: specified with a current planned-source and qualified rights/notice disposition
Required evidence: current entrypoints, builder/stager selectors, dependency manifests, worktree status and later extracted customer artifact
Explicit non-goals: no runtime/build mutation, Auth0 factor acceptance, signed-byte claim, Git publication, feed migration or CFP-stage promotion
Downstream gate unlocked: none automatically; C01–C15/D11/D12 and CFP-1 remain open

# CFP-1 desktop distribution-selector source refresh — 2026-09-21

At source HEAD `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`, the **working tree** has modified `apps/desktop/src/main.ts`, `apps/desktop/src/auth0-account-link.ts`, `shared/desktop-auth0-account-link.ts` and `server/routes/desktop-auth0-step-up.ts`, plus a new untracked `apps/desktop/src/auth0-loopback-callback.ts`. The inspected desktop diff makes `main.ts` import that new callback module for Auth0 return handling. `apps/desktop/scripts/build-host.mjs` still bundles `main.ts` as the Electron main entrypoint, so this module is within the **candidate C01 source closure if the current worktree is built**. It is not an accepted public authentication flow or a verified packaged byte. The two inspected desktop source hashes at this read were `90840BCF957B9D85E20277A75734CF51C1364A0066E46F30C3D40BBF52240B18` (`main.ts`) and `DB311BC16B740D469AEB751A6C3A6F6BAB57545150F48D1407322390AE23494D` (new callback module); both are mutable worktree evidence, not a signed-cohort fingerprint.

The tracked desktop package/lockfile and the inspected `electron-builder.config.cjs`, `build-host.mjs` and `stage-runtime.mjs` had no local modifications at this read. The new callback module uses Node's built-in HTTP server and does not add a declared desktop dependency in those manifests. The builder still selects `dist/**` and `package.json`, while the stager broadly copies `dist/public` and only the tunnel executable plus its LICENSE from the pinned vendor folder. This leaves the existing C02–C04 rights/notice and C03 broad-client-asset review open; an unchanged selector is not proof that the current output bytes match an earlier ASAR inventory.

Two previously selected first-customer **exclusions/migrations remain unimplemented** in the inspected selectors: `build-host.mjs` still copies the two StarSim solar JSON files into `dist/data` (C13), and `electron-builder.config.cjs` still points GitHub draft publishing to `pestypig/casimirbot-` (C15), not the planned separate public binary feed. Neither observation proves a release was built or published. The untracked `apps/desktop/archived-development-packages/` directory is outside the builder's `dist/**` and listed `extraResources` selectors; it is local archive material, not a selected customer artifact in this configuration. Its own origin and future repository treatment are separate from the signed output check.

**Reviewer consequence:** rebind C01/D02 rights and account-flow questions to the source actually selected for the later release; do not treat the earlier `256554...` source baseline or this mutable HEAD alone as final. Recheck C02–C04 package closure, C03 assets, C13 exclusion and C15 updater/feed metadata against a reserved, extracted signed build in CFP-3. The planned component matrix and qualified D11 return still precede D12 claims; CFP-1 remains active (`specified`), CFP-2/3 blocked and G8 active. No code, runtime, production, billing or repository visibility was changed by this read.
