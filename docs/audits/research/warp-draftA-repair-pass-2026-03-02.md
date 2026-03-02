# Draft A Repair Pass (Commit-Pinned, Artifact-First)

“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”

## 1) Commit Pin and Fail-Closed Repair Pass

- Commit pin: `50d4118a82cfb9ed54835b68b7d3fdaa3e80117a`
- Repair rule: fail if any required local file is unreadable.
- Result: `PASS` (all required files readable).

Required file set checked:
- `WARP_AGENTS.md`
- `shared/warp-promoted-profile.ts`
- `scripts/warp-full-solve-calculator.ts`
- `scripts/warp-g4-candidate-promotion-check.ts`
- `scripts/warp-full-solve-promotion-bundle.ts`
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `artifacts/research/full-solve/g4-calculator-2026-03-01.json`
- `artifacts/research/full-solve/g4-candidate-promotion-check-2026-03-01.json`
- `artifacts/research/full-solve/g4-promotion-bundle-2026-03-01.json`
- `reports/math-report.json`
- `artifacts/training-trace.jsonl`
- `artifacts/training-trace-export.jsonl`

## 2) Draft A Rebuild (Artifact-First)

### Methods (artifact-first)

Primary evidence for this rebuild is local artifacts/scripts at the pinned commit:
- profile definition: `shared/warp-promoted-profile.ts`
- single-case solver: `scripts/warp-full-solve-calculator.ts`
- promotion diagnostics: `scripts/warp-g4-candidate-promotion-check.ts`
- promotion orchestration: `scripts/warp-full-solve-promotion-bundle.ts`
- outputs: `artifacts/research/full-solve/g4-*.json`
- policy and guardrails: `WARP_AGENTS.md`
- stage registry: `reports/math-report.json`

### Results (local artifacts)

#### 2.1 Promoted profile constants (Needle Hull Mark 2)
From `shared/warp-promoted-profile.ts`:
- `solutionCategory`: `Needle Hull Mark 2`
- `profileVersion`: `NHM2-2026-03-01`
- key solve parameters: `warpFieldType=natario_sdf`, `gammaGeo=1`, `dutyCycle=0.12`, `sectorCount=80`, `concurrentSectors=2`, `qCavity=100000`, `qSpoilingFactor=3`, `gammaVanDenBroeck=500`, `gap_nm=8`, `shipRadius_m=2`, `qi.sampler=hann`, `qi.fieldType=em`, `qi.tau_s_ms=0.02`.

#### 2.2 Calculator artifact (single-case promoted profile)
From `artifacts/research/full-solve/g4-calculator-2026-03-01.json` (regenerated at pinned commit):
- provenance commit: `50d4118a82cfb9ed54835b68b7d3fdaa3e80117a`
- `decisionClass`: `candidate_pass_found`
- `congruentSolvePass`: `true`
- `lhs_Jm3`: `-6.471651584884176`
- `boundComputed_Jm3`: `-18.000000000018126`
- `boundUsed_Jm3`: `-18.000000000018126`
- `marginRatioRaw`: `0.35953619915986995`
- `marginRatioRawComputed`: `0.35953619915986995`
- `applicabilityStatus`: `PASS`
- `reasonCode`: `[]`
- `rhoSource`: `warp.metric.T00.natario_sdf.shift`
- `quantitySemanticType`: `ren_expectation_timelike_energy_density`
- `quantitySemanticComparable`: `true`

Interpretation: the promoted profile passes in direct calculator evaluation under current reduced-order congruent-solve checks.

#### 2.3 Candidate promotion check artifact (lane-level reality)
From `artifacts/research/full-solve/g4-candidate-promotion-check-2026-03-01.json` (regenerated at pinned commit):
- provenance commit: `50d4118a82cfb9ed54835b68b7d3fdaa3e80117a`
- recovery provenance commit: `3b86c282ad24e9c7df0d249ac1790db78a9eba58`
- seed candidate: `case_0001`, `comparabilityClass=comparable_canonical`
- seed candidate margins: `marginRatioRaw=0.12890679702998561`, `marginRatioRawComputed=0.12890679702998561`
- seed candidate applicability: `PASS`
- aggregate gate status: `G4=FAIL`
- aggregate counts: `PASS=7, FAIL=1, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`
- aggregate decision: `INADMISSIBLE`
- first fail: `G4`
- `candidatePromotionReady=false`
- `candidatePromotionStable=false`
- mismatch flag: `promotionPathMismatch=true` with reason `recovery_seed_pass_but_wave_promotion_failed`

Interpretation: a passing comparable seed exists, but wave-level promotion lane still fails G4; promotion is currently blocked by readiness/stability criteria.

#### 2.4 Promotion bundle artifact (promotion gate)
From `artifacts/research/full-solve/g4-promotion-bundle-2026-03-01.json` (regenerated at pinned commit):
- `blockedReason`: `promotion_check_not_ready:ready=false;stable=false`
- `candidatePromotionReady=false`
- `candidatePromotionStable=false`
- `promotionLaneExecuted=false`
- commit hash: `50d4118a82cfb9ed54835b68b7d3fdaa3e80117a`

Interpretation: no promotion-lane run was admitted; canonical authority is preserved.

#### 2.5 Canonical command state at pinned commit
Running `npm run warp:full-solve:canonical` currently fail-closes with:
- “Promotion check artifact indicates `candidatePromotionReady=false`; refusing promotion.”

Interpretation: the workflow is intentionally promotion-gated and currently blocked by policy.

#### 2.6 Policy and stage posture
From `WARP_AGENTS.md` and `reports/math-report.json`:
- hard constraint includes Ford-Roman style inequality: `int_T00_dt >= -K / tau^4`
- viability policy requires `ADMISSIBLE`, disallows “marginal as viable,” and treats missing certificates as uncertified
- stage coverage currently reports modules across `exploratory`, `reduced-order`, `diagnostic`, and `certified` tiers.

#### 2.7 Verification trace posture
From local verification traces:
- `artifacts/training-trace.jsonl` latest line: `id=22341`, `traceId=adapter:52917e18-df94-47f6-9e5d-6cdf456e3948`, `pass=true`
- `artifacts/training-trace-export.jsonl` exists/readable and was refreshed.

## 3) Literature Parity Overlay (Layered After Local Evidence)

### 3.1 Where parity is directionally aligned
- The repo hard constraint shape `-K/tau^4` is directionally aligned with standard timelike worldline QI/QEI scaling families in 4D reduced-order usage.
- Explicit applicability status and reason-code gating is aligned with fail-closed methodology when semantic/metric conditions are not met.

### 3.2 Where parity remains incomplete for strong physical claims
- Kernel/normalization provenance is not yet surfaced in one closure artifact tying the exact sampler normalization to the specific `K` derivation used for pass/fail decisions.
- Operator semantics are asserted (`quantitySemanticType=ren_expectation_timelike_energy_density`) but still require closure evidence linking metric/proxy channels to a renormalized operator mapping in a way that is independently auditable for physical-feasibility claims.
- Promotion evidence still shows seed-pass vs wave-fail divergence (`promotionPathMismatch=true`), which blocks claim stability.

## 4) Defensible Now vs Not Defensible

### Defensible now (artifact-backed)
- A commit-pinned promoted-profile calculator run passes (`candidate_pass_found`) with `marginRatioRawComputed < 1`.
- Promotion remains blocked because lane-level aggregate still fails G4 and readiness/stability are false.
- Canonical-authoritative workflow is currently fail-closed on promotion readiness.

### Not defensible yet
- Strong physical-feasibility claim from current evidence.
- Treating seed-candidate pass as equivalent to stable wave-level promotion pass.
- Treating semantic labeling alone as full QFT operator closure.

## 5) Immediate Closure Actions

1. Produce a promotion-lane comparability bundle that is commit-fresh and wave-stable (`candidatePromotionReady=true` and `candidatePromotionStable=true`) before any promotion claim.
2. Emit a single machine-readable QI provenance record that binds: sampler normalization, `tau` selection source, `K` derivation, and operator-mapping assumptions.
3. Keep canonical authority policy unchanged; no threshold weakening.

