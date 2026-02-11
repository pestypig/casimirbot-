# Warp Congruence Build Plan (Scientific Standard)

Status: active (P1-P7 complete; closure phases pending)  
Owner: dan  
Date: 2026-02-09  
Scope: Upgrade runtime pipelines + guardrails to CL3/CL4 geometry congruence using the audit findings.

## Sources
- `docs/warp-congruence-audit.md`
- `docs/warp-geometry-comparison.md`
- `docs/warp-geometry-congruence-report.md`
- `docs/warp-geometry-congruence-state-of-the-art.md`
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-geometry-cl4-guardrail-map.json`
- `docs/warp-tree-dag-task.md`

## Goal
Move runtime pipelines and guardrails from **proxy-only** to **geometry-derived** where the theories allow it, so CL3/CL4 congruence is real (not just traversal). This is the "scientific standard" target: guardrails must use ADM-consistent geometry and constraint-derived stress-energy, with explicit chart and observer contracts.

## Non-Goals
- No new feasibility claims.
- No changes to fundamental physics beyond the cited methods.
- No weakening of strict traversal defaults.

## Guiding Principles (from the audit)
- **Constraint-first**: geometry -> K_ij -> rho_E; not the inverse.
- **Chart contract**: CL1/CL2 require explicit slicing, and d_t gamma_ij handling must be declared.
- **Observer contract**: T00 must specify which observers (Eulerian, comoving, etc.).
- **Proxy labeling**: anything not derived from ADM + constraints is proxy-only.
- **Strict traversal stays CL4**: allow proxies only with explicit override.

## Long-Term Strategy Decision
**Selected option: CL4-first hardening.**

Implications:
- Geometry-derived guardrails become mandatory for runtime decisions.
- Proxy-only guardrails remain only as labeled fallbacks and cannot gate viability.
- P1-P5 are treated as required upgrades, not optional improvements.

## Success Criteria (global)
- All CL3/CL4 guardrails have geometry-derived inputs or are explicitly labeled proxy-only.
- Constraint gate residuals converge for at least one analytic metric adapter (Alcubierre or Natario Example 1.8).
- UI panels display whether values are geometry-derived or proxy-only.
- Casimir verification gate passes for every patch (required by `WARP_AGENTS.md`).

## Execution Status
- P1 complete: metric adapter + chart contract wired.
- P2 complete: metric-derived `warp.metric.T00` path and CL3 metric-only source wiring.
- P3 complete: `theta_geom` promoted with explicit proxy fallback.
- P4 complete: VdB derivative diagnostics (`region II` and `region IV`) plus two-wall support.
- P5 complete: Ford-Roman guardrail prefers metric/constraint rho, plus curvature-window checks.
- P6 complete: QI/source congruence labels surfaced in `QiWidget`, `QiAutoTunerPanel`, `DriveGuardsPanel`, and `TimeDilationLatticePanel` debug overlay.
- P7 complete: documentation closure and certification snapshot sync.
- Closure pending: remaining runtime congruence gaps tracked in `docs/warp-full-congruence-closure-task.md`.

## Latest Verification Snapshot
- Casimir verify verdict: `PASS`
- Certificate hash: `199cc38d772b45d8213fc6e5f020872589c37b2c5749b7bf286b671a1de4acec`
- Integrity: `OK`
- Training trace output: `artifacts/training-trace.jsonl` (latest run id is emitted by `npm run casimir:verify`) 

---

# Phase Plan

## Phase P0: Baseline + Traceability Lock
CL targets: CL0-CL4

Deliverables:
- Confirmed mapping between audit findings and upgrade targets.
- A frozen "before" snapshot of the CL4 guardrail map and audit.
- Explicit list of proxy-only guardrails to be upgraded or renamed.

Acceptance criteria:
- The "upgrade set" is logged (ThetaAudit, VdB band, Ford-Roman QI, CL3_RhoDelta, natario mapping, TS_ratio).
- The baseline audit is referenced and unchanged until P1 begins.

Artifacts:
- `docs/warp-congruence-audit.md` (baseline reference)
- `docs/warp-geometry-cl4-guardrail-map.md`

---

## Phase P1: Metric Adapter + Chart Contract
CL targets: CL1-CL2

Deliverables:
- A metric adapter interface that outputs (alpha, beta^i, gamma_ij) plus chart metadata.
- Chart contract enforced for all adapters (lab vs comoving vs spherical, etc.).
- Explicit handling of d_t gamma_ij (computed or asserted zero with justification).

Acceptance criteria:
- Every metric adapter declares its chart.
- Any use of C3 (stationary-slice reduction) is justified by chart contract.

Artifacts:
- `docs/warp-geometry-cl1-cl2-chart-contract.md`
- `docs/warp-metric-adapter.md`

---

## Phase P2: Constraint-First Stress-Energy Path
CL target: CL3

Deliverables:
- Compute K_ij from ADM (C2) and rho_E from Hamiltonian constraint.
- Compare constraint-derived rho_E to pipeline T00 and log delta.
- Route cl3-rho-delta guardrail through constraint-derived rho_E.
- Enforce metric-only CL3 gate source.

Acceptance criteria:
- CL3_RhoDelta reports geometry-derived comparisons in at least one metric adapter.
- Hamiltonian residuals are logged and bounded by policy thresholds.

Artifacts:
- `docs/warp-geometry-cl3-constraint-first-path.md`
- Constraint-first implementation notes in audit

---

## Phase P3: Theta Audit Upgrade (Geometry-Derived)
CL targets: CL2-CL4

Deliverables:
- Replace thetaCal proxy path with D_i beta^i or Tr(K) computed from ADM.
- Keep legacy thetaCal as `thetaProxy` (explicitly labeled proxy-only).
- Update guardrail metadata to reflect geometry-derived theta.

Acceptance criteria:
- Theta guardrail has a geometry-derived path and is labeled CL4-congruent.
- Proxy theta remains available only as a labeled fallback.

Artifacts:
- `docs/warp-geometry-cl4-guardrail-map.md` (updated)
- `docs/warp-congruence-audit.md` (status changed)

---

## Phase P4: Van Den Broeck Region-II Derivatives
CL targets: CL2-CL3

Deliverables:
- Implement B(r), B'(r), B''(r) in the VdB path.
- Two-wall signature diagnostic (region II + region IV).
- Update VdB guardrail to use derivative-dependent logic.

Acceptance criteria:
- VdB guardrail varies with transition thickness (tildeDelta).
- Region II stress-energy depends on B' and B'' as in paper.

Artifacts:
- `docs/warp-geometry-vdb-region-ii-method.md`
- VdB diagnostic report (new)

---

## Phase P5: Ford-Roman QI Guardrail Grounding
CL targets: CL3-CL4

Deliverables:
- QI guardrail uses constraint-derived T00.
- Sampling window compliance check added (tau_0 << curvature radius).
- Output explicitly states whether QI is constraint-derived or proxy-only.

Acceptance criteria:
- QI guardrail passes with geometry-derived inputs for at least one adapter.
- If geometry-derived inputs are not available, guardrail reports proxy-only.

Artifacts:
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-congruence-audit.md` (status updated)

---

## Phase P6: UI Congruence Labels + Panel Updates
CL targets: CL4 labeling

Deliverables:
- UI panels display "geometry-derived" vs "proxy-only" status.
- Panel tooltips include the guardrail chain reference.
- No UI implies physical viability when proxy-only.

Acceptance criteria:
- Time Dilation, Curvature, QI panels show congruence status.
- Panel surfaces do not blur proxy vs geometry-derived values.

Artifacts:
- `docs/knowledge/panel-concepts-tree.json`
- `docs/knowledge/panel-registry-tree.json`
- UI string updates (files TBD)

---

## Phase P7: Audit + Certification Pass
CL targets: CL3-CL4

Deliverables:
- Updated `docs/warp-congruence-audit.md` with new statuses.
- Updated `docs/warp-geometry-cl4-guardrail-map.md/json` reflecting upgrades.
- Casimir verification pass + certificate hash.

Acceptance criteria:
- Audit shows fewer proxy-only guardrails.
- Strict traversal remains CL4 by default.
- Verification gate returns PASS with integrity OK.

Artifacts:
- `docs/warp-congruence-audit.md`
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-geometry-cl4-guardrail-map.json`

---

# Phase Dependencies
- P1 is required before P2-P5.
- P2 is required before P3 and P5.
- P4 can run in parallel with P2 once chart contracts are defined.
- P6 can run after P3/P5, because labels depend on guardrail status.
- P7 closes the loop after all upgrades.

# Required Verification (per `WARP_AGENTS.md`)
- Run `npm run math:report` and `npm run math:validate` for every patch.
- Run required warp/GR tests listed in `WARP_AGENTS.md`.
- Run Casimir verification via the adapter endpoint and report PASS + certificate hash.

# Open Questions (to resolve before P1)
- Which chart is canonical per adapter (lab vs comoving vs spherical)?
- Which metric adapter should be the first "golden" constraint-first reference?
- Where should ADM adapter outputs live in the runtime pipeline?

# Start Point Recommendation
Start with P1 and P2 to unblock CL3/CL4 upgrades. Without chart contracts and constraint-first rho_E, later guardrail work remains proxy-only by design.

## Post-P7 Continuation
`docs/warp-full-congruence-closure-task.md` is the active follow-on task for final runtime closure:
- Remove remaining proxy-backed hard-decision paths.
- Expand chart/family coverage for metric-derived `warp.metric.T00`.
- Make derivative-rich VdB logic universal across active VdB surfaces.
