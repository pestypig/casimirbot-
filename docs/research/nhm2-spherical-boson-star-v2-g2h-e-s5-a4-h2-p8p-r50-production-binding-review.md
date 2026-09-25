Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: Candidate-neutral R39 build-fixture evidence recovery
Capability or component: R50 production-entry binding and package-audit review
Current maturity: Local R50 ownership and failure/STOP fixtures pass 31/31; no production adapter, complete package audit or reviewer sign-off
Target maturity: Independently audited, inert R50 operator binding eligible for a separately authorized archive-retrieval proposal
Required frozen inputs: Consumed R48/R49 evidence, original execution root and startup path, R49 corrected safety CLI, R50 ownership/parent and source-disjoint replay
Required evidence: Exact dependency closure, source hashes, test-only-port exclusion, fresh R50 anchor policy, no-effect import and failure fixtures, reviewer findings
Stop/fail criteria: Reusing R48 launcher or consumed anchor, importing an unpinned effectful dependency, unbounded override, new resource action, skipped audit or any scientific/authority promotion
Explicit non-goals: Creating or claiming a production anchor, cloud execution, archive fabrication, Docker/build/P=1024/P=65,536, candidate evaluation, retuning or evidence deletion
Downstream gate unlocked: Preparation of a separately reviewed bounded retrieval proposal only; no execution authority

# R50 production-binding review — September 25, 2026

The local [R50 implementation packet](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r50-same-root-ownership-definition.md)
has actual parent-to-child and composed-controller failure/STOP fixtures, plus
Python source-disjoint ownership replay. These verify important seams but do
not constitute a production launcher, cloud receipt or independent reviewer
sign-off. The exact 12,122-byte R40 archive has not been recovered locally;
its absence makes a genuine successful-capture fixture unavailable today.

## Binding that must be frozen

An inert R50 entry must bind the following functions without allowing request
options to replace them. These are the direct local source identities observed
read-only on September 25; a final package audit must authenticate their
complete transitive imports and any host dependencies, not just this table.

| Bound function or source | Path under `C:\NHM2-P8P-Workflow-Review` | SHA-256 |
|---|---|---|
| `createR48AdmissionGate` | `p8p_r48_admission_gate_v1.mjs` | `9062c35ac05be4decd1fad516dbbc3e418d15a02618ea08b1bf18f27cdcece82` |
| `createR48Journal` | `p8p_r48_journal_v1.mjs` | `87de2bbbb967bbb018f2e7c0143a83cb37baf63aa262bf1e1ea8c9f1c1a25828` |
| `renderR48StartupBundle`, `stageR48Startup` | `p8p_r48_startup_stage_v1.mjs` | `22576776e1624c8823d68cdec1d27a947c6ff12fe93015663005ec303c9288e2` |
| `stageR48ChildHandoff` | `p8p_r48_handoff_stage_v1.mjs` | `b2356f23f6d11f37197f9899ca58aaaeaf1553008294fbfde1d58bfb19e65782` |
| `createR48ComposedRunner` | `p8p_r48_composed_runner_v1.mjs` | `2b50a12cb8726fe8684ea4e702e08086775f0fa3394068bae2741d2e99ab1900` |
| `bindR48LiveRuntime` | `p8p_r48_live_runtime_v1.mjs` | `512cba8a6844acef30aea74f8f917ae8a0bb69dcd73339f33a9bfe7452b67014` |
| Corrected child | `p8p_r49_safety_cli_v1.mjs` | `ccbb80800a532068a7773b0afdd2e3507af2602031ef679c4466f10e5922f355` |

The additive parent must be `scripts/nhm2/p8p-r50-parent-v1.mjs` at
`68211c0fa4ccb0f95e15add67429ad012a2cfc22906e36d4990df7557969a8e6`,
with `scripts/nhm2/p8p-r50-ownership-v1.mjs` at
`445818d63fe61bbea9459e54109cea7384aa76d32b4f51e469752cd705ba6bca`.
The test-only `fixtureControlRoot` port must be omitted from an operator
binding. The production root remains `C:\NHM2-P8P-Workflow-Review`, and the
unchanged R48 startup path, attempt directory shape and handoff protocol
remain mandatory.

## Why the old launcher cannot be reused

`p8p_r48_operator_launch_20260920.mjs` binds the consumed R48 attempt and
`p8p_r48_bound_entry_v1.mjs`; it does not call R50 ownership or the corrected
R49 child. The old `audit_p8p_r48_package_v3.py` additionally requires the
R48 host anchor to equal its prepared header. Read-only inspection finds the
old anchor is 307 bytes, whereas the R50 host-anchor path is absent. Restoring
the old anchor or invoking its launcher would be a retry/identity error.

A new package audit must include the R50 entry and all transitive imports,
verify the corrected child, accept a *fresh* R50 prepared-anchor format only
under a future explicit preparation authority, and retain `proposalReady`
false until an external proposal and direct grant are independently reviewed.
The operator flag alone must never be treated as proof of user authorization.

## Ordered decision boundary

1. Implement and locally test an inert, override-free R50 binding to the
   functions above. No production anchor or attempt may be created during this
   step.
2. Run a source-disjoint package/import-closure audit and obtain independent
   reviewer sign-off on the exact proposed bytes and remaining resource scope.
3. Only then freeze a separate one-shot retrieval proposal with its cost,
   runtime, stop, retention and first-failure terms; request explicit user
   authority for any cloud action.
4. After authenticated retrieval, test the successful capture with the exact
   archive bytes and classify the R39 build `exit=101`. Until then, P8Q remains
   `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED`.

This packet is planning and interface review only. It changes no scientific
semantics, runtime authority, receipt semantics, cloud resource or claim state.
