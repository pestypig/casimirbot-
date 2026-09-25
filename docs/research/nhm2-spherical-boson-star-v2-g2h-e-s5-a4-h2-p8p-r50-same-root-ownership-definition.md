Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: Candidate-neutral R39 build-fixture evidence recovery
Capability or component: R50 same-root one-shot ownership definition
Current maturity: Additive local implementation, temporary-root composed-controller failure/STOP fixtures, and source-disjoint ownership replay; no composed archive success or independent reviewer sign-off
Target maturity: Source-disjoint audit and real parent-to-detached-child local qualification before any proposal
Required frozen inputs: Consumed R48/R49 sources and results, original startup/root contract, R49 corrected safety CLI identity
Required evidence: Exact source hashes, fresh-anchor isolation, reservation replay, parent/child READY/STOP fixture, provider-boundary contract and independent review
Stop/fail criteria: Reuse of consumed anchor/attempt, root or science change, skipped grant, uncontrolled child, cloud effect in local tests or evidence failure
Explicit non-goals: Cloud execution, new production anchor preparation or claim, Docker/build/P=1024/P=65,536, candidate evaluation, retuning, evidence deletion or authority promotion
Downstream gate unlocked: Local integration and independent audit only; no cloud execution authority

# R50 same-root ownership definition — September 24, 2026

R49's distinct control root is incompatible with the unchanged R48 startup
and safety-child path contracts. The local [R49 qualification](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r49-production-entry-qualification.md)
reproduces both failures and shows that the original root advances at those
boundaries. R50 is an additive candidate-neutral definition that keeps the
original execution root and changes only one-shot ownership identity.

The implementation consists of:

| Local source | SHA-256 | Role |
|---|---|---|
| `scripts/nhm2/p8p-r50-ownership-v1.mjs` | `445818d63fe61bbea9459e54109cea7384aa76d32b4f51e469752cd705ba6bca` | New prepared-anchor/claim format and reservation check; retains per-attempt `r48-<attempt>` layout |
| `scripts/nhm2/p8p-r50-parent-v1.mjs` | `68211c0fa4ccb0f95e15add67429ad012a2cfc22906e36d4990df7557969a8e6` | New parent anchor pathname check; original startup root; R49 safety CLI hash binding; temporary-root-only fixture port |

The corresponding tests are SHA-256
`de38842370771a2529fb21ac986de2aa0dbd569b29c3a6408128d6c1261ea22b`
and
`331aff874c8850aefa90a7fbd4d19de058ffc2e97867f38f2312c65dcbc1c52b`.
Focused R50 tests pass 8/8. Combined with R49 local qualification and the
frozen R49 unit tests, the local battery passes 18/18. These tests use
temporary local directories or injected ports; they do not claim or prepare a
production anchor, create a real attempt, call a cloud provider, build an
image or run numerical work. A passing test is not a recovery receipt.

The separate test-only child
`scripts/nhm2/p8p-r50-harmless-child-v1.mjs` has SHA-256
`a7d65f8d6829c20c2962fd55400186527260eef127e1bdcd5af0e132f7ab7e09`;
its fixture `scripts/nhm2/p8p-r50-detached-child-v1.test.mjs` has SHA-256
`9d350eefee7de07acaac005c892a52141b87b47bc63957bb7c6a780790524fa6`.
It refuses a non-temporary control root and exposes no token, network or
cloud provider. With the real R48 safety launcher spawn settings, the
corrected R49 CLI ran in a distinct child process, verified the exact handoff
journal, published READY, observed a local release, issued one filesystem-fake
STOP and yielded a source-disjoint replayed `R48_STOP_VERIFIED` terminal. The
new fixture passes 1/1. A combined local battery including the nine existing
R48 harmless whole-path scenarios and the R49/R50 boundary tests passes 22/22.

The parent-to-child fixture
`scripts/nhm2/p8p-r50-parent-child-v1.test.mjs` has SHA-256
`e2b69f4692fd5e2b28444a335207a76d2c2a22394af8e570d97efa94736df432`.
It prepares and claims only a temporary R50 anchor, uses the actual new
reservation and parent, authenticates the pinned R49 CLI identity, then uses
a test-only runner and child adapter to exercise real detached launch, handoff,
READY, local release, one fake STOP and journal replay. The consumed-anchor
fixture remains unchanged. It passes 1/1 without production-root writes or
cloud calls. The `fixtureControlRoot` dependency is a trusted **test-only**
port; an eventual operator adapter must omit it and bind the production root.
The combined R48 harmless whole-path and R49/R50 local suite passes 23/23
at this layer.

The focused composed-controller fixture
`scripts/nhm2/p8p-r50-composed-preflight-v1.test.mjs` has SHA-256
`b95157e04f82aa6a3eb1fd8e4899f7579f2896a2507149082ae681a3bc6453a3`.
It passes the actual R50 parent and fresh temporary-root reservation into the
unchanged R48 composed runner, authenticates the pinned R49 safety entry,
and injects a read failure at the first preflight boundary. The controller
records `R48_FAILED`; source verification makes one separate readback attempt
in its cleanup path. A source-disjoint Python journal audit verifies the
workload chain and terminal. There is no child launch or mutation-provider call. This
is a controlled failure fixture, not a successful recovery or a full composed
provider qualification. The combined local suite now passes 24/24.

The full composed STOP fixture
`scripts/nhm2/p8p-r50-composed-stop-v1.test.mjs` has SHA-256
`8c92c47a699946db0084ddf475ad76e570fbd82f4d936e0b0cb73484236c0206`.
It passes the actual R50 parent, fresh temporary-root ownership, unchanged
R48 composed controller and detached R49 child. A filesystem-fake provider
returns valid source preflight, one derivative clone and one helper, then
deliberately invalid layout serial. The controller records `R48_FAILED`,
the child issues one fake STOP, and the independent Python audits accept both
channel journals and their cross-channel chronology. No cloud call, archive
capture, scientific computation or candidate evaluation occurs. The local
battery was 25/25 with this fixture included. A subsequent local hardening
requires any supplied `fixtureControlRoot` to be an immediate, non-symlink
`p8p-r50-` directory under the real OS temporary directory. The new test
proves that a fixture dependency cannot redirect execution into the fixed
production root before admission or anchor claim. The combined battery is now
26/26.

The additive read-only Python auditor
`scripts/nhm2/audit-p8p-r50-ownership-v1.py` has SHA-256
`5bc680ff499c84daef77a8f5c470b007fb02479a226b7612787f3c7ce146fcec`.
Its fixture test `scripts/nhm2/audit-p8p-r50-ownership-v1.test.mjs` has
SHA-256
`e686a2172eabbbf9a351093c25ef58c645517bcbbf38b036933fe9781014b9ad`.
The Python implementation independently reconstructs the exact claim,
reservation and first workload-record hashes, bounds and chronology from
temporary-root bytes. It rejects altered authority, claim, journal binding
and duplicate JSON keys. The focused auditor tests pass 5/5 and the combined
local suite passes 31/31. This is source-disjoint mechanical replay, **not**
an independent reviewer's sign-off or a cloud-execution receipt.

The new anchor filename is `r50-host-anchor-v1.jsonl`. Claiming requires its
exact prepared header, a regular single-link file, a create-once append and a
durable readback. The old `r48-host-anchor-v1.jsonl` cannot satisfy the new
claim, and the local test proves it is left unchanged. The reservation requires
the new anchor pathname and a fresh `r48-<attempt>` directory. The parent
rejects caller attempts to replace its base root or runner through request
options and binds the corrected R49 safety CLI at its recorded hash.

## Remaining qualification

R50 is **not an operator launcher or cloud proposal**. Before proposing any
resource action, the
[production-binding review](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r50-production-binding-review.md)
requires an inert override-free operator adapter and complete package audit;
an independent reviewer must audit source identity and the
new anchor/reservation semantics. The parent-to-child lifecycle fixture uses
a test-only runner and adapter; the newer composed STOP fixture covers the
unchanged controller and effect ports through deliberately failed layout and
independently replayed STOP. A further integrated fixture must cover successful
archive capture and check the fake provider's request/response contract against
the real interface. The successful local lifecycle does not prove a
recoverable R39 archive or authorize cloud execution. Read-only inspection on
September 25 found no 12,122-byte R40 archive in the known local R39/R41/R42/
R43 capture directories or the external workflow-review directory. The frozen
archive-capture hash cannot be satisfied by invented fixture bytes. Successful
capture qualification remains open until the exact authenticated bytes are
available; a fake positive receipt must not stand in for them.
No claim is made that R39's build `exit=101` has been diagnosed, that a
build-only fixture passes, or that P8Q has changed from STOP.
