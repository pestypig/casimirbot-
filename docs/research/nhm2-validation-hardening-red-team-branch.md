# NHM2 Validation-Hardening Red-Team Branch

This branch is a validation-hardening and red-team harness for NHM2. It is not a validation announcement, a certified transport claim, or a physical warp-drive claim.

Permitted claim language:

```text
NHM2 is a lapse-extended Natario-style diagnostic / reduced-order candidate lane with bounded solve-backed outputs under review.
```

Forbidden claim language until all gates pass includes any statement that presents NHM2 as validated, as a certified full-warp result, as a physical proof of a GR-plus-quantum transport mechanism, or as demonstrating ambient faster-than-light transport.

## Branch Goal

The goal is to freeze one reference run, make every validation input traceable, and retire blockers in a sequence that is hard to overread. A clean result for this branch can still be a review or fail result if it identifies exactly which surfaces block promotion.

## Current Blockers

The current full-loop evidence remains review-tier. The full-loop audit records `currentClaimTier = diagnostic`, `maximumClaimTier = reduced-order`, `highestPassingClaimTier = null`, and blockers including `insufficient_provenance` and `policy_review_required`.

The current source-closure evidence has a small global residual, but regional closure is not promotion-safe while the tile side is only a diagnostic observation path and the expected regional `tile_effective_counterpart` surface is missing.

The observer lane must be reconciled from a single frozen run. A full-loop observer summary cannot override a detailed observer artifact that reports fail, unreadable publication surface, profile mismatch, or energy-condition blocker.

Mission-time, shift-vs-lapse, and related bounded outputs remain bounded diagnostics unless they all point to the same frozen profile, run, and artifact set.

Convergence, boundary sensitivity, smoothing sensitivity, independent reproduction, and artifact hash consistency must be emitted evidence or explicit blockers before validation language is allowed.

## External Context Boundaries

External theory is context only unless a checked repository artifact ties it to NHM2 evidence. The literature claim map at `docs/research/nhm2-literature-claim-map.v1.json` is the branch authority for support and non-support tags.

- Maldacena 1997 AdS/CFT supports controlled holographic context, not NHM2 source closure or transport validation.
- Ryu-Takayanagi and entanglement-wedge papers support geometry, entropy, and quantum-information context in holographic settings, not a local Casimir-tile source mechanism.
- `arXiv:2412.14014v3` supports treating observers as physically relevant in quantum-gravity reasoning, while preserving the caveat that observer inclusion mostly cancels the phase but leaves an overall minus sign.
- Traversable wormholes in four dimensions supports a narrow negative-Casimir-like-energy construction with ambient-causality discipline, not NHM2 warp-drive validation.
- Single-minus gluon tree amplitudes are nonzero is unrelated scattering-amplitudes context and does not support NHM2 source closure.

## Reference-Run Gates

The validator emits these gates:

```text
GATE_CLAIM_LOCK
GATE_NO_LATEST_ALIAS
GATE_PROFILE_MATCH
GATE_OBSERVER_ARTIFACT_CONSISTENCY
GATE_REGIONAL_SOURCE_CLOSURE_COUNTERPART
GATE_FULL_TENSOR_WHERE_CLAIMED
GATE_QEI_DOSSIER_PRESENT
GATE_REPRODUCIBILITY_FIELDS
GATE_LITERATURE_CLAIM_MAP
GATE_CERTIFICATE_DOES_NOT_OVERRIDE_REVIEW
```

`validationClaimAllowed` remains `false` unless a future policy explicitly changes the contract. Certificate-policy green cannot override a full-loop review state or failed reference-run gate.

## Workflow

1. Freeze a reference run with one commit, one profile, one run ID, and one artifact set.
2. Reject `latest` aliases in validation mode. Use audit-only mode only to produce a blocker ledger.
3. Reconcile full-loop observer summary against the detailed observer artifact and any public publication surface.
4. Require regional same-basis source closure against `tile_effective_counterpart`; diagnostic observation paths cannot pass as counterparts.
5. Keep diagonal summaries as reduced-order diagnostics. Prefer full-tensor evidence for observer robustness, source legitimacy, and metric-required stress-energy claims.
6. Require a QEI/QFT dossier before physical-mechanism language.
7. Emit convergence, boundary, smoothing, independent reproduction, and hash-consistency evidence or leave explicit blockers.

## Commands

```bash
npm run nhm2:freeze-reference-run -- --profile stage1_centerline_alpha_0p995_v1 --run-id <stable-run-id> --artifact-root artifacts/research/full-solve --out artifacts/research/full-solve/reference/nhm2-reference-run-<stable-run-id>.json
npm run nhm2:validate-reference-run -- --reference-run artifacts/research/full-solve/reference/nhm2-reference-run-<stable-run-id>.json
```

Use `--audit-only` on the freeze command when the current artifact set still contains `latest` aliases and the goal is to publish a blocker ledger rather than a validation-ready reference run.
