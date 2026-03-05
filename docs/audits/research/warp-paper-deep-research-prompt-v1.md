# Warp Paper Deep-Research Prompt v1 (Commit-Pinned)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Generate a literature-backed scientific manuscript package from the current repo state while preserving strict claim-tier governance and fail-closed evidence handling.

## Commit Pin
- `e240431948598a964a9042ed929a076f609b90d6`

## Repository Accessibility Rule (important)
Use only files that are committed and readable at the commit pin.

- Do not hard-require ignored runtime files under `/artifacts/` unless they are tracked in git at that commit.
- Treat local runtime traces and generated JSON under `/artifacts/` as optional overlays unless the commit explicitly contains them.
- If optional overlays are missing, continue using the commit-tracked evidence pack and markdown audits.

## Evidence Precedence Rule (locked)
When sources conflict, resolve in this order:
1. `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
2. `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`
3. `artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json`
4. commit-tracked evidence summaries (`warp-evidence-pack`, `warp-evidence-snapshot` markdown)
5. external literature overlays

If an external recommendation conflicts with items 1-3, set `conflict=true` and keep canonical interpretation authoritative.

## Mandatory Constraints
1. Keep the boundary statement verbatim in the output.
2. Keep claim tiers explicit and non-collapsed:
   - `canonical-authoritative`
   - `promoted-candidate`
   - `exploratory`
3. Do not claim full-system physical feasibility from this campaign alone.
4. Do explicitly state the scientific value delivered now:
   - reduced-order admissibility under declared constraints
   - reproducible evidence and certification traces
   - deterministic falsifiers and upgrade path to stronger claims
5. Do not override canonical decisions with candidate or exploratory lanes.
6. If a required artifact is missing/unreadable, fail closed and report blocked status.
7. PDF-safe output formatting only:
   - no scrolling graphs
   - no interactive charts/widgets
   - all figures/tables must be static and readable when exported to PDF
   - prefer compact, page-fit tables over wide/scroll-only layouts

## Manuscript Source Policy (required)

Allowed source classes:
- `primary`: peer-reviewed primary research papers
- `standard`: official standards bodies and specification documents
- `preprint`: non-peer-reviewed preprints (allowed, exploratory confidence only)
- `secondary`: reviews/news/summaries (supporting context only)

Source hierarchy:
1. primary + standard first
2. preprints allowed with reduced confidence label
3. secondary cannot be sole basis for normative claims

Required citation metadata per cited claim:
- DOI or canonical URL
- publication/update date
- `source_class` (`primary|standard|preprint|secondary`)
- `confidence_tier` (`high|medium|low`)

Primary-source fallback rule:
- If a claim is supported by a secondary source, include at least one primary or official standards source for the same normative point, or mark the claim `UNKNOWN`.

Citation admissibility checks:
- Every normative recommendation must cite at least one `primary` or `standard` source.
- Recommendations supported only by `preprint` must be tagged exploratory.
- Recommendations supported only by `secondary` are non-compliant.

## Required Local Inputs (core adjudication, commit-tracked)
- `docs/audits/research/warp-paper-authoring-contract-2026-03-02.md`
- `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`
- `artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json`
- `docs/audits/research/warp-g4-operator-mapping-audit-2026-03-02.md`
- `docs/audits/research/warp-g4-kernel-provenance-audit-2026-03-02.md`
- `docs/audits/research/warp-g4-curvature-applicability-audit-2026-03-02.md`
- `docs/audits/research/warp-g4-uncertainty-audit-2026-03-02.md`
- `docs/audits/research/warp-g4-literature-parity-replay-2026-03-02.md`

## Experimental Data Staging Inputs (reference-only, non-blocking)
- `docs/audits/research/warp-qei-worldline-primer-2026-03-04.md`
- `docs/audits/research/warp-primary-standards-citation-pack-2026-03-04.md`
- `docs/specs/casimir-tile-spec-v1.md`
- `docs/specs/casimir-tile-manufacturing-delta-v1.md`
- `docs/specs/casimir-tile-test-vehicle-plan-v1.md`
- `docs/specs/casimir-tile-rfq-pack-v1.md`
- `docs/specs/casimir-tile-q-spoiling-test-protocol-v1.md`
- `docs/specs/casimir-tile-timing-precision-test-protocol-v1.md`
- `docs/specs/casimir-tile-nanogap-uncertainty-test-protocol-v1.md`
- `docs/specs/casimir-tile-nanogap-uncertainty-budget-template-v1.md`
- `docs/specs/casimir-tile-spec-bookkeeping-v1.md`
- `docs/specs/casimir-tile-experimental-data-staging-ledger-v1.md`
- `docs/specs/casimir-tile-promotion-preregistration-v1.md`

Staging rule:
- Missing staging inputs must be reported as `experimental_missing`, but must not trigger fail-closed for canonical warp adjudication outputs.

## Optional Local Overlays (use when present)
- `artifacts/research/full-solve/warp-evidence-snapshot-2026-03-02.json`
- `artifacts/research/full-solve/g4-promotion-bundle-2026-03-01.json`
- `artifacts/research/full-solve/g4-operator-mapping-audit-2026-03-02.json`
- `artifacts/research/full-solve/g4-kernel-provenance-audit-2026-03-02.json`
- `artifacts/research/full-solve/g4-curvature-applicability-audit-2026-03-02.json`
- `artifacts/research/full-solve/g4-uncertainty-audit-2026-03-02.json`
- `artifacts/research/full-solve/g4-literature-parity-replay-2026-03-02.json`
- `artifacts/training-trace.jsonl`
- `artifacts/training-trace-export.jsonl`

## Required External Literature Behavior
1. Use primary sources for QI/QEI, renormalized stress-energy semantics, and uncertainty/credibility standards.
2. Cite each external claim with a concrete source.
3. Separate "repo-established" from "literature-consistent but not repo-validated."
4. Include at least:
   - QI/QEI foundational papers (Ford/Roman, Fewster lineage)
   - curved-spacetime renormalization semantics (Wald/Birrell-Davies lineage)
   - VVUQ/uncertainty standards (NASA/ASME/GUM lineage)
5. For manufacturing claims, anchor to the `docs/specs/*` package first, then external standards.
6. For FordRomanQI/QEI parity claims, report sampler admissibility evidence (`normalize_ok`, `smoothness_ok`, `scaling_ok`) and fail closed when any check is missing.

## Output Requirements
Generate two outputs.

### Output A: Defensible Now
- Methods/results style
- Only claims supported by local artifacts
- Include:
  - commit pin
  - canonical decision and gate counts
  - promoted candidate status
  - certification fields (verdict/hash/integrity)
  - required materials-bounds table with explicit UNKNOWN where needed
  - falsifier matrix
  - what this research improves now
  - what remains unresolved
  - non-goals section

### Output B: Strong-Claim Upgrade Spec
- Rigorous closure roadmap
- Include:
  - exact acceptance criteria by closure spec
  - deterministic falsifiers per spec
  - evidence required to move from reduced-order closure to external scientific claim strength
  - minimal experimental/validation program
  - explicit blockers and how to clear them
  - VVUQ/standards alignment matrix mapped to H-N
  - measurement-congruence and fail-safe synthesis block for any sign-control Casimir claims

## Required Output Blocks (contract)
The response must include all blocks below in this order:
1. Actionable alignment steps (max 7)
2. Unresolved blockers by category
3. Concrete evidence upgrades
4. Source-to-claim matrix
5. Staleness/conflict audit
6. Measurement congruence and fail-safe synthesis (required when sign-control claims are present)

## Output Schema Additions (required)
Include explicit fields:
- `conflict` (bool)
- `stale_pin` (bool)
- `source_class` (`primary|standard|preprint|secondary`)
- `confidence_tier` (`high|medium|low`)

## Commit Freshness Check (required)
Deep-research output must:
1. Echo the requested commit pin.
2. Resolve repository `HEAD` commit.
3. Compare the two values.
4. If mismatch, set `stale_pin=true` and include a staleness note.

## Prompt Compliance Scenarios (self-check)
1. Prompt contract test:
   - missing primary citations for normative claims -> non-compliant.
2. Stale pin test:
   - requested pin != HEAD -> `stale_pin=true`.
3. Conflict precedence test:
   - evidence summary contradicts canonical artifacts -> canonical wins; `conflict=true`.
4. Exploratory UQ test:
   - PCS/QMU cited without implementation -> keep exploratory, not hard-pass.
5. PDF safety test:
   - no interactive or scrolling graph dependency.

## Fail-Closed Rules
If any required core-adjudication commit-tracked local file is missing/unreadable:
- return:
  - `blocked=true`
  - `commit_pin=<hash>`
  - list of missing paths
  - `stop_reason=Fail-closed`
- do not draft A/B content.

If only experimental staging inputs are missing/unreadable:
- return:
  - `experimental_missing=true`
  - list of missing staging paths
- continue with A/B using core-adjudication inputs and mark staging-dependent claims as `UNKNOWN`.
