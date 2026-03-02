# Warp Paper Deep-Research Prompt v1 (Commit-Pinned)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Generate a literature-backed scientific manuscript package from the current repo state while preserving strict claim-tier governance and fail-closed evidence handling.

## Commit Pin
- `36c4bfecf3235c68cd8caa9a6262b69beaa2cb1e`

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

## Required Local Inputs (must be read first)
- `docs/audits/research/warp-paper-authoring-contract-2026-03-02.md`
- `artifacts/research/full-solve/warp-evidence-snapshot-2026-03-02.json`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`
- `artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json`
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
  - non-goals section

### Output B: Strong-Claim Upgrade Spec
- Rigorous closure roadmap
- Include:
  - exact acceptance criteria by closure spec
  - deterministic falsifiers per spec
  - evidence required to move from reduced-order closure to external scientific claim strength
  - minimal experimental/validation program
  - explicit blockers and how to clear them

## Fail-Closed Rules
If any required local file is missing/unreadable:
- return:
  - `blocked=true`
  - `commit_pin=<hash>`
  - list of missing paths
  - `stop_reason=Fail-closed`
- do not draft A/B content.
