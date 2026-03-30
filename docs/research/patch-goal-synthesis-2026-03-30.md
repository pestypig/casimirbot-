# Patch Goal Synthesis After York Research Stack

## Executive Summary

The five recorded research memos converge on a single practical conclusion:

1. **Lane A is trusted enough to use.**
2. **NHM2 is low-expansion-like only under Lane A's declared contract.**
3. **Cross-lane claims are still blocked.**
4. **The next patch should improve measurement discipline before changing physics behavior.**

That means the best route is not immediate NHM2 tuning and not immediate activation of a fake second lane. The next patch sequence should start with **RODC infrastructure and artifact discipline**, then move into **alternate-lane feasibility/specification**, and only after that attempt a real alternate-lane implementation.

This synthesis resolves the only real tension in the memo set:

- the decision memo correctly identifies **a real alternate York lane** as the highest-leverage scientific milestone
- the lane-dependence and RODC memos also make clear that implementing such a lane prematurely would create fake rigor if the tensor path is not honest

So the correct route is:

1. **Patch the comparison framework first**
2. **Specify lane B honestly**
3. **Implement lane B only if the spec is geometrically real**

## Inputs Used

This synthesis is based on:

- `docs/research/york-current-state-truth-audit-2026-03-30.md`
- `docs/research/york-time-warp-family-diagnostic-memo-2026-03-30.md`
- `docs/research/york-time-morphology-and-lane-dependence-2026-03-30.md`
- `docs/research/reduced-order-deterministic-congruence-framework-2026-03-30.md`
- `docs/research/next-development-decision-memo-2026-03-30.md`

## Consensus Across The Research Set

### Established now

- The current York diagnostic lane is explicit and enforced.
- Renderer/conversion failure is no longer the lead explanation under that lane.
- NHM2 classifies as low-expansion-like under the baseline lane.
- That classification is robust under nearby contract perturbations.
- The current workflow is already operating as a reduced-order, lane-local comparison protocol.

### Blocked now

- Cross-lane interpretation is blocked because the alternate lane is unsupported.
- Lane-invariance claims are not licensed.
- Theory-identity claims are not licensed.
- Upstream NHM2 tuning would currently risk overfitting to one lane.

### Hard boundaries repeated by multiple memos

- Family resemblance is not ontology.
- Lane-local diagnostic success is not feasibility.
- Unsupported lanes must remain unsupported until they have honest tensor-path semantics.

## Tension Resolution

At first glance the memo stack appears to point in two directions:

- **Decision memo:** implement the first honest alternate York lane
- **RODC / lane-dependence memos:** do not move into a second lane unless the framework can support it honestly

These are not actually in conflict.

The correct resolution is:

- the **scientific destination** is still a real second lane
- the **next implementation step** is to build the infrastructure that prevents that lane from becoming cosmetic

That makes the immediate patch goal:

**Build the deterministic reduced-order comparison layer into a reusable, machine-readable, drift-checkable contract before implementing new physics-facing comparison lanes.**

## Recommended Patch Sequence

### Patch 1: RODC infrastructure hardening

This is the best immediate route.

Scope:

- add a typed/shared RODC contract or schema
- add machine-readable reduced-order artifact output for York proof-pack runs
- add drift/regression report scaffolding
- add claim-boundary fields directly into the artifact
- keep all outputs explicitly lane-local

Why first:

- it improves discipline without changing the underlying physics claim
- it makes future lane-B implementation falsifiable
- it reduces the risk of silent contract drift
- it gives future NHM2 tuning something stable to optimize against

Target files likely include:

- `shared/warp-rodc-contract.ts` or similar
- `docs/specs/warp-rodc-contract-v1.md`
- `scripts/warp-york-control-family-proof-pack.ts`
- `tests/warp-york-control-family-proof-pack.spec.ts`
- new drift/report scripts and tests

### Patch 2: Alternate-lane specification patch

Do this after Patch 1, before any real lane-B compute path.

Scope:

- define the intended lane-B semantics precisely
- record required tensors/observer/foliation choices
- keep `supported=false`
- add preflight/falsifier structure for what would make lane B honest

Why second:

- the current research set supports the need for lane B
- but it does not yet justify enabling lane B without stronger geometric specificity

### Patch 3: Real alternate-lane implementation

Do this only if Patch 2 yields an honest, implementable lane.

Scope:

- compute lane-B quantities from a genuinely different geometric path
- carry lane metadata end-to-end
- require the same calibration/precondition discipline as lane A
- promote cross-lane comparison from inconclusive to active only after controls pass

### Patch 4: Freeze baseline lane as certified reduced-order baseline

Do this after Patch 1 or Patch 3, depending on workload and regression risk.

Purpose:

- protect reproducibility
- make drift visible
- stabilize the current comparison anchor

### Patch 5: Only then consider NHM2 tuning or additional evidence lanes

Order after lane work:

1. real alternate-lane comparison
2. additional non-York evidence lanes if needed
3. upstream NHM2 solve tuning

## Ranked Backlog

| priority | patch goal | why now | dependency | do now? |
|---|---|---|---|---|
| 1 | RODC schema + artifact output + drift scaffolding | Highest leverage without overclaiming; makes future comparisons reproducible and testable | none | yes |
| 2 | Lane-B semantic spec and falsifier contract | Needed before any honest alternate-lane implementation | patch 1 preferred | yes |
| 3 | Commit or deterministically regenerate machine-readable proof-pack artifacts | Closes a current provenance gap in the research stack | patch 1 | yes |
| 4 | Control-separability diagnostics | Strengthens calibration quality before cross-lane interpretation | patch 1 | yes |
| 5 | Real alternate-lane compute path | Main scientific milestone, but only after spec and artifact discipline | patches 1-2 | later |
| 6 | Baseline freeze/certification | Good for regression control, but does not answer lane dependence by itself | patches 1 or 3 | later |
| 7 | NHM2 upstream tuning | Valuable only after measurement is stronger | patches 1-5 | no |
| 8 | Broad new evidence lanes | Useful, but not as a substitute for honest lane work | patches 1-3 | later |

## Immediate Implementation Recommendation

If we start coding from this synthesis, the next patch should be:

### `Patch Goal A: warp-rodc-contract + proof-pack artifact discipline`

Concrete deliverables:

1. add a shared schema for reduced-order congruence artifacts
2. make the York proof-pack emit machine-readable reduced-order JSON
3. include:
   - contract id/version
   - lane id
   - provenance hashes
   - feature vector
   - distances
   - robustness summary
   - preconditions
   - claim boundary fields
4. add a drift/regression script for latest vs dated artifacts
5. add tests that fail on silent schema drift or missing required fields

This patch is the best route because it improves the scientific baseline immediately and does not require pretending we already know what lane B should be.

## What We Should Explicitly Not Do Next

- Do not tune NHM2 to chase a desired label.
- Do not mark lane B supported before it has a real tensor path.
- Do not let screenshot-level outputs outrun machine-readable artifacts.
- Do not treat baseline-lane robustness as cross-lane robustness.
- Do not broaden into many weak evidence channels before the reduced-order contract is stable.

## Decision Rule Going Forward

Use this rule after each patch:

1. If reduced-order artifacts are not deterministic and replayable, keep working on infrastructure.
2. If lane-B semantics are still vague, keep lane B unsupported.
3. If lane-B semantics are precise and implementable, build lane B.
4. If two-lane comparison is active and calibrated, then decide whether to:
   - freeze baseline,
   - broaden evidence lanes,
   - or tune NHM2 upstream.

## Recommended Next Working Session

The next coding session should be scoped narrowly:

**Implement RODC artifact/schema/drift scaffolding for the York proof-pack, without changing solver physics and without enabling lane B.**

That is the cleanest continuation from the current state and the best leverage point supported by the research set.
