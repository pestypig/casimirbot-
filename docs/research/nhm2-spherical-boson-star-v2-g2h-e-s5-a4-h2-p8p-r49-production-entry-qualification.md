Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: Candidate-neutral R39 build-fixture evidence recovery
Capability or component: R49 production-entry qualification
Current maturity: R49 additive unit tests pass; production composition fails local qualification
Target maturity: Independently verified, production-equivalent local execution path before any cloud proposal
Required frozen inputs: Consumed R48 terminal evidence; unchanged R48 sources; R49 wrapper identities recorded below
Required evidence: Real parent/child-path fixture, known-defect detection, durable STOP/evidence replay, provider-boundary contract and independent review
Stop/fail criteria: Any root/path mismatch, missing safety port, uncontrolled child, provider call during local qualification, failed evidence replay or changed scientific bytes
Explicit non-goals: Cloud execution, R48 retry, Docker/build/numerical execution, candidate evaluation, retuning, evidence deletion or authority promotion
Downstream gate unlocked: Candidate-neutral correction design and local qualification only; no cloud execution authority

# R49 production-entry qualification — September 24, 2026

The existing R49 checkpoint's 26/26 focused tests and 9/9 static audit remain
valid **for their tested seams**. They do not establish that the actual R48
parent/controller and detached safety child can use R49's distinct control
root. No R49 cloud execution or numerical process was attempted here.

## Local findings

1. `p8p_r49_bound_entry_v1.mjs` (SHA-256
   `4fff3526a567cbe4aa7813283966e5e9043f3749c9c41313cbddc748f8bfb8a7`)
   sets `baseRoot` to `C:\NHM2-P8P-Workflow-Review\r49-control`. The unchanged
   `p8p_r48_bound_entry_v1.mjs` then accepts a startup request only if its path
   is inside that new root. The unchanged `p8p_r48_recovery_controller_v1.mjs`
   (SHA-256
   `ec57e2978b7c9aeec8073de22a16a20b4b385f71cc5b12c4fb9d2`)
   requests the startup script in the original root. Consequently the parent
   cannot pass `renderStartup`; it fails before safety-child launch and before
   cloud mutation. The R48 resource-plan and startup-stage contracts also
   bind the original script path.
2. Even if the parent path were reconciled, `p8p_r49_safety_cli_v1.mjs`
   (SHA-256
   `ccbb80800a532068a7773b0afdd2e3507af2602031ef679c4466f10e5922f355`)
   passes `isProcessAlive` but delegates to `runR48SafetyCli` without changing
   its default `expectedRoot`. A read-only local invocation with correctly
   formed R49-root argument paths returned `r48_safety_cli_arguments` before
   its injected file-inspection sentinel was reached. The unchanged R48 CLI
   (SHA-256
   `9e7145c2af3e8a0228cf1cd4b73b27aceb53cfd950f790d60e8341119d54edc6`)
   expects the original root and also constructs the original startup path.
3. The six R49 unit tests pass, but the bound-entry test replaces the real
   parent and runner; the safety-CLI test replaces the real CLI and safety
   entry. Thus neither test exercises the path mismatch observed above.

The additive, no-cloud regression
[`scripts/nhm2/p8p-r49-production-binding.test.mjs`](../../scripts/nhm2/p8p-r49-production-binding.test.mjs)
is SHA-256 `ea33831c213c6d01f02a1671917f8df87a5f688ca319fcaa6e1f759fd33a7245`.
`node --test scripts/nhm2/p8p-r49-production-binding.test.mjs` passes 4/4:
the first test enters the real R49/R48 parent admission and startup seam with
all effects replaced, then confirms that the unchanged controller request is
rejected before staging; the second enters the real R49/R48 child CLI parser
and confirms rejection before file inspection. Two counterfactual tests show
that the unchanged parent accepts the startup request and the unchanged child
CLI reaches handoff inspection when both use the original root. All cloud,
filesystem-write and runner effects are substituted. A passing test here is
evidence of the root diagnosis, not evidence that a new attempt can run.

## Decision and next local gate

R49 is **not proposal-ready**. Preserve its files and receipts unchanged.
The fixed-root inventory includes the recovery controller, scheduled controller,
resource plan, startup stage, safety CLI, and parent entry. The journal audit
and layout replay ports also load hash-bound sources from the original root.
Moving the whole execution to `r49-control` would therefore require a
cross-component rebind, not a one-line CLI correction.

Two candidate-neutral designs remain for local comparison:

- Parameterize and re-audit every fixed-root consumer. This preserves R49's
  distinct root but changes a broad set of infrastructure contracts.
- Keep the original fixed execution root while introducing a new create-once
  host-anchor identity and separately versioned parent/reservation contracts
  for a new attempt. This may be narrower, but must prove that the consumed
  R48 anchor and attempt directory cannot be reused and that all old-root
  scientific and safety sources remain byte-identical.

The four local regressions favor the second design **for development**: the
unchanged parent startup path and child CLI parser both advance when the old
root is retained. This does not establish a safe new attempt. The existing
host-anchor and reservation code each require the consumed
`r48-host-anchor-v1.jsonl`, and the bound parent checks the same pathname.
An additive successor must version all three ownership checks together, prove
the old anchor cannot satisfy the new claim, and preserve the per-attempt
directory and evidence semantics. No design is selected or authorized for
cloud execution here; do not patch a consumed R48 or R49 file in place.

Then run one candidate-neutral local harness through the actual parent and
detached-child entrypoints, using a fake provider only at the cloud boundary.
It must reject the known root and liveness defects, prove first-failure STOP,
bounded child termination and durable evidence replay, and verify the fake's
contract against the real provider interface before a billable proposal.
No fresh attempt, candidate, proof or P8Q status is created by this document.
