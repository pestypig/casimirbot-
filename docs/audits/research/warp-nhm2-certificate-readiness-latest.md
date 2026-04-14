# NHM2 Certificate/Policy Readiness - 2026-04-12

## Decision
The current NHM2 certificate/policy readiness gap is a `mixed_gap`.

A future certificate patch is `admissible after gap closure plan`, not because certification is close, but because the contract boundary already exists and the missing work is now a governance/runtime wiring problem rather than a physics-semantics problem.

The current same-chart full-tensor lane remains `NO_GO_UNDER_CURRENT_MODEL`. Tile `WEC` pause remains in force. Source closure remains `review` and is not the lead blocker.

## Current Readiness State
Current published full-loop state remains:

- `overallState = fail`
- `currentClaimTier = diagnostic`
- `highestPassingClaimTier = diagnostic`
- `sections.certificate_policy_result.state = unavailable`
- `sections.certificate_policy_result.reasons = ["certificate_missing"]`
- `sections.certificate_policy_result.certificateStatus = null`
- `sections.certificate_policy_result.certificateHash = null`
- `sections.certificate_policy_result.certificateIntegrity = unavailable`
- `sections.certificate_policy_result.promotionTier = null`
- `sections.certificate_policy_result.promotionReason = certificate_missing`

Current physics baselines remain unchanged:

- `metric WEC = -57110812.99010783`
- `metric DEC = -114221625.98021565`
- `tile WEC = -42531360768`
- `tile DEC = -85062721536`

## Current Certificate/Policy Boundary
`certificate_policy_result` is already part of the NHM2 full-loop contract and is emitted by the NHM2 full-loop publisher.

Current emitting boundary:

- contract shape: `shared/contracts/nhm2-full-loop-audit.v1.ts`
- publisher: `scripts/warp-york-control-family-proof-pack.ts`
- publisher function: `publishNhm2ShiftLapseFullLoopAuditImpl`

Current contract evidence shows:

- `certificate_policy_result` is a dedicated full-loop section
- the section supports `certified` only
- the section already has fields for `viabilityStatus`, `hardConstraintPass`, `firstHardFailureId`, `certificateStatus`, `certificateHash`, `certificateIntegrity`, `promotionTier`, and `promotionReason`

Current publisher evidence shows:

- `certificatePolicyReasons` is hard-coded to `['certificate_missing']`
- `certificatePolicyState` is hard-coded to `unavailable`
- `artifactRefs` is emitted as an empty array
- all certificate payload fields are emitted as `null` or `unavailable`
- the section checklist expects `published certificate-adjacent NHM2 policy artifact`

That means the boundary is explicit, but the NHM2 readiness lane still has no live certificate source wired into it.

## Evidence
Artifact evidence:

- `artifacts/research/full-solve/nhm2-full-loop-audit-latest.json` emits `sections.certificate_policy_result.state = unavailable`
- `artifacts/research/full-solve/nhm2-full-loop-audit-latest.json` emits `reasons = ["certificate_missing"]`
- `docs/audits/research/warp-nhm2-full-loop-audit-latest.md` lists certified-tier blocking reasons including `certificate_missing`
- `docs/audits/research/warp-nhm2-full-loop-audit-latest.md` lists expected evidence for `certificate_policy_result` as `published certificate-adjacent NHM2 policy artifact`

Contract and policy evidence:

- `shared/contracts/nhm2-full-loop-audit.v1.ts` defines `certificate_policy_result` as a certified-tier section
- `shared/contracts/nhm2-full-loop-audit.v1.ts` includes certificate reason codes such as `certificate_missing`, `certificate_integrity_missing`, and `certificate_integrity_failed`
- `AGENTS.md` requires adapter-backed verification and certificate integrity reporting for code/config patches
- `WARP_AGENTS.md` keeps generic warp viability and certificate semantics separate from the NHM2 overlay and treats missing certificate as not certified

Publisher evidence:

- `scripts/warp-york-control-family-proof-pack.ts` emits the section directly in the NHM2 full-loop publisher
- the same publisher does not currently read any NHM2 certificate artifact or Casimir output when building `certificate_policy_result`

## What Is Missing
The live blocker is the field-level readiness state itself:

- `sections.certificate_policy_result.state = unavailable`

The live reason code is:

- `certificate_missing`

The missing pieces are not only documentary. The current NHM2 lane lacks:

- a published NHM2 certificate-adjacent artifact or deterministic policy source of truth
- publisher wiring from that source into `certificate_policy_result`
- populated `artifactRefs` for the certificate/policy section
- populated certificate outcome fields in the emitted full-loop artifact

This is why the gap is `mixed_gap`, not `artifact_missing_only`.

## What Is Purely Policy vs Runtime
Purely policy/contract pieces already present:

- a dedicated full-loop section exists
- certified-tier gating is explicit
- certificate-related reason codes exist
- the section schema already supports certificate hash and integrity fields

Runtime/integration pieces still missing:

- NHM2-specific certificate/policy evidence artifact consumption
- runtime mapping from certificate source data into the full-loop section fields
- non-empty `artifactRefs` for the certificate section
- a deterministic admission rule that tells the publisher when to emit `pass`, `review`, `fail`, or `unavailable`

Therefore the current gap classification is `mixed_gap`:

- not `policy_contract_missing`, because the contract already exists
- not `runtime_emission_missing`, because the section is emitted today
- not `artifact_missing_only`, because the current publisher hard-codes `certificate_missing` and would still need integration work even if an artifact appeared

## Minimum Future Write Surface
Minimum likely write surface for a future certificate implementation patch:

- `scripts/warp-york-control-family-proof-pack.ts`
- targeted publisher tests in `tests/warp-york-control-family-proof-pack.spec.ts`
- targeted contract tests in `tests/nhm2-full-loop-audit-contract.spec.ts`
- one identified NHM2 certificate/policy artifact producer or ingestion path, likely as a new file or a clearly scoped existing publisher boundary

Conditionally only if current section fields prove insufficient:

- `shared/contracts/nhm2-full-loop-audit.v1.ts`

Current evidence does not require touching physics files such as `modules/warp/natario-warp.ts`, `server/energy-pipeline.ts`, or `server/stress-energy-brick.ts` for certificate readiness work.

## Admission Gate For A Future Certificate Patch
A future certificate patch is `admissible after gap closure plan` only if all of the following are explicit before editing:

- the upstream source of truth for NHM2 certificate/policy status is named
- the mapping from that source into `certificate_policy_result` fields is specified
- the section state rule is specified for `pass`, `review`, `fail`, and `unavailable`
- `artifactRefs` population rules are specified
- certificate hash and integrity semantics are specified and aligned with existing repo certificate policy
- test coverage is defined for both publisher behavior and contract validity

Without that gap-closure plan, certificate implementation should not start.

## Next Active Workstreams
- `certificate/policy readiness` as the next parallel lane with direct program value
- `observer_completeness_and_authority` remains open as a reporting truth lane, but the same-chart full-tensor implementation path remains `NO_GO_UNDER_CURRENT_MODEL`
- no routine tile `WEC` remediation

Certificate work can proceed independently of the observer/full-tensor no-go, but it does not resolve observer failure or make the overall NHM2 full-loop state pass by itself.

Claim-tier effect under current policy:

- certificate readiness is hard-gating for `certified`
- certificate readiness is not the only blocker for progression above `diagnostic`
- under the current published state, claim tier cannot reach `certified` before certificate readiness changes

## Non-Goals
- no certificate implementation in this patch
- no artifact JSON updates in this patch
- no observer-physics claim that the problem is solved
- no reopening of the NHM2 tile `WEC` lane
- no same-chart full-tensor implementation under the current model
- no source-closure policy widening
- no claim-tier widening