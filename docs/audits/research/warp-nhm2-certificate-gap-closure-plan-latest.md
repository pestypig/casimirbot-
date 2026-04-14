# NHM2 Certificate Gap-Closure Plan - 2026-04-12

## Decision
The required next step is a gap-closure plan, not a certificate implementation patch.

The recommended upstream source of truth for NHM2 `certificate_policy_result` is a dedicated NHM2 certificate-policy artifact produced as a policy wrapper over existing adapter-backed Casimir verifier output. Under the current repo state, a future certificate patch remains `admissible after gap closure plan`.

The same-chart full-tensor lane remains `NO_GO_UNDER_CURRENT_MODEL`. Tile `WEC` pause remains in force. Source closure remains `review` and is not the lead blocker.

## Current Boundary
Current full-loop readiness state remains:

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

Current boundary surfaces:

- contract: `shared/contracts/nhm2-full-loop-audit.v1.ts`
- publisher: `scripts/warp-york-control-family-proof-pack.ts`
- verifier semantics source: `cli/casimir-verify.ts`
- generic certificate policy guardrail: `WARP_AGENTS.md`

## Current Hard-Coded Behavior
The current publisher emits `certificate_policy_result`, but it does not yet populate the section from a live NHM2 certificate source.

Current hard-coded behavior in `scripts/warp-york-control-family-proof-pack.ts`:

- `certificatePolicyReasons = ["certificate_missing"]`
- `certificatePolicyState = "unavailable"`
- `artifactRefs = []`
- `viabilityStatus = "UNKNOWN"`
- `hardConstraintPass = null`
- `firstHardFailureId = null`
- `certificateStatus = null`
- `certificateHash = null`
- `certificateIntegrity = "unavailable"`
- `promotionTier = null`
- `promotionReason = "certificate_missing"`

So the section exists, but the NHM2 readiness lane still has no explicit wrapper artifact or deterministic mapping rule.

## Required Upstream Source Of Truth
The recommended source of truth is:

- a dedicated NHM2 certificate-policy artifact
- generated as a policy wrapper over existing adapter-backed Casimir verifier output
- carrying only NHM2-relevant readiness fields needed by `certificate_policy_result`

This is better than using raw verifier output directly because:

- raw Casimir verifier output is generic repo-level certificate evidence
- NHM2 full-loop is an overlay with its own section structure and tier semantics
- the wrapper can preserve generic verifier truth while making NHM2 mapping deterministic and replayable

This is better than inventing a new unrelated source because:

- `cli/casimir-verify.ts` already defines certificate status, hash, and integrity fields
- `AGENTS.md` and `WARP_AGENTS.md` already treat verifier/certificate status as a hard readiness boundary

## Required Mapping Rules
The future plan must specify a deterministic mapping for each full-loop field:

- `viabilityStatus`
  - source: wrapper-normalized interpretation of verifier outcome and certificate policy
  - expected values: `ADMISSIBLE`, `MARGINAL`, `INADMISSIBLE`, `UNKNOWN`
- `hardConstraintPass`
  - source: wrapper boolean derived from verifier hard-constraint result
- `firstHardFailureId`
  - source: verifier `firstFail.id` when the first failing item is a hard constraint
- `certificateStatus`
  - source: verifier certificate status field, normalized into NHM2 section semantics
- `certificateHash`
  - source: verifier certificate hash
- `certificateIntegrity`
  - source: verifier integrity boolean mapped to `ok`, `fail`, or `unavailable`
- `promotionTier`
  - source: wrapper decision for the tier supported by certificate readiness alone
  - expected default under current policy: `certified` only when certificate conditions are satisfied
- `promotionReason`
  - source: deterministic NHM2 reason code such as `certificate_missing`, `certificate_integrity_failed`, `certificate_integrity_missing`, `status_non_admissible`, or `policy_review_required`

No mapping rule should infer missing certificate fields from tile proxies, observer proxies, or unrelated runtime surfaces.

## Required State Rules
The future plan must specify section-state rules:

- `unavailable`
  - no NHM2 certificate-policy artifact exists
  - or wrapper artifact exists but required verifier/certificate fields are absent
- `review`
  - wrapper artifact exists
  - and certificate source is present
  - but policy interpretation remains incomplete, marginal, or explicitly review-gated
- `fail`
  - wrapper artifact exists
  - and any hard-gating certificate condition fails
  - including hard-constraint failure, non-admissible certificate status, or failed integrity
- `pass`
  - wrapper artifact exists
  - and hard constraints pass
  - and viability is admissible
  - and certificate hash is present
  - and certificate integrity is `ok`
  - and required artifact references are populated

These rules must be explicit before implementation begins.

## Required Artifact Rules
The future plan must specify artifact rules for `artifactRefs`.

Minimum required artifact-ref policy:

- primary artifact ref points to the dedicated NHM2 certificate-policy wrapper artifact
- supporting refs may point to persisted verifier evidence used to build that wrapper
- each ref must include deterministic path, contract version when applicable, and status

The wrapper artifact should be the NHM2-local citation surface. The raw verifier output should remain supporting evidence, not the only emitted reference.

## Required Test Rules
Before implementation is admissible, the following test rules must be explicit:

- contract validation test for `certificate_policy_result` with populated certificate fields
- publisher test for `unavailable` state when wrapper artifact is absent
- publisher test for `fail` state when certificate status or integrity is non-passing
- publisher test for `review` state when policy interpretation is present but not fully admissible
- publisher test for `pass` state only when all certificate gates are satisfied
- mapping test for `firstHardFailureId`, `certificateHash`, and `certificateIntegrity`

These tests should be sufficient to implement the certificate lane without touching physics files.

## Minimum Future Write Surface
Minimum likely write surface for a future certificate implementation patch:

- `scripts/warp-york-control-family-proof-pack.ts`
- `tests/warp-york-control-family-proof-pack.spec.ts`
- `tests/nhm2-full-loop-audit-contract.spec.ts`
- one dedicated NHM2 certificate-policy wrapper artifact producer or ingestion path

Conditionally only if current section fields prove insufficient:

- `shared/contracts/nhm2-full-loop-audit.v1.ts`

A future certificate patch should not need to touch:

- `modules/warp/natario-warp.ts`
- `server/energy-pipeline.ts`
- `server/stress-energy-brick.ts`

## Admission Gate For Implementation
A future certificate implementation patch is admissible only when all of the following are explicit:

- the wrapper artifact path and contract are named
- the wrapper input source is defined as adapter-backed Casimir verifier output
- field-by-field mapping rules are written down
- section state rules are written down
- artifact-ref rules are written down
- test cases are written down
- no physics-file edits are required for the certificate lane

Until then, the future certificate patch remains `admissible after gap closure plan`, but not yet ready to implement.

## Next Active Workstreams
- `certificate/policy readiness`
- `observer_completeness_and_authority` as a reporting-truth lane, while full-tensor implementation remains `NO_GO_UNDER_CURRENT_MODEL`
- no routine tile `WEC` remediation

Claim-tier effect under the current published state:

- claim tier cannot widen to `certified` before certificate readiness changes
- certificate readiness does not by itself resolve observer failure or overall NHM2 failure

## Non-Goals
- no certificate implementation in this patch
- no artifact JSON changes in this patch
- no observer-physics claim that the problem is solved
- no reopening of the NHM2 tile `WEC` lane
- no same-chart full-tensor implementation under the current model
- no source-closure policy widening
- no claim-tier widening
