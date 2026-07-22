# Reproducible Full-Solve Study Template

Use this template for a maintained, runnable research study that connects a
whitepaper, Theory Badge Graph context, calculator actions, runtimes, and
evidence artifacts. It distills the parts of the NHM2 full-solve workflow that
generalize without importing NHM2-specific physics assumptions.

## 1. Study identity

- Study id: `<stable-kebab-id>`
- Working title: `<title>`
- Maintained paper: `docs/research/<study-id>.md`
- Machine-readable run config: `configs/research/<study-id>.v1.json`
- Runner: `scripts/research/run-<study-id>.ts`
- Artifact root: `artifacts/research/<study-id>/<run-id>/`
- Current claim tier: `exploratory | reduced-order | diagnostic | certified`
- Maximum claim tier authorized by this study: `<tier>`
- Evidence cutoff: `<YYYY-MM-DD>`

## 2. One-sentence research question

Write one falsifiable question. Avoid combining a measured observable, an
interpretation, and a proposed mechanism into one claim.

## 3. Lane separation

Define each lane before any calculation.

| Lane | Inputs | Outputs | Authority | Must not imply |
|---|---|---|---|---|
| Baseline | established theory and calibrated inputs | reference prediction | reference/model | new mechanism |
| Observation | instrument receipts and uncertainty | measured observable | measurement | causal interpretation |
| Candidate mechanism | explicit model parameters | candidate prediction | model | confirmation |
| Constraint | independent bounds | allowed/excluded region | comparison | positive detection |

For every cross-lane comparison, name the canonical observable, units,
mathematical type, frame, operational definition, response model, validity
domain, and error model. Shared words or matching units do not create an
observable bridge.

## 4. Hypotheses and falsifiers

Register at least:

- `H0`: the established baseline plus known corrections explains the data.
- `H1`: the candidate mechanism adds a defined residual or correlation.
- one nuisance/model-misspecification hypothesis.

For each hypothesis record:

- prediction;
- free parameters and priors or sweep bounds;
- target observable;
- uncertainty model;
- reject or exclusion rule;
- independent evidence needed for promotion.

## 5. Canonical run order

The dependency order is fixed even when stages execute in parallel internally.

1. Freeze question, claims, non-claims, evidence cutoff, and software revision.
2. Lock citations and classify each source as theory, measurement, constraint,
   method, or candidate hypothesis.
3. Bind observables, units, frames, response models, and uncertainty semantics.
4. Validate inputs and provenance before evaluating a model.
5. Run the established baseline and analytic/unit checks.
6. Run apparatus/material/environment corrections.
7. Run the candidate mechanism independently of the observed residual.
8. Run resolution, cutoff, parameter, and nuisance sweeps.
9. Compare predictions with observations through registered bridges only.
10. Apply independent constraints and negative controls.
11. Reproduce from a cold start and hash the concrete outputs.
12. Update the paper's evidence ledger and equation-action sidecars.
13. Promote claims only through a separately declared promotion gate.

Do not optimize a candidate mechanism against a residual before the baseline,
uncertainty, and negative controls are frozen.

## 6. Runtime classes

Classify each stage as one of:

- `instant_scalar`: calculator or analytic reference, target under 1 second;
- `small_diagnostic`: deterministic local run, target under 30 seconds;
- `sweep`: bounded parameter campaign with a request manifest;
- `long_runtime`: queued job with heartbeat, timeout, and output manifest;
- `external_measurement`: read-only receipt ingestion;
- `review_gate`: no compute; evaluates evidence completeness.

Every executable stage must define a fixed command, timeout, output boundary,
expected artifacts, freshness requirement, and failure semantics.

## 7. Required artifacts

At minimum, write:

- normalized input snapshot;
- per-stage output artifacts;
- run receipt with software revision and timestamps;
- SHA-256 output manifest;
- gate ledger preserving `pass`, `fail`, `review`, `not_ready`,
  `not_applicable`, and `unknown` distinctly;
- uncertainty/sensitivity report;
- claim-boundary report;
- dated paper evidence-ledger update.

Process completion is not scientific success. A completed run may legitimately
end with a failed or blocked scientific gate.

## 8. Whitepaper and scientific sidecar

Keep these together:

- `<study-id>.md`
- `<study-id>.equation-actions.source.json`
- `<study-id>.equation-actions.json`

Put `helix-doc-equation-action/v1` markers only on equations or gate rows that
have a useful workstation action. Scalar equations may use calculator payloads.
Tensor, field, runtime, receipt, hypothesis, and evidence-gate rows should open
Theory Badge Graph or artifact context without pretending to be scalar solves.

Generate and check a sidecar with:

```text
npx tsx scripts/generate-doc-equation-actions.ts --doc docs/research/<study-id>.md
npx tsx scripts/generate-doc-equation-actions.ts --doc docs/research/<study-id>.md --check
```

## 9. Theory Badge Graph checklist

- Stable study, model, gate, and claim-boundary badge ids.
- First-principle/law roots and explicit executable relations.
- Literature, repo, config, runtime, and artifact source references.
- Calculator payloads only for genuinely scalar expressions.
- Observable identities and registered bridges for cross-system comparisons.
- A blocked claim-boundary path for every unresolved bridge or missing receipt.
- Locator hints for the paper title, study id, hypotheses, and observables.

## 10. Paper results ledger

| Run id | Revision | Input hash | Stage | Status | Key result | Uncertainty | Artifact | Claim effect |
|---|---|---|---|---|---|---|---|---|
| `<run>` | `<sha>` | `<sha256>` | `<stage>` | `<status>` | `<value>` | `<model>` | `<path>` | `<none/promote/demote>` |

Record contradictions rather than resolving them in prose. Preserve both the
summary status and the authoritative detailed artifact until reconciliation.

## 11. Definition of done

- The question and falsifiers are explicit.
- Observables are identity-bound; missing bridges fail closed.
- The run order is reproducible and artifacts are fresh and hashed.
- Sidecar actions open the correct calculator, graph, and evidence surfaces.
- Sensitivity, negative-control, independent-bound, and cold-start checks are
  recorded.
- The paper distinguishes observed, calculated, inferred, and speculative
  statements.
- The strongest conclusion does not exceed the weakest required evidence lane.

