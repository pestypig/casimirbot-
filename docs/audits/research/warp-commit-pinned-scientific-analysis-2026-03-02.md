# Commit-Pinned Scientific Analysis of Reduced-Order Full-Solve Gates and Evidence Requirements

## Evidence Base and Commit Pin
- Commit pin: `f54c4180f89370460eb9718dd04fed4115519b73`
- Boundary statement (verbatim):  
  “This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”

Authoritative local evidence files used:
- `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`
- `docs/audits/research/warp-paper-authoring-contract-2026-03-02.md`
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `WARP_AGENTS.md`
- `reports/math-report.json`

Tier contract (hard constraint):
- `canonical-authoritative`
- `promoted-candidate`
- `exploratory`

## Deliverable 1: Paper Draft A (Defensible Now)

### Abstract (Evidence-Bounded)
- Canonical execution report verdict: `REDUCED_ORDER_ADMISSIBLE`.
- Canonical scoreboard: `PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`.
- Promoted-candidate calculator reports `candidate_pass_found` with `congruentSolvePass=true`, `marginRatioRawComputed≈0.365`, applicability `PASS`.
- Promotion aggregate remains `INADMISSIBLE`, first fail `G4`, with `candidatePromotionReady=false` and `candidatePromotionStable=false`.
- Promotion bundle blocked: `promotion_check_not_ready:ready=false;stable=false`.
- Trace/certificate fields show PASS and integrity OK with hash `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.

Inference bounded by contract:
- Repo demonstrates a reduced-order, governance-enforced evidence framework.
- Repo does not claim physical feasibility, and promoted/exploratory lanes cannot override canonical-authoritative status.

### Methods
- Artifact-first extraction from commit-pinned local files.
- Claims are constrained by `warp-paper-authoring-contract-2026-03-02.md`.
- Canonical decisions come from canonical report and policy.
- Promoted-candidate metrics are treated as non-overriding unless readiness/stability pass.

### Results
Canonical-authoritative:
- Verdict: `REDUCED_ORDER_ADMISSIBLE`.
- Cross-wave aggregate includes `G4: PASS`, `G8: PASS`, `G5: NOT_APPLICABLE`.
- FordRomanQI policy shape present: `int_T00_dt >= -K / tau^4`.
- GR gate thresholds present with fail-closed unknown handling.
- G4 decomposition fields are present (`lhs_Jm3`, `boundComputed_Jm3`, `boundUsed_Jm3`, `tau_s`, `K`, floor flags, margin ratios).
- Wave reproducibility gate agreement is mixed (`NOT_READY` for A/B, `PASS` for C/D).

Promoted-candidate:
- Candidate profile: `Needle Hull Mark 2`, version `NHM2-2026-03-01`.
- Candidate calculator passes on its own lane.
- Promotion aggregate fails (`G4`, `G8`) and blocks promotion.
- Governance note enforces canonical authority.

Certification:
- PASS trace fields recorded with integrity OK and GREEN status in evidence pack/snapshot.

### Discussion
Supported now:
- Hard guardrails and canonical governance are explicit and enforceable.
- Margin decomposition is visible and reproducible as artifact fields.

Blocked/not fresh:
- Evidence pack explicitly records `freshAgainstSnapshot=false`.
- Promotion lane not executed due readiness/stability blocker.
- Wave-level reproducibility not uniformly PASS.

### Conclusion
Defensible now:
- A reproducible reduced-order gate framework with explicit policy, scoreboards, and certificate integrity fields.

Not defensible now:
- Physical feasibility claim.
- Tier upgrade from promoted/exploratory lanes while readiness/stability and freshness are unresolved.

### Reproducibility Appendix
- Commit pin: `f54c4180f89370460eb9718dd04fed4115519b73`
- Evidence files listed above.
- Evidence profile command contract includes:
  - `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`

## Deliverable 2: Paper Draft B (Strong-Claim Upgrade Spec)

Boundary statement (verbatim):  
“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”

### Strong-Claim Target Specs
Spec A: Operator semantics closure
- Prove the gated quantity maps to `<Tμνuμuν>_ren` with audited derivation.
- Metadata labels alone are insufficient.

Spec B: Sampling/kernel + `K` provenance closure
- Trace kernel definition/normalization and bound derivation end-to-end.
- Reproduce reference-case constants for declared kernel family.

Spec C: Curvature/boundary applicability closure
- Show quantitative validity regime (`tau` vs curvature/boundary scale).
- Validate that curvature applicability metrics are physical, not defaults.

Spec D: Uncertainty-propagated decision bands
- Propagate numerical + semantic + coupling uncertainty to gate decisions.
- Require robust PASS where uncertainty does not cross fail boundary.

Spec E: Device/material bounds closure
- Convert candidate parameter values into experimentally bounded margins.

Spec F: Reproducibility closure
- Remove `NOT_READY` reproducibility outcomes for adjudicated waves.
- Maintain stable trace/certificate integrity on replay.

Spec G: Tier-governance closure
- Require `freshAgainstSnapshot=true` and promotion readiness/stability true before any tier upgrade.

### Quantitative Acceptance Gate (Deterministic)
- PASS only when each spec’s artifact-backed criterion is satisfied.
- FAIL on falsifier trigger.
- UNKNOWN blocks stronger claims.

### Materials-Bounds Constraint Snapshot (Current)
| Subsystem | Field(s) | Current value signal | Status |
|---|---|---|---|
| G4 margin | `marginRatioRaw` Wave A | ~0.1289 | PASS (canonical lane) |
| Bound decomposition | `lhs_Jm3`, `boundComputed_Jm3`, `boundUsed_Jm3` | present | PASS (canonical fields present) |
| Sampling scale | `tau_s`, `tauWindow_s`, `tauPulse_s`, `tauLC_s` | present | PASS (reported) |
| QI constant | `K` | present | UNKNOWN (uncertainty/provenance closure pending) |
| Curvature applicability | `curvatureEnforced`, `curvatureRatio` | present | UNKNOWN (strong-claim closure pending) |
| Coupling residual | `couplingResidualRel` | near 1 | RISK FLAG |
| Candidate params | `gap_nm`, `qCavity`, `gammaVanDenBroeck`, sampler | present | UNKNOWN until device/material bounds closure |

### Deterministic Falsifiers
- F1 Operator-mapping falsifier: no audited derivation for renormalized stress-energy mapping.
- F2 Kernel/provenance falsifier: kernel/normalization not reproducible or bound shifts untracked.
- F3 Applicability falsifier: curvature/boundary regime invalid for selected inequality.
- F4 Decision-band falsifier: uncertainty overlaps fail boundary.
- F5 Reproducibility falsifier: trace integrity mismatch or wave reproducibility remains `NOT_READY`.
- F6 Tier-governance falsifier: freshness false or promotion readiness/stability false.

### Minimal Closure Program
1. Kernel + normalization replay harness and reference-case parity tests.
2. Operator-mapping audited derivation dossier.
3. Curvature applicability audit with quantitative regime evidence.
4. End-to-end uncertainty propagation into gate decision bands.
5. Device/material bounds evidence for promoted parameters.
6. Wave-level reproducibility closure and replay integrity.
7. Tier-governance freshness + promotion-readiness closure.

## End Block
Defensible now:
- Canonical reduced-order admissibility and policy-governed gate framework.
- Certificate integrity PASS fields present.

Not defensible yet:
- Physical feasibility.
- Tier upgrade while freshness/readiness/stability are unresolved.
- Treating promoted candidate pass as canonical override.

Next hard-gate actions:
1. Close operator mapping with audited derivation artifact.
2. Close kernel + `K` provenance via reference-case validations.
3. Close curvature applicability with non-degenerate evidence.
4. Add uncertainty-propagated decision bands.
5. Resolve wave reproducibility `NOT_READY`.

“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”
