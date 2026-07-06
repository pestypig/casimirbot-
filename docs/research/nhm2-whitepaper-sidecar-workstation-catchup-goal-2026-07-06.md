# NHM2 Whitepaper Sidecar Workstation Catch-Up Goal

## Goal

Bring the maintained NHM2 May 2 whitepaper equation-action sidecars back into
sync with the current paper text, and make the newer sidecar-backed research
surfaces first-class workstation affordances for agent reasoning, calculator
replay where allowed, Theory Badge Graph orientation, and bounded Helix Ask
context.

This is a wiring and evidence-surface task. It must not promote NHM2 physical
viability, transport, route ETA, propulsion, material-source proof, speed
authority, or external validation.

## Cited Context

- Canonical paper: `docs/research/nhm2-current-status-whitepaper-2026-05-02.md`.
  `docs/research/README.md` names this as the current maintained NHM2
  whitepaper and says its calculator/equation sidecars must stay together.
- Existing sidecars:
  `docs/research/nhm2-current-status-whitepaper-2026-05-02.equation-actions.json`
  and
  `docs/research/nhm2-current-status-whitepaper-2026-05-02.equation-actions.source.json`.
- Sidecar generator:
  `scripts/generate-doc-equation-actions.ts` builds the generated JSON from the
  markdown plus source sidecar, and `scripts/doc-equation-action-generator.ts`
  fails when a markdown marker has no source entry.
- Current failing check:
  `npm run docs:equation-actions:check` fails with
  `Equation marker nhm2-frozen-447-material-evidence-gate has no source entry`.
  The missing marker appears in the paper under
  `### 9.17 Frozen 447-layer material-evidence gate`.
- Workstation bridge:
  `client/src/lib/docs/docEquationActions.ts` imports
  `docs/**/*.equation-actions.json`, opens workstation panels, dispatches
  Scientific Calculator math picks, applies Theory Badge Graph orientation, and
  emits `doc_equation_context/v1` artifacts for agent-facing explanation.
- Workstation context surfaces:
  `client/src/components/workstation/LiveAnswerEnvironmentPanel.tsx` reads the
  latest doc-equation context and can ask Helix Ask to explain it.
- Existing tests:
  `client/src/lib/docs/__tests__/docEquationActions.spec.ts`,
  `client/src/lib/docs/__tests__/docEquationContextEvents.spec.ts`, and
  `client/src/components/__tests__/doc-viewer-taxonomy-ui.spec.tsx` already
  cover the basic bridge.

## Current Gap

The bridge is present, but the NHM2 sidecar bundle is stale relative to the
paper. Existing anchored equations can drive the workstation, but newer paper
additions are either not registered in the source sidecar or are present only as
prose/table rows. That prevents a full agent-reasoning demo of the latest
whitepaper surfaces.

At minimum, the sidecar source is missing:

- `nhm2-frozen-447-material-evidence-gate`

The newer paper sections that should be considered for first-class action
coverage include:

- `nhm2_profile_campaign_frontier/v1`
- `nhm2_candidate_metric_profile_spec/v1`
- `nhm2_campaign_profile_run_manifest/v1`
- `nhm2_time_dependent_source_campaign/v1`
- `ER_EPR_STAGE1` / `ER_EPR_TINY_SYK_EXACT_DIAG_V1` quantum-spacetime sidecar
- the 0p7000 diagnostic campaign frontier discussion

## Implementation Plan

1. Add a source-sidecar entry for
   `nhm2-frozen-447-material-evidence-gate`.
   It should be an `artifact_backed_theory_run` or bounded runtime/evidence
   orientation, not scalar calculator replay, unless a legitimate scalar payload
   already exists. Its claim boundary must say the coupon/material gate is an
   evidence-admission and compatibility gate, not material validation or source
   proof.

2. Regenerate
   `docs/research/nhm2-current-status-whitepaper-2026-05-02.equation-actions.json`
   with `npm run docs:equation-actions:generate`, then require
   `npm run docs:equation-actions:check` to pass.

3. Audit the newer June/current frontier rows in the whitepaper and decide which
   should get explicit `helix-doc-equation-action/v1` markers. Prefer markers
   where the workstation can offer a useful action:
   Theory Badge Graph orientation, runtime artifact-backed evidence, or scalar
   calculator replay for narrow clocking quantities.

4. Add source-sidecar entries for any newly marked frontier rows. For each
   entry, set:
   - stable `equationId`
   - precise label
   - useful aliases, including artifact schema ids where applicable
   - `openPanels`
   - `atlasLensId` / `atlasGroupId` when the Warp / GR / NHM2 lens is relevant
   - `claimBoundaryNotes`
   - `claimBoundaryNote` on each action

5. Keep calculator replay restricted to scalar rows. Tensor, observer, QEI,
   source authority, campaign frontier, run-manifest, material receipt, and
   quantum-spacetime solver rows should open runtime/evidence or graph
   orientation surfaces unless a dedicated scalar payload is already present and
   claim-bounded.

6. Add regression coverage:
   - a sidecar freshness test or script assertion that
     `npm run docs:equation-actions:check` passes
   - a doc-equation action test for
     `nhm2-frozen-447-material-evidence-gate`
   - at least one test for a newer June/current frontier action emitting
     `doc_equation_context/v1` with the correct scope and prohibited-claim
     boundary

7. Run the narrow verification set:
   - `npm run docs:equation-actions:check`
   - `npx vitest run client/src/lib/docs/__tests__/docEquationActions.spec.ts client/src/lib/docs/__tests__/docEquationContextEvents.spec.ts --pool=forks`
   - `npx vitest run client/src/components/__tests__/doc-viewer-taxonomy-ui.spec.tsx --pool=forks`
   - `npm run helix:ask:discipline:quick` if Helix Ask context, live answer,
     workstation action, or terminal-authority sensitive files are touched

## Acceptance Criteria

- The generated equation-action sidecar is current with the markdown.
- No markdown equation-action marker lacks a source-sidecar entry.
- The frozen 447-layer material-evidence gate is agent-visible from the
  workstation with bounded claim language.
- New June/current frontier surfaces selected for action coverage are
  first-class workstation affordances, not passive prose only.
- Calculator replay is not offered for non-scalar proof, tensor, receipt,
  dossier, or campaign-governance rows.
- Tests above pass.

## Verification Boundary

This task updates document/workstation sidecar wiring. Casimir verification is
not required unless the implementation changes warp/GR physics, adapter
contracts, constraint packs, training-trace export/capture, certificate
semantics, CI/release verification, or code that claims physical viability,
proof maturity, or certified gate status.
