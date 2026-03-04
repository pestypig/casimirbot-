# Paper Draft A (Defensible Now, Commit-Pinned)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Evidence Scope
- Commit pin: `5506e72cafd8dc7534572d9285d932de2b858407`
- Primary evidence summary: `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- Snapshot companion: `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`
- Claim-governance contract: `docs/audits/research/warp-paper-authoring-contract-2026-03-02.md`

## Abstract
This draft reports the current reduced-order campaign state using commit-tracked repository evidence at one pin. Canonical adjudication is `REDUCED_ORDER_ADMISSIBLE` with gate counts `PASS=8`, `FAIL=0`, `UNKNOWN=0`, `NOT_READY=0`, `NOT_APPLICABLE=1`. The work is scientifically useful as a reproducible reduced-order closure with explicit falsifiers and a standards-aligned upgrade path; it is not, by itself, a full-system physical feasibility claim.

## Methods
1. Parse the commit-pinned evidence snapshot and required sub-artifacts.
2. Enforce tier separation from the authoring contract:
   - `canonical-authoritative`: decision labels, scoreboard, policy status.
   - `promoted-candidate`: candidate metrics and promotion readiness.
   - `exploratory`: parity overlays and interpretation hypotheses.
3. Reject any claim that requires missing numeric evidence; mark such rows `UNKNOWN`.
4. Use deterministic artifact fields only (no narrative substitution).
5. Resolve contradictions by canonical precedence:
   - canonical campaign execution report
   - decision ledger
   - governance matrix
   - then summary packs.

## Results

## Canonical-authoritative
- Decision: `REDUCED_ORDER_ADMISSIBLE`
- Counts: `PASS=8`, `FAIL=0`, `UNKNOWN=0`, `NOT_READY=0`, `NOT_APPLICABLE=1`
- First fail: `none`
- Reproducibility by wave: `A=PASS`, `B=PASS`, `C=PASS`, `D=PASS`
- Snapshot blocked state: `blocked=false`

Source:
- `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`

## Promoted-candidate
- Calculator: `decisionClass=candidate_pass_found`, `congruentSolvePass=true`, `applicabilityStatus=PASS`, `marginRatioRawComputed=0.3235753006526127`
- Promotion check: `aggregateDecision=REDUCED_ORDER_ADMISSIBLE`, `candidatePromotionReady=true`, `candidatePromotionStable=true`
- Promotion bundle: `blockedReason=null`, `promotionLaneExecuted=true`, `promotionLaneG4ComparablePassAllWaves=true`
- Promotion lane wave metrics (A-D):
  - `lhs_Jm3=-3.093763128722717`
  - `boundUsed_Jm3=-24.00000000002375`
  - `marginRatioRawComputed=0.12890679702998564`
  - `applicabilityStatus=PASS`

Source:
- `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`

## Exploratory
- Literature parity replay artifact exists and currently reports pass (`blockedReason=null`).
- Scan classification still records a canonical/scan mismatch structure in ledger (`classificationMismatch=true`), with canonical class retained as authoritative by policy.

Source:
- `docs/audits/research/warp-g4-literature-parity-replay-2026-03-02.md`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`

## Certification
- Latest trace fields in snapshot:
  - `pass=true`
  - `firstFail=null`
  - `certificateHash=6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
  - `integrityOk=true`
  - `status=GREEN`

Source:
- `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`

## Materials-Bounds Constraints Table

| Subsystem | Constraint | Value | Measured/Derived | Margin | Evidence Path | Status |
|---|---|---:|---:|---:|---|---|
| Casimir gap control | `gap_nm` | 8 | Derived (candidate params) | UNKNOWN | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` | PASS (value present) |
| QI sampling | `tau_s_ms`, kernel normalization | `0.02`, `unit_integral` | Derived (guard diagnostics) | UNKNOWN | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` | PASS (value present) |
| QI bound constant | `K` | `3.8e-30` | Derived (guard diagnostics) | UNKNOWN | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` | PASS (value present) |
| RF/Q cavity | `qCavity` | 100000 | Derived (candidate params) | UNKNOWN | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` | PASS (value present) |
| Control timing | `TS_ratio` / timing signals | available in diagnostics | Derived | UNKNOWN | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` | PASS (value present) |
| Thermal envelope | max dissipation/cooling | UNKNOWN | UNKNOWN | UNKNOWN | no dedicated artifact in required set | UNKNOWN |
| Structural envelope | hoop/strain/stress limits | UNKNOWN | UNKNOWN | UNKNOWN | no dedicated artifact in required set | UNKNOWN |

UNKNOWN handling rule:
- Unknown values remain `UNKNOWN` unless a commit-tracked numeric artifact exists.
- Unresolved RSET semantics and stress-tensor fluctuation thresholds are not collapsed into PASS claims.

## Falsifier Matrix

| Falsifier | Deterministic trigger | Invalidates |
|---|---|---|
| Operator mapping falsifier | operator mapping audit missing or blocked | Any claim of operator-level QEI parity |
| Sampling/K falsifier | kernel provenance audit missing/mismatch | Any claim that K/tau provenance is closed |
| Applicability falsifier | curvature applicability audit blocked/not-pass | Any claim that applicability domain is satisfied |
| Uncertainty falsifier | uncertainty audit blocked or decision band unresolved | Any robust-pass claim |
| Reproducibility falsifier | snapshot blocked, provenance mismatch, or trace integrity failure | Any reproducibility claim |

## What This Research Improves Now
1. Adds standards-oriented governance language without changing reduced-order gate semantics.
2. Provides explicit source-quality hierarchy (primary/standard first) for manuscript claims.
3. Improves reproducibility framing by adding deterministic staleness/conflict reporting expectations.
4. Strengthens closure planning by mapping unresolved items to falsifier-driven upgrade steps.

## What Remains Unresolved
1. Cross-disciplinary consensus for renormalized stress-energy semantics in this reduced-order context.
2. Standardized stress-tensor fluctuation thresholds suitable for campaign-level hard gating.
3. Fully commit-tracked trace payloads when runtime artifacts are ignored by git.
4. Independent external replication package for strong-claim scientific escalation.

## Non-Goals
- No full-system physical-feasibility claim from this campaign alone.
- No canonical override from promoted-candidate or exploratory lanes.
- No threshold or policy weakening.

## Conclusion
At this commit pin, the repository supports a defensible reduced-order evidence claim set with canonical admissibility, promotion readiness/stability true, strong-claim closure specs A-G passing in the snapshot, and PASS certification traces with integrity OK. This is scientifically valuable because it narrows viable parameter space under deterministic gates and provides a reproducible path for stronger external closure; it does not, by itself, authorize a full-system physical feasibility claim.
