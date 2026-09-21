Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.RIGHTS / CFP-1.DISTRIBUTION C13 product-scope decision
Capability or component: StarSim solar product registry and solar reference pack in the first customer EXE
Lifecycle stage: planned inclusion, request admission and customer-claim specification
Reaction timescale: release build and solar-observed request
Authority owner: Product owner selects first-customer treatment; StarSim/service owner preserves truthful supported behavior; qualified rights/content reviewer disposes data and citations; CFP-3.SIGNING/DISTRIBUTION verifies actual bytes
Current maturity: specified
Target maturity: specified with selected include-and-repair or exclude-and-disable branch, rights disposition and frozen release rejection checks
Required evidence: current build/stage and StarSim import graph; C13 data provenance; 14 placeholder references; selected customer feature list; exact build and route/UI acceptance
Explicit non-goals: no StarSim source, data, build, route, runtime, scientific-proof, release or production change; no legal permission or customer scientific claim from this packet
Downstream gate unlocked: none automatically; CFP-1 closure and canonical stage admission remain required

# CFP-1 C13 solar data release disposition v1

**Current owner direction (selection 106):** [exclude and disable](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-recommended-direction-owner-selection-106.md) the two solar JSON files and related customer route/claim in the first cohort. The alternative branch wording below describes the pre-selection analysis. Current build still includes the files; coordinated CFP-3 builder/stage/service/UI changes and signed-byte proof remain required.

The owner [selected the C01–C15 matrix as a provisional baseline](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-first-customer-component-baseline-owner-selection-52.md), with C13 **conditional**. The [prior source-byte check](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-staged-json-reference-and-runtime-check-76.md) found two staged StarSim JSON files and fourteen `https://example.com/starsim/` document URLs in the reference pack. This packet turns that unresolved conditional row into a bounded choice. It does not remove the StarSim research work or change the developer workstation.

## Source boundary rechecked at `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`

`apps/desktop/scripts/build-host.mjs` copies both `data/starsim/solar-product-registry.v1.json` and `solar-reference-pack.v1.json` into `dist/data`, hashes them in `service-dependencies.json` and bundles `server/index.ts` into `service.mjs`. `apps/desktop/scripts/stage-runtime.mjs` hard-codes exactly those two required-data paths and compares packaged bytes to the source before staging. The builder selects `dist/**`. Thus removing the files from a download or manually deleting them after build is **not** a coherent C13 exclusion: the current build/stage manifest requires them.

`server/routes.ts` mounts `/api/star-sim` when `fastBoot` is false. Its `/v1/resolve`, `/v1/run` and `/v1/jobs` paths call StarSim source resolution or execution. `server/modules/starsim/solar-reference-pack.ts` and `solar-product-registry.ts` load the default JSON lazily on the first relevant call, throwing if the files cannot be read. `sources/registry.ts` asks for both identities on a solar-observed request; solar diagnostics and repeatability use their contents. An omitted file can therefore leave a solar request failing at request time even if the service starts. This is an inference from the inspected call graph, **not** an installed failure measurement. This inspection does not establish the global account policy for the route or prove that every StarSim lane requires the two files. Client theory surfaces also mention StarSim; removing C13 data alone is not a promise that all StarSim references disappear from the UI.

## Owner choice and dependent implementation

| Branch | First-customer treatment | Required CFP-3 behavior and rejection checks |
| --- | --- | --- |
| **A — retain and repair** | Include both reviewed JSON files and any selected solar-observed feature only after identifying their creator/imported content, redistribution rights and real document sources. The fourteen placeholder URLs must be replaced or the corresponding citation/source claim explicitly removed under a reviewed content contract. | Freeze actual data hashes and `service-dependencies.json` keys in one signed build; verify every selected document ID/URL, product-to-document reference, notices and customer-visible source label. Exercise a selected solar request plus wrong/missing data, version drift and unsupported evidence states. Do not turn schema validity or a placeholder into scientific validation. |
| **B — exclude solar data and solar-observed customer behavior** | Exclude the two files from the first customer EXE and do not advertise solar-observed StarSim in that cohort. Keep research/developer source available in its governed checkout. This is a **recommended first-customer planning branch if no StarSim customer benefit is selected**, pending the owner's choice. | Change the desktop builder, service-dependency manifest, staging allowlist and signed-artifact tests together. Make solar-observed routes/operations explicitly unavailable with a typed, truthful result before any lazy file read; reconcile customer UI/catalog and support copy. Verify unrelated installed harness tasks still work, selected non-solar StarSim behavior is either tested or separately disabled, and no stale cached data produces a false enabled result. Extract the signed EXE to prove both files are absent; do not infer absence from source selection alone. |

Branch B is a **feature-scope decision**, not a qualified rights conclusion. It does not allow unreviewed StarSim code, content, assets or translated UI text to ship merely because the two JSON files are absent. If the owner wants the entire StarSim service out of the first customer binary, that is a wider C03/C13/client/server build choice requiring a separate import and artifact inventory; this two-file decision cannot stand in for it. Branch A likewise requires qualified review of the exact scientific-source wording and all retained data, not just a replacement URL string.

## Freeze and handoff

The product owner records A or B, whether any StarSim customer-facing entry remains in the first release, and the precise first-customer wording. The rights/content reviewer returns per-file origin, prior publication, attribution/notice and source-reliability disposition for A, or reviews any retained adjacent content for B. CFP-3.SIGNING/DISTRIBUTION then freeze an exact source/build manifest and implement the selected path, with a negative test for the other branch's accidental bytes or feature exposure. Preserve the developer account's broader development surface in the source checkout; public `user` presentation and signed customer inclusion are separate policy questions.

**Stage:** C13 remains conditional; no branch is selected by this packet. CFP-1 remains active (`specified`) and CFP-2/3 remain blocked under the [work program](../helix-environment-harness-work-program-v1.md).
