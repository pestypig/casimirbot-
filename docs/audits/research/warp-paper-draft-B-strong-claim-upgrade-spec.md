# Paper Draft B (Strong-Claim Upgrade Spec)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Scope
This document defines what must be added beyond current reduced-order closure to support stronger scientific claim quality. It uses current repo status as baseline and then defines external-closure requirements.

## Baseline at Commit Pin
- Commit pin: `5506e72cafd8dc7534572d9285d932de2b858407`
- Current snapshot: `blocked=false`, `strongClaimClosure.passAll=true`
- Closure specs status:
  - A operator mapping: pass
  - B sampling/kernel provenance: pass
  - C curvature applicability: pass
  - D uncertainty decision band: pass
  - E literature parity replay: pass
  - F reproducibility agreement: pass
  - G promotion readiness/stability: pass

Source:
- `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`

## Strong-Claim Upgrade Objective
Move from internal reduced-order closure to externally defensible scientific-claim strength via independent reproducibility, explicit operator semantics closure against literature, and externally benchmarked uncertainty and validity domains.

## Upgrade Specs (External Closure)

## Spec H: Independent Reproduction
Requirement:
- Reproduce key artifacts and decisions on at least one independent environment using only pinned commit + documented commands.

Acceptance:
1. Regenerated values match within deterministic tolerances:
   - canonical decision/counts
   - G4 wave rows
   - promotion bundle summary
2. Certificate hash/integrity remain valid in independent run.
3. Independent run report committed as an audit artifact.

Fail condition:
- Any decision-count mismatch or non-reproducible artifact schema.

## Spec I: External Operator-Semantics Adjudication
Requirement:
- Independent technical adjudication of the operator mapping assumptions used by the pipeline (including renormalization/state semantics) against primary QI/QEI literature.

Acceptance:
1. Publish a machine-readable adjudication artifact with:
   - accepted assumptions
   - rejected assumptions
   - unresolved assumptions
2. Explicitly tie each assumption to literature references.
3. Map unresolved assumptions to deterministic guardrail outcomes.

Fail condition:
- Missing explicit assumption-to-evidence mapping.

## Spec J: Kernel/K Cross-Validation
Requirement:
- Cross-validate kernel normalization and K derivation using independent derivation/reference implementation.

Acceptance:
1. Replay K derivation independently for selected kernel(s) used in campaign.
2. Show tolerance-bound agreement with repo artifact values.
3. Publish mismatch analysis if any drift occurs.

Fail condition:
- Inability to reproduce K provenance chain for campaign kernel settings.

## Spec K: External Applicability-Domain Validation
Requirement:
- Validate that applicability criteria (curvature/timing domain assumptions) are robust to independent interpretation and not artifact-local conventions.

Acceptance:
1. Independent calculation reproduces applicability pass/fail outcomes per wave.
2. Boundary conditions and domain assumptions are explicitly stated.
3. Any ambiguity is converted to deterministic fail-closed conditions.

Fail condition:
- Applicability results sensitive to undocumented conventions.

## Spec L: Uncertainty Program Upgrade
Requirement:
- Expand uncertainty treatment from internal pass artifact to publication-grade uncertainty accounting and stress testing.

Acceptance:
1. Provide uncertainty budget with component-level decomposition.
2. Run perturbation/sensitivity bands over key variables.
3. Demonstrate decision robustness boundaries for reported pass regimes.

Fail condition:
- Pass status changes under plausible uncertainty perturbations without explicit policy coverage.

## Spec M: Materials/Device Constraint Closure
Requirement:
- Replace UNKNOWN rows in materials-bounds table with numeric constraints or explicit blocked evidence pathways.

Target rows to close:
1. Thermal envelope (dissipation/cooling limits)
2. Structural envelope (stress/strain limits)
3. Control jitter bounds and hardware timing limits

Acceptance:
1. Each row has numeric value, margin, and evidence path at commit pin.
2. Missing values are explicitly marked blocked with a closure plan.

Fail condition:
- Narrative-only statements without numeric constraints.

## Spec N: Claim-Governance Publication Gate
Requirement:
- Enforce publication-time policy checks that reject claim-tier violations automatically.

Acceptance:
1. CI/publication bundle fails on tier-collapsing language.
2. Boundary statement is validated verbatim.
3. Paper outputs include falsifier matrix and non-goals sections.

Fail condition:
- Ability to publish stronger claim language without evidence-tier support.

## VVUQ/Standards Alignment Matrix (H-N)

| Alignment item | Closure spec mapping | Acceptance criterion | Deterministic falsifier | Evidence artifact path | Confidence tier |
|---|---|---|---|---|---|
| Risk-based credibility mapping (ASME V&V 40 style) | H, N | claim tiers map to explicit credibility levels and required evidence depth | any tier lacks declared credibility requirement | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | high |
| VVUQ terminology normalization | H, I | manuscript terms mapped to canonical VVUQ vocabulary in appendix | undefined or conflicting term usage in methods/results | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | high |
| Multivariate validation metric adoption (VVUQ 20.1 style) | I, J | validation metric suite declared with threshold and acceptance rule | no thresholded validation metric for model-reference comparison | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | medium |
| Reduced-order to full-solve transition gate | K | deterministic transition rule for error, convergence, and uncertainty stability | transition executed without satisfying all criteria | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | high |
| Explicit RSET semantic declaration | L | renormalization scheme, state assumptions, and regularization declared | missing semantic declaration for stress-energy source | `docs/audits/research/warp-g4-operator-mapping-audit-2026-03-02.md` | medium |
| Stress-tensor fluctuation consistency criterion (exploratory) | L, M | exploratory threshold and reporting path defined; not a hard gate | treated as hard pass criterion before validation | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | low |
| Evidence-governance ledger enforcement | N | every promotion/claim delta has artifact, owner, status, and commit pin | claim promoted without ledger-backed artifact path | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | high |

PCS/QMU policy in this phase:
- Included as exploratory robustness overlays.
- Not mandatory hard-pass criteria until domain validation artifacts are available.

## Phase Plan

1. Phase 1: Independent reproduction pack (H)
2. Phase 2: External theory adjudication (I, J, K)
3. Phase 3: Uncertainty and materials closure (L, M)
4. Phase 4: Publication policy hard gate (N)

## Deliverables
- `docs/audits/research/warp-external-reproduction-audit-<date>.md`
- `docs/audits/research/warp-operator-semantics-external-adjudication-<date>.md`
- `docs/audits/research/warp-kernel-k-cross-validation-<date>.md`
- `docs/audits/research/warp-applicability-domain-validation-<date>.md`
- `docs/audits/research/warp-uncertainty-program-upgrade-<date>.md`
- `docs/audits/research/warp-materials-bounds-closure-<date>.md`
- `docs/audits/research/warp-publication-claim-governance-gate-<date>.md`

## Deterministic Falsifiers

| Falsifier | Trigger | Consequence |
|---|---|---|
| External reproduction mismatch | independent rerun diverges on decision/counts | block strong-claim upgrade |
| Semantics unresolved | operator assumptions not adjudicated | keep at reduced-order claim level |
| Kernel drift | independent K derivation mismatch | block kernel-closure claim |
| Applicability drift | independent domain classification differs | fail closed on applicability |
| Uncertainty instability | pass/fail flips under modeled uncertainty | block robust-pass claim |
| Materials unknowns | critical constraint rows remain UNKNOWN | block external-feasibility framing |
| Tier-credibility mismatch | claim tier published without mapped credibility requirement | block standards-aligned governance claim |
| Citation admissibility failure | normative claim lacks at least one primary/standard source | mark recommendation non-compliant |

## Non-Goals
- No full-system physical-feasibility claim from this campaign lane alone.
- No canonical override from exploratory outputs.
- No threshold weakening or pass relabeling.

## Exit Criteria for This Upgrade Spec
All specs H-N are satisfied with commit-pinned artifacts, and publication outputs pass policy checks without tier violations.
