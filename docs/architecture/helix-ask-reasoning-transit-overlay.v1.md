# Helix Ask Reasoning Transit Overlay Spec (v1)

Status: draft
Spec ID: `helix.ask.reasoning_transit_overlay.v1`

## Purpose

Define a deterministic, replay-safe symbolic transit map for Helix Ask that visualizes epistemic progress from ambiguity to verified usefulness.

The overlay borrows visual language from the Observable Universe Accordion but does not alter NHM2 physical ETA claims.

## Product framing

Reasoning Transit is an epistemic transit map, not a reasoning score.

Interpretation:
1. `Sol` is the starting frame (current objective state).
2. A fixed target star represents objective difficulty horizon.
3. Route nodes represent procedural obligations (subgoals).
4. Symbolic transit time shortens only when evidence, alignment, and proof improve under constraints.

## Lane separation (hard boundary)

Lane A: NHM2 physical map (existing)
1. Source of truth for physical ETA/projection behavior.
2. Contract-backed and fail-closed.
3. No symbolic telemetry may modify physical trip outputs.

Lane B: Reasoning Transit overlay (new)
1. Symbolic-only epistemic visualization.
2. Deterministic from replay-safe Helix Ask telemetry.
3. Supplemental, never source of truth for scientific transport claims.

## Non-goals

1. No literal claim that reasoning changes physical travel time.
2. No gamified score that can override proof/certificate outcomes.
3. No hidden inference signals outside existing replay-safe fields.
4. No victory/arrival visual when proof gate is not satisfied.

## Existing signal sources

Use only replay-safe fields already present in Helix Ask payloads/state:

1. `ConvergenceStripState` from `deriveConvergenceStripState(...)`.
2. Reasoning theater frontier deltas (`reasoning-theater-frontier`).
3. `reply.debug` live events and objective telemetry keys.
4. `reply.proof.verdict`, `reply.proof.certificate.certificateHash`, `reply.proof.certificate.integrityOk`.
5. `traceId` and `intent_id` for deterministic target selection.

## Derived state contract

```ts
type ReasoningTransitStateV1 = {
  version: "reasoning_transit.v1";

  lane: "symbolic_reasoning";
  label: "Symbolic Transit (Reasoning)";

  source: "atlas_exact" | "repo_exact" | "open_world" | "unknown";
  proof: "confirmed" | "reasoned" | "hypothesis" | "unknown" | "fail_closed";
  phase:
    | "observe"
    | "plan"
    | "retrieve"
    | "gate"
    | "synthesize"
    | "verify"
    | "execute"
    | "debrief";

  target: {
    id: string;
    label: string;
    distanceLy: number;
    difficultyTier: 1 | 2 | 3;
    fixedForTrace: true;
    positionM: [number, number, number] | null;
  };

  route: {
    startLabel: "Sol";
    subgoals: Array<{
      id: string;
      label: string;
      status: "pending" | "active" | "complete";
    }>;
    activeNodeIndex: number;
  };

  telemetry: {
    momentum: number;          // 0..1
    ambiguityPressure: number; // 0..1
    battleIndex: number;       // -1..1
    sourceScore: number;       // 0..1
    proofScore: number;        // 0..1
    phaseScore: number;        // 0..1
  };

  progress: {
    routeProgress: number;       // 0..1
    routeConfidence: number;     // 0..1
    epistemicEfficiency: number; // 0..1
    symbolicLyPerYear: number;
    symbolicTransitYears: number;
    humanLifetimeWindow: boolean;
  };

  triangulation: {
    promptFrame: number;    // 0..1
    evidenceFrame: number;  // 0..1
    procedureFrame: number; // 0..1
    proofFrame: number;     // 0..1
  };

  balanceDipole: {
    ambiguityLobe: number; // 0..1
    supportLobe: number;   // 0..1
    balance: number;       // 0..1
    certaintyInflationRisk: boolean;
  };

  gates: {
    arrivalVisualAllowed: boolean;
    failClosed: boolean;
    integrityOk: boolean | null;
  };

  runStatus: "in_progress" | "ready_for_review" | "verified" | "fail_closed";
  caption: string;
};
```

## Deterministic scoring model

### Normalization

```text
clamp01(x) = min(1, max(0, x))
clamp(min,max,x)
```

### Scores

```ts
const sourceScore = {
  atlas_exact: 1.0,
  repo_exact: 0.8,
  open_world: 0.35,
  unknown: 0.2,
}[source];

const proofScore = {
  confirmed: 1.0,
  reasoned: 0.72,
  hypothesis: 0.42,
  unknown: 0.22,
  fail_closed: 0.0,
}[proof];

const phaseScore = {
  observe: 0.15,
  plan: 0.28,
  retrieve: 0.46,
  gate: 0.62,
  synthesize: 0.74,
  verify: 0.86,
  execute: 0.95,
  debrief: 1.0,
}[phase];
```

### Progress and confidence split

```ts
const routeProgress = clamp01(
  0.55 * phaseScore +
  0.30 * momentum +
  0.15 * (1 - ambiguityPressure)
);

const routeConfidence = clamp01(
  0.45 * proofScore +
  0.35 * sourceScore +
  0.20 * (1 - ambiguityPressure)
);

let epistemicEfficiency = clamp01(
  0.55 * routeProgress +
  0.45 * routeConfidence
);

if (proof === "fail_closed") {
  epistemicEfficiency = Math.min(epistemicEfficiency, 0.2);
}

if (proof === "confirmed" && certificateIntegrityOk === true) {
  epistemicEfficiency = Math.max(epistemicEfficiency, 0.85);
}
```

### Symbolic speed and time

```ts
const symbolicLyPerYear = 0.02 + epistemicEfficiency * (2.2 - 0.02);
const symbolicTransitYears = targetDistanceLy / symbolicLyPerYear;
const humanLifetimeWindow = symbolicTransitYears <= 88;
```

## Target selection and determinism

Target selection rule:
1. Choose one target at run start.
2. Keep target fixed for the same trace.
3. Improve efficiency over time; do not move target closer during the same trace.

Deterministic seed key:

```text
seed = hash32(traceId + "|" + intentId + "|" + objectiveLabel + "|tier:" + tier)
```

Difficulty tiers:
1. Tier 1: focused, low ambiguity, grounded objective.
2. Tier 2: mixed ambiguity or partial grounding.
3. Tier 3: open-world, fail-closed posture, or broad unresolved objective.

Target pool policy:
1. Support optional local-rest star pool (`radius_pc ~= 27..28` for ~88 ly envelope).
2. Fall back to static local target catalog if unavailable.
3. Keep symbolic pool independent from NHM2 contract-backed physical catalog.

## Gates and fail-closed behavior

Gate invariants:
1. `arrivalVisualAllowed = proof === confirmed && proof_verdict === PASS && integrityOk === true`.
2. Any `fail_closed` state blocks arrival visuals.
3. Any `integrityOk === false` blocks arrival visuals.
4. Overlay may still render route/status when blocked, with explicit fail-closed caption.

## Caption contract

Captions must be deterministic from state, not free-form random generation.

Required lines:
1. `observe`: "The route begins by refusing to pretend the fog is empty."
2. `retrieve`: "Evidence anchors the frame; distance folds symbolically."
3. `gate`: "The path pauses. Force would continue; balance waits for proof."
4. `verify`: integrity-dependent gate line.
5. `fail_closed`: "Transit capped. The route stops before uncertainty becomes theater."
6. `confirmed + integrity OK`: mention human-lifetime window status.

## Zen mapping as procedure

Map states to procedural meaning (not decorative quotes):

1. `observe` -> not-knowing -> fog and low certainty.
2. `retrieve` -> bearing witness -> evidence anchors appear.
3. `gate` -> restraint -> route pauses until gate condition.
4. `synthesize` -> skillful means -> route links consolidate.
5. `verify` -> balance under test -> ring tightens, gate decision.
6. `debrief` -> integration -> stable summary of route.

## New visual primitives

### Frame Triangulation Compass

Render four needles:
1. Prompt frame.
2. Evidence frame.
3. Procedure frame.
4. Proof frame.

Convergence behavior:
1. Needle spread narrows as triangulation improves.
2. Wider spread indicates frame disagreement and lower confidence.

### Balance Dipole

Render two coupled lobes:
1. Left lobe = ambiguity pressure.
2. Right lobe = evidence/proof support.

Behavior:
1. Balanced lobes indicate constructive reasoning.
2. Left-dominant lobe indicates route stall risk.
3. Right-dominant with weak proof indicates certainty inflation risk.

## UI surfaces

### Surface 1: inline mini overlay (Helix Ask)

Parent: `client/src/components/helix/HelixAskPill.tsx`

Requirements:
1. Place directly under existing Reasoning Theater strip.
2. Compact SVG rendering for mobile and desktop.
3. Respect reduced-motion settings.
4. Explicit badge text: `Symbolic Transit (Reasoning)`.

### Surface 2: full Helix panel

Registry file: `client/src/pages/helix-core.panels.ts`

Panel contract:
1. `id`: `reasoning-transit`
2. `title`: `Reasoning Transit`
3. `icon`: `Navigation2` or `Map`
4. `mobileReady`: `true`
5. default size: around `520 x 360`
6. Keep panel supplementary and clearly symbolic.

## Settings integration

### Start settings model

File: `client/src/hooks/useHelixStartSettings.ts`

Add:
1. `showHelixAskReasoningTransitOverlay: boolean`
2. bump `settingsVersion`
3. migration default `true`

### Settings dialog

File: `client/src/components/HelixSettingsDialogContent.tsx`

Add toggle near existing Helix Ask debug toggles:
1. Label: `Helix Ask reasoning transit overlay`
2. Description: `Show symbolic epistemic transit map under Reasoning Theater.`

## Implementation files

New files:
1. `docs/architecture/helix-ask-reasoning-transit-overlay.v1.md` (this spec).
2. `client/src/lib/helix/reasoning-transit.ts` (pure state derivation).
3. `client/src/components/helix/ReasoningTransitMap.tsx` (SVG renderer).
4. `client/src/components/helix/ReasoningTransitPanel.tsx` (full panel wrapper).
5. `client/src/lib/helix/reasoning-transit-bus.ts` (optional event bridge for panel sync).

Modified files:
1. `client/src/components/helix/HelixAskPill.tsx`
2. `client/src/pages/helix-core.panels.ts`
3. `client/src/hooks/useHelixStartSettings.ts`
4. `client/src/components/HelixSettingsDialogContent.tsx`

## Runtime flow

1. Helix Ask turn updates convergence/proof/debug/live events.
2. `deriveReasoningTransitState(...)` computes deterministic symbolic state.
3. Inline component renders compact transit map.
4. Optional event bus publishes state for full panel reuse.
5. Full panel subscribes and renders expanded map with same state.

## Accessibility and performance

1. SVG-first rendering (no WebGL requirement for v1).
2. Reduced-motion mode disables animated transitions.
3. Minimize rerenders: memoize derived state per event clock tick.
4. Ensure labels meet contrast requirements on dark theme.

## Security and truthfulness guardrails

1. Never represent symbolic metrics as physical NHM2 ETA.
2. Always show lane label and symbolic badge.
3. Arrival visuals require proof/certificate gate satisfaction.
4. Fail-closed state must be visually explicit.
5. Deterministic replay must reproduce target, route, and metrics from same input.

## Test plan

### Unit tests

`client/src/lib/helix/__tests__/reasoning-transit.spec.ts`

1. Same input -> same target, scores, caption.
2. `proof=fail_closed` clamps efficiency <= 0.2.
3. `confirmed + PASS + integrity=true` enables arrival visuals.
4. `PASS + integrity=false` blocks arrival visuals.
5. Open-world source cannot elevate confidence beyond formula constraints.
6. Target remains fixed for same `traceId + intentId`.

### Component tests

`client/src/components/helix/__tests__/ReasoningTransitMap.spec.tsx`

1. Renders Sol, target, route nodes, and symbolic badge.
2. Reduced-motion prop suppresses animation classes.
3. Fail-closed gate chip appears with fail caption.
4. Arrival ring appears only when arrival gate is allowed.

### Integration checks

1. Helix Ask reply cards and live strip show transit state consistency.
2. Panel and inline views display identical state for same trace.
3. Mobile view remains readable and touch-safe.

## Rollout

1. Phase 0: spec and state library.
2. Phase 1: inline mini overlay behind setting toggle.
3. Phase 2: full panel registration and event bridge.
4. Phase 3: tests, replay validation, telemetry tuning.

## Acceptance criteria

1. Overlay appears in Helix Ask and optional full panel.
2. Symbolic lane is clearly distinguished from NHM2 physical lane.
3. Deterministic replay reproduces identical symbolic output.
4. Fail-closed and integrity failures visibly block arrival states.
5. Unit/component tests pass for deterministic and gate behavior.

## Casimir verification gate note

For code/config implementation patches in this feature scope:
1. Run adapter verifier until `verdict=PASS`.
2. Report certificate hash and `integrityOk`.
3. Export/update training trace JSONL when collecting fresh analytics snapshots.
