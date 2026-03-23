# NHM2 Derivation-First Deep Research Prompt Artifact for Needle Hull Mark 2 

## Repository baseline and non-feasibility constraints

The repo already contains a **general paper Deep Research prompt** (`warp-paper-deep-research-prompt-v1.md`) that is **commit-pinned**, defines a **repository accessibility rule** (“use only committed/readable files”), and locks an **evidence precedence rule** where canonical campaign artifacts outrank summaries and literature overlays. This matters for a derivation-first prompt because it establishes two non-negotiables: do not “paper over” missing artifacts (fail closed), and do not let external literature override canonical repo state.

The repo’s **top-level authority map** for NHM2 is the **Proof Anchor Index** (`warp-needle-hull-mark2-proof-anchor-index-latest.md`), which explicitly instructs that it should be used as the default citation map for Needle Hull Mark 2 paper generation and lists the canonical authority chain (execution report -> decision ledger -> governance matrix -> evidence pack -> evidence snapshot). Any derivation-first prompt that produces audit-grade equation chains must therefore treat the proof index as the “table of contents” for what is admissible and how to cite it.

Separately, the **Paper Authoring Contract** codifies the repo’s **claim-tier discipline** and hard “non-goals,” including the requirement that the boundary statement remain verbatim and that missing values be explicitly marked `UNKNOWN` rather than inferred. This contract also mandates a **numeric materials-bounds table** (with explicit `UNKNOWN` when needed) and a falsifier matrix, reinforcing that even a physics-forward derivation appendix must remain **reduced-order / falsifiable / non-feasibility** rather than drifting into feasibility advocacy.

Finally, the NHM2 **Conceptual Guide** reiterates the repo’s posture: the contribution is framed as assumptions + falsifiable gates + fail-closed evidence governance, and it explicitly positions GR observables (Mercury, lensing, frame dragging, Shapiro delay) as benchmark sanity checks rather than feasibility proof. The same guide also anchors QI/QEI as governance guardrails and lists the “Core-4” warp-family lineage used for overlay comparison (Alcubierre, Natario, Van den Broeck, Lentz) with explicit non-comparability handling.

## What the repo already contains for derivation-grade equation chains

A derivation-first prompt can and should demand equation-by-equation reconstruction because the repo already stores several “equations-first” artifacts (not merely prose summaries):

The **Alcubierre alignment package** provides canonical equations in an ADM 3+1 “shift-only” form (lapse alpha = 1), including the line element, the smooth top-hat shape function `f(r_s)`, the expansion scalar/York-time `theta`, and an Eulerian energy-density form `T^{00}` with qualitative topology expectations (toroidal wall localization, axial node). This is already directly aligned to what a physicist expects to audit: explicit metric form -> derived scalars -> expected sign/topology checks.

The repo explicitly disambiguates **theta semantics** between an engine-facing canonical `theta` and a Natario diagnostic. In particular, it defines the canonical `theta` scaling as `theta = gamma_geo^3 * q * gamma_VdB * duty_FR`, and it documents how the alternative diagnostic differs (`sqrt(duty)` scaling, omitting `gamma_VdB`). This is highly relevant for the derivation appendix: it’s exactly the kind of “parameter registry -> substitution chain” that needs explicit provenance and notation.

The visualization/scalar-field generator `warp_fields_npz.py` computes **GR-style derived scalars** used by the Hull3D analysis visualization, including `theta_gr`, `rho_gr`, `shear_gr`, and `vorticity_gr`, and documents that this mirrors the GLSL math in `AlcubierrePanel.tsx`. It also shows a concrete reduced-order ADM-style computation: compute `df/dr`, directional derivatives, define a simplified extrinsic curvature `K_ij`, and compute a density-like scalar via `(K^2 - K_ij K^ij)/(16 pi)`. A derivation-first prompt can require reproducing these chains symbolically and numerically (where parameters exist), with explicit mapping to repo variables.

The `warp-metric-adapter.ts` module is effectively a **formal interface layer** describing chart labels, lapse/shift/spatial metric diagonal parameters, and it includes explicit diagnostic computations of divergence and curl (with an optional conformal correction for Van den Broeck-style `gamma_ij = B(r)^2 delta_ij`, noting the `+3 beta^k d_k ln B` contribution to divergence). This is directly on-target for “physicists who want the equation chain”: it forces you to state chart assumptions, which derivatives are taken, and what’s being approximated.

For QI/QEI, the repo contains a dedicated **Fewster-Eveson worldline QEI primer** defining the inequality’s scaling form, documenting sampler admissibility constraints (smooth/even/nonnegative/normalized), listing supported sampler families, and explicitly requiring fail-closed checks (`normalize_ok`, `smoothness_ok`, `scaling_ok`). This aligns with the primary literature it cites: Ford & Roman (1995) and Fewster & Eveson (1998) provide canonical worldline quantum inequality forms and generalizations.

For “equation provenance,” the repo has both an **Equation Trace** and a **Parameter Registry**. The equation trace defines required fields including `source_id`, `equation_trace_id`, equation/statistic definition, substitutions, mapped entry IDs, mapped chain IDs, mapped framework variables, and recompute status with blockers. The parameter registry enforces a strict extraction policy (“only directly readable values; otherwise `UNKNOWN`”), and includes structured mapping fields (`entry_id`, `source_id`, `parameter`, `value`, `unit`, `uncertainty`, `derivation_chain_id`, etc.). These two artifacts together already define the skeleton of the derivation appendix tables requested in your plan.

For GR observable replay, the equation trace includes explicit formulas (e.g., Mercury perihelion advance; Einstein limb deflection; frame dragging residual forms; Shapiro delay expression), with chain IDs `CH-GR-001..004`. The repo also implements these replays as deterministic audit scripts; for example, the Mercury perihelion replay script computes `Delta varpi_orbit = 6 pi GM / [a(1 - e^2)c^2]`, converts to arcsec/century, and enforces the same boundary statement as a non-blocking reference-only replay. These are consistent with standard GR test literature (e.g., Will’s Living Reviews synthesis).

## Prompt design requirements implied by repo structure

A derivation-first Deep Research prompt that is “physics-first” but governance-bounded should be designed to exploit the repo’s existing provenance scaffolding rather than rewriting it.

First, the prompt should **hard-anchor** to the proof index and authoring contract: the proof index defines the canonical precedence chain and names the relevant derivation artifacts (equation trace, parameter registry, QEI primer, GR replay scripts), while the authoring contract enforces explicit tier separation and `UNKNOWN` handling.

Second, the prompt should explicitly require **three derivation categories** - repo-established, literature-consistent contextual, unresolved/blocked - and forbid external literature from “fixing” canonical repo gaps. This is consistent with the v1 deep-research prompt precedence rule and the parameter-registry extraction policy.

Third, the prompt should “force” equation-level reconstruction for the specific chains the repo already tracks:

- ADM/3+1 warp-family metric forms in “shift-only” style and chart policy (Alcubierre/Natario/VdB mappings).
- Derived scalars used in NHM2 analysis (`theta_gr`, `rho_gr`, shear, vorticity) and their relation to extrinsic curvature proxies.
- QI/QEI guardrails with sampler admissibility requirements and fail-closed checks, mapped to the repo’s explicit governance booleans.
- GR observable replay equations (Mercury, lensing, frame dragging, Shapiro delay) mapped to `CH-GR-*` chains and to the equation trace / parameter registry.

Fourth, because the repo already defines a **derivation-chain contract** for multiple “evidence lanes” (timing, nanogap, q-spoiling, sign control, SEM/ellipsometry, QEI, GR observables), the prompt can require “lane-by-lane” derivation mapping in a uniform schema. This aligns with your request for evidence-lane equation mappings that are provenance-aware and audit-friendly.

## Proposed new prompt artifact content and optional latest alias

Below is a concrete, repo-aligned **new prompt document** that implements your “NHM2 derivation-first” requirements while preserving established governance boundaries, provenance discipline, and fail-closed behavior.

```markdown
# Warp Paper Deep-Research Derivation Prompt v2 (NHM2, derivation-first)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Generate a **physics-first** Needle Hull Mark 2 (NHM2) manuscript package for **physicists and mathematically literate reviewers**, prioritizing:
- explicit metric notation,
- equation-by-equation derivations,
- substitutions with units,
- and **auditable provenance** (`source_id` / `equation_trace_id` / `entry_id` mappings).

This is a **reduced-order, falsifiable, non-feasibility** manuscript. It must not escalate to real-world warp feasibility.

## Audience and tone (locked)
- Audience: physicists, GR/QFTCS-savvy researchers, and mathematical auditors.
- Tone: physics-first, notation-explicit, literature-anchored, derivation-heavy.
- Output expectation: a readable main paper **plus** a dense derivation appendix.

## Deliverables requested from Deep Research (primary)
You must produce:
1) **Main paper**: scientific exposition of the NHM2 reduced-order full-solve + gate framework.
2) **Derivation appendix**: equation-by-equation reconstruction of:
   - the metric and ADM/3+1 quantities actually used in the framework,
   - GR observable parity replay equations,
   - QI/QEI guardrail mapping and sampler admissibility,
   - evidence-lane derivation mappings via the equation trace + parameter registry.

## Repository accessibility rule (must obey; fail closed)
Use **repo-committed artifacts only**.
- Do not hard-require ignored runtime files under `/artifacts/` unless they are committed and readable in the current snapshot.
- Treat `/artifacts/` JSON as **optional overlays** unless committed.
- If required committed inputs are missing/unreadable: return a **blocked** output and stop (see Fail-Closed Rules).

## Canonical precedence and conflict rule (locked)
When sources conflict, resolve in this order:
1. NHM2 proof anchor index (top-level path map)
2. canonical report chain (execution report / decision ledger / governance matrix)
3. canonical parity and readiness suites
4. repo equation provenance artifacts (equation trace, parameter registry, chain contracts)
5. external comparison overlays
6. external literature (only for context; never overrides canonical repo state)

**External literature must never override canonical repo state.**
If conflict exists: set `conflict=true`, explain, and keep canonical interpretation authoritative.

## REQUIRED local inputs (must read; fail closed if missing)
Primary anchors:
- `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
- `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md`
- `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md`

Governance/control layer (must read):
- `docs/audits/research/warp-paper-authoring-contract-2026-03-02.md`
- `docs/audits/research/warp-needle-hull-mark2-conceptual-guide-latest.md`
- `docs/audits/research/warp-needle-hull-mark2-reduced-order-full-solve-gates-and-evidence-governance-manuscript-latest.md`

Derivation and notation anchors (must read when present in repo snapshot):
- `docs/audits/research/warp-qei-worldline-primer-2026-03-04.md`
- `docs/specs/casimir-tile-equation-provenance-contract-v1.md`
- `docs/alcubierre-alignment.md`
- `docs/theta-semantics.md`
- GR replay scripts and snapshots as referenced by the proof index (CH-GR-001..004)

## Source scope rule (locked)
Allowed sources:
- Repo artifacts (committed).
- The repo’s **cited primary/standard external sources only**, as enumerated in the repo citation pack.
Disallowed:
- New external sources not in the repo citation pack (unless explicitly requested by the user AND labeled as non-admissible context).

## Derivation category separation (must be explicit)
You must separate all derivation content into these buckets, clearly labeled:
- **Repo-established derivation**: explicitly present in repo artifacts/code/docs.
- **Literature-consistent contextual derivation**: consistent with cited primary sources but not fully established in repo artifacts.
- **Unresolved/blocked derivation**: required step depends on missing artifacts, missing numeric rows, or blocked equation traces.

Any missing numeric value, blocked trace, or inaccessible detail must be written exactly as `UNKNOWN` (do not infer).

## Math content requirements (must include)
You must reconstruct equation chains already present in repo artifacts, as equations (not prose-only).

### Metric / ADM / 3+1 notation used in framework
Require explicit notation blocks:
- metric signature and conventions,
- line element `ds^2`,
- lapse `alpha`, shift `beta^i`, spatial metric `gamma_ij`,
- coordinate chart label and mapping notes (lab vs comoving vs spherical comoving),
- variable definitions and units.

Must reconstruct (with provenance):
- Alcubierre shift-only metric and related derived quantities.
- Natario metric form and zero-expansion control condition.
- Van den Broeck conformal spatial metric `gamma_ij = B(r)^2 delta_ij` and any conformal correction terms used in repo diagnostics.
- `theta_GR`, `rho_GR`, and related metric-derived scalars used in repo visualization/diagnostics (expansion/divergence, density proxy, shear proxy, vorticity proxy), including whether quantities are exact, reduced-order approximations, or proxies.

### Canonical theta semantics and substitutions
Must include:
- canonical theta scaling equation used by the engine (and its variable mapping),
- Natario diagnostic theta definition and how it differs,
- explicit mapping to repo variable/path identifiers for each.

### QI/QEI guardrail derivations and mapping
Must include:
- Ford-Roman style inequality form(s) used by the repo,
- Fewster-Eveson style generalization conditions,
- sampler families (Lorentzian, Gaussian, smooth bump) and normalization conventions,
- explicit mapping to repo governance fields:
  - `normalize_ok`, `smoothness_ok`, `scaling_ok`,
  - `samplingKernelIdentity`, `samplingKernelNormalization`,
  - `KDerivation`, `KUnits`, `integrationErrorEstimate`,
  - `qei_worldline_applicability`.
- Applicability caveats must be explicit (flat-space vs curved/bounded; timelike worldline vs spatial averaging).
- Any step requiring missing sampler constants or missing sweep artifacts must be labeled `UNKNOWN` and moved to the blocker register.

### GR observable replay equations
Must include the full replay equations (symbolic, plus substitutions where repo provides numbers):
- Mercury perihelion precession
- Lensing deflection
- Frame dragging
- Shapiro delay

Must map each to:
- `CH-GR-00*` derivation chain id,
- `source_id` + `equation_trace_id`,
- parameter registry `entry_id` rows used for substitutions.

These observable replays are **reference-only** and must be stated as non-blocking for canonical warp adjudication.

### Evidence-lane derivation equations and mappings
Must include evidence-lane derivation mapping tables driven by:
- `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md`
- `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md`
- derivation chain definitions in `docs/specs/casimir-tile-equation-provenance-contract-v1.md`

At minimum include mapping sections/tables for:
- timing (`CH-T-001`)
- nanogap (`CH-NG-001`)
- q-spoiling (`CH-Q-001`)
- Casimir sign-control (`CH-CS-001`)
- SEM + ellipsometry (`CH-SE-001`)
- worldline QEI (`CH-QEI-001`)
- GR observables (`CH-GR-001..004`)
- any additional lanes referenced by the proof index

## Required notation blocks (must appear repeatedly)
For each major equation chain, include a compact “Notation + Units + Mappings” block:
- symbol -> definition
- units (SI / geometric / natural units; be explicit)
- substitution values (with uncertainties when available)
- “mapped to repo variable/path” notes

## Required derivation tables (must include)
You must include derivation tables that link:
- `source_id`
- `equation_trace_id`
- equation (symbolic)
- substituted numeric values (or `UNKNOWN`)
- mapped `entry_id` values from the parameter registry
- mapped framework variables / paths
- recompute status (`pass|partial|blocked`)
- blocker reason (if not pass)

Minimum required table schema (one table per major chain, plus a global summary table):
| source_id | equation_trace_id | equation | substitutions (with units) | mapped_entry_ids | mapped_framework_variables | recompute_status | blocker_reason |

## Output structure (must follow exactly)
Produce the manuscript with the following top-level sections in this order:

1. Boundary statement verbatim (exactly as provided above; no edits)
2. Executive scientific abstract
3. Theory lineage in mathematical form
4. NHM2 reduced-order full-solve formulation
5. Canonical gate interpretation
6. GR observable replay equations
7. QI/QEI and stress-energy guardrail derivations
8. Evidence-lane derivation mappings
9. Derivation appendix (densest section; equation-by-equation)
10. Claim-discipline / non-feasibility section
11. Explicit blocker register

## Derivation appendix requirements (densest section)
- Must include symbolic equations plus substituted numeric examples **when repo data exists**.
- Every equation must have explicit provenance:
  - repo path(s) AND/OR `source_id` + `equation_trace_id` and mapped registry `entry_id`s.
- Distinguish:
  - exact derivation
  - reduced-order approximation
  - proxy / staged quantity

## Claim-discipline and non-feasibility rules (locked)
- Do not claim physical feasibility, viability, or realizability.
- Preserve claim tiers from the authoring contract; do not collapse them.
- External literature is contextual only; it cannot override canonical repo adjudication.
- Missing evidence/value -> `UNKNOWN` (no inference).

## Fail-closed rules (must obey)
If any REQUIRED local input is missing/unreadable:
- return:
  - `blocked=true`
  - list missing paths
  - `stop_reason=Fail-closed`
- do not draft the manuscript.

If only optional overlays are missing:
- continue, but mark overlay-dependent quantities `UNKNOWN`.

## Self-check scenarios (must run before finalizing)
1) Derivation completeness: equations + provenance tables present (not prose-only).
2) Boundary compliance: boundary statement is verbatim and feasibility language is absent.
3) Source discipline: normative math claims cite repo artifacts and/or citation-pack primary/standard sources.
4) Unknown handling: missing numeric rows/blocked traces appear as `UNKNOWN`.
5) Equation provenance: uses `source_id` / `equation_trace_id` and registry `entry_id` mappings, not paraphrase-only.
6) Audience fit: main paper readable to physicists; appendix dense enough to audit equation chains.
```

### Optional latest alias (only if you want a “latest” handle for this derivation prompt)

The repo uses “latest” aliases widely for **indexes/guides** (e.g., proof anchor index, conceptual guide), but I did not find an existing `*-latest.md` alias pattern specifically for “deep-research prompt” docs in the same folder set as `warp-paper-deep-research-prompt-v1.md`. If you still want a stable alias for “the latest derivation prompt,” add a derivation-specific alias (not overriding the general one):

Suggested path:
- `docs/audits/research/warp-paper-deep-research-derivation-prompt-latest.md`

Suggested minimal content:

```markdown
# Warp Paper Deep-Research Derivation Prompt (Latest)

This is the “latest” alias for the derivation-first NHM2 Deep Research prompt.

Current target:
- `docs/audits/research/warp-paper-deep-research-derivation-prompt-v2.md`

Boundary statement (must remain verbatim):
`This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.`
```

## Compliance checklist mapped to your stated test cases

This section translates your six test scenarios into concrete “acceptance criteria” that the **new prompt text itself** enforces, grounded in existing repo governance structures and provenance assets.

Derivation completeness is enforced by requiring symbolic equations and provenance tables per chain (including `source_id`, `equation_trace_id`, and registry `entry_id` mappings). This matches the repo’s existing equation trace required fields and is aligned with the per-paper trace structure already defined.

Canonical boundary compliance is enforced by repeating the boundary statement verbatim as Section 1 and reiterating non-feasibility constraints in the claim-discipline section, consistent with the authoring contract and existing prompt v1 constraints.

Source discipline is enforced by restricting sources to repo artifacts plus the repo’s citation-pack sources, and by explicitly forbidding external literature from overriding canonical repo state - consistent with the v1 precedence rule and the proof index’s canonical authority chain.

Unknown handling (`UNKNOWN` not inferred) is explicitly required and is compatible with the parameter registry’s extraction policy (“only directly extractable values; otherwise `UNKNOWN`”).

Equation provenance requirements are addressed by forcing `source_id` / `equation_trace_id` and chain IDs like `CH-GR-*` / `CH-QEI-001`, which already exist in the equation trace and the derivation-chain contract.

Audience fit is addressed structurally: the prompt produces a readable main paper but makes the derivation appendix explicitly the densest section, and it requires notation blocks and substitutions throughout - matching the repo’s existing “equations-first” anchor docs like `alcubierre-alignment.md` and the QEI primer.

As external anchors (for the “literature-anchored” requirement), the prompt’s QI/QEI and GR-observable sections align with primary sources such as Ford & Roman (1995) and Fewster & Eveson (1998) for worldline inequalities, and Will (2014) for the modern synthesis of classic GR tests (including perihelion advance, lensing, Shapiro delay, and frame dragging).
