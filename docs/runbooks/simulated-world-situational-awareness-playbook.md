# Simulated-World Situational Awareness Playbook

Use this playbook when you want to extract operational decision logic from games/simulations and convert it into production-ready Helix Ask behavior contracts.

## Purpose

Turn narrative examples into deterministic, testable utility:

1. `Signal Map`
2. `Decision Contract`
3. `Action Contract`
4. `Trust Rules`
5. `Failure Model`
6. `Operator UX`
7. `Replayability`
8. `Acceptance Gates`
9. `Evidence Tags`
10. `Transfer Step`

## Inputs

- Canon/simulation source set (missions, scripts, system docs, gameplay traces).
- Target product context (for this repo: Helix Ask + mission-overwatch + voice callouts).
- Current policy constraints (`AGENTS.md`, mission-control docs, certainty parity rules).

## Outputs

- `docs/audits/research/<topic>-situational-awareness-method-<date>.md`
- `reports/<topic>-scenario-pack-<date>.md`
- `reports/<topic>-decision-matrix-<date>.json`
- Optional: `docs/architecture/<topic>-behavior-contract.v1.md`

## Evidence Tagging Rules

Every claim must be tagged:

- `verified`: direct source support.
- `inference`: reasoned from verified sources.
- `missing_evidence`: no direct support or inaccessible source.

When using lore-heavy material, separate:

- `hard canon`
- `secondary summary`
- `headcanon/speculation`

## Workflow

### 1) Signal Map

Extract what the agent can observe.

- Inputs: sensors, events, actor state, environment deltas.
- Required fields: `signal_id`, `source`, `latency_class`, `confidence`.
- Deliverable: table of observable signals and blind spots.

### 2) Decision Contract

Define deterministic conversion from signal to judgment.

- Inputs: normalized signals.
- Outputs: `classification`, `certainty_class`, `why_it_matters`.
- Rules: explicit thresholds, precedence, tie-break behavior.

### 3) Action Contract

Define output channels and payload shapes.

- Channels: text, voice, board/action.
- Required fields: `what_changed`, `why_it_matters`, `next_action`, `evidence_anchor`.
- Include suppression outcomes with stable `reason` enums.

### 4) Trust Rules

Enforce operator trust invariants.

- Voice certainty never exceeds text certainty.
- Repo-attributed claims require evidence anchors or deterministic suppression.
- No covert monitoring assumptions.
- Deterministic failure reasons only.

### 5) Failure Model

Model failure classes before implementation.

- `missing_data`
- `contradiction`
- `stale_context`
- `rate_limited`
- `budget_exceeded`
- `context_ineligible`
- `contract_violation`

Define expected fallback behavior per class.

### 6) Operator UX

Translate logic into an intuitive control surface.

- Show objective + top unresolved gaps first.
- Show speak/suppress status and reason.
- Keep callouts low-noise and event-driven.
- Prioritize actionability over narration.

### 7) Replayability

Require reproducibility artifacts for each scenario.

- `mission_id`, `event_id`, `trace_id`
- deterministic timestamps/policy clock
- suppression reason
- closure/debrief linkage

### 8) Acceptance Gates

Define measurable pass/fail gates before build.

- determinism replay checks
- certainty parity checks
- suppression explainability checks
- noise budget checks
- latency/SLO checks

### 9) Scenario Pack

Build a test set that can drive implementation.

- Minimum 10 scenarios.
- Include: context, expected output transcript, expected suppression behavior, expected state transition.
- Include adversarial cases (missing evidence, contradictory inputs, overload).

### 10) Transfer Step

Map extracted behavior into product modules.

- Contract updates (`shared/*` schemas/contracts).
- Runtime routes/services.
- UI projection and controls.
- Tests and replay harness.

## Recommended Scoring Matrix

Use 1-5 scoring for candidate methods:

- `fit_to_ops_goal`
- `determinism`
- `operator_trust`
- `integration_cost`
- `ops_maturity`

Include weighted totals and explicit GO/NO-GO conditions.

## Prompt Template (Deep Research)

```md
Read project policy docs first. Produce a decision-grade research brief that converts a simulated-world utility pattern into a deterministic product behavior contract.

Requirements:
1) Tag every claim as verified/inference/missing_evidence.
2) Build the 10-step framework (signal -> transfer).
3) Output: behavior matrix, failure model, UX contract, acceptance gates, scenario pack, and 30/60/90 roadmap.
4) Include contradictions/unknowns and kill criteria.
5) Provide file-ready deliverables:
   - docs/audits/research/<topic>-situational-awareness-method-<date>.md
   - reports/<topic>-scenario-pack-<date>.md
   - reports/<topic>-decision-matrix-<date>.json
```

## Prompt Template (Build Batch)

```md
Implement objective-first situational-awareness from the approved research contract.

Constraints:
- Keep existing API contracts additive.
- Preserve deterministic suppression reasons and certainty parity.
- Add or extend replay-safe tests and scenario fixtures.
- Emit transcript and debug reports for the same scenario run.

Deliver:
1) File-by-file patch summary.
2) Tests run + pass/fail.
3) Casimir verify PASS details.
4) Remaining risks and next batch.
```

## Minimum Test Commands

```bash
npx vitest run tests/generated/helix-dottie-situational.generated.spec.ts tests/helix-dottie-replay-integration.spec.ts tests/voice.routes.spec.ts tests/mission-board.routes.spec.ts
npm run helix:dottie:situational:report
```

If policy or architecture docs changed:

```bash
npm run validate:helix-dottie-docs-schema
```

## Release Checklist

1. Contract and schema updates are additive and versioned.
2. Scenario pack contains pass + fail + adversarial cases.
3. Replay outputs are deterministic on rerun.
4. Suppression reasons are visible and stable.
5. Casimir verify returns PASS with integrity OK.

