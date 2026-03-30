# Decision Memo on Highest-Leverage Next Development Branch for CasimirBot York Diagnostics

## Executive Summary

The repository's current *York diagnostic framework* (contract + proof-pack audit) is already doing its core job for the **baseline** York lane: it produces a **non-physics** (explicitly bounded) classification verdict for NHM2 that is **low-expansion-like**, and it demonstrates **strong robustness** of that verdict under nearby policy perturbations. [filecite](turn7file0#L1)

At the same time, the repo is candid that the **alternate York lane is scaffolding-only** ("supported: false"), and the generated proof pack flags cross-lane comparison as **inconclusive** precisely because that alternate lane is not implemented "with honest tensor-path semantics." [filecite](turn3file0#L1) [filecite](turn7file0#L1)

**Recommendation (highest-leverage next branch): _B. Implement a first honest alternate York lane_.**

This is the highest-leverage move **scientifically** (not merely in coding convenience) because it closes the biggest remaining epistemic gap left by the York framework: **lane dependence** (observer/foliation dependence) is currently untested by construction. Implementing an *honest* alternate lane converts today's "single-lane robust" result into a testable claim about whether the classification is **stable across lanes** - which is exactly what the repo's own audit tooling is already structured to report (but currently cannot). [filecite](turn7file0#L1) [filecite](turn6file0#L1)

## Current Decision Context

The decision should be driven by what the repo has *actually proven* today, and what it still cannot legitimately claim.

The York diagnostic contract explicitly defines a **baseline lane** and an **alternate lane**. The baseline lane is marked supported; the alternate lane is explicitly marked unsupported, with an "unsupported_reason" stating it is not yet implemented with "honest tensor-path semantics." [filecite](turn3file0#L1)

The latest proof-pack audit (dated **2026-03-30**) demonstrates that the baseline lane is operational and meets integrity conditions. In particular, it reports (a) **preconditions** "ready_for_verdict: true," (b) controls are calibrated ("controls_calibrated: true"), and (c) there are **no guard failures** for the baseline lane. [filecite](turn7file0#L1)

Within that calibrated baseline lane, NHM2 is classified as **`nhm2_low_expansion_family`**, with natario_control as the winning reference and a large margin; it is also **robust** across **28** nearby policy variants, with a **dominantFraction = 1** and stabilityStatus **`stable_low_expansion_like`**. [filecite](turn7file0#L1)

However, cross-lane comparison is *explicitly blocked* because the alternate lane is unsupported: cross-lane status is **`lane_comparison_inconclusive`** and notes that at least one lane is unsupported. [filecite](turn7file0#L1)

Finally, the repo is also explicit about scope boundaries: the proof pack is "a render/geometry audit ... not a physical warp feasibility claim." This boundary is a core integrity commitment and should remain intact regardless of the branch chosen. [filecite](turn7file0#L1)

## Branch Analysis

### Branch comparison table

| branch | objective | upside | risk | blockers | prerequisites | when to choose it | when not to choose it |
|---|---|---|---|---|---|---|---|
| A. Freeze current lane as certified reduced-order baseline | Convert the baseline York lane from "working + audited" into a stable, explicitly versioned baseline that future work can't silently drift from | Strong ops leverage: protects reproducibility, reduces regression risk, enables trustworthy before/after comparisons | Scientific risk: may "cement" a single-lane worldview; can be mistaken for cross-lane validity if not messaged carefully | Missing committed artifacts for full replayability in-repo; certification criteria/process must be met (Stage-style gating) [filecite](turn11file0#L1) | Baseline lane must remain calibrated + guard-clean; must explicitly preserve "not feasibility claim" boundary [filecite](turn7file0#L1) | Choose if you need stability to support multiple teams/workstreams, or you are about to make wide-ranging changes that could regress York behavior | Do not choose if the next scientific question is lane dependence (it is), or if "freeze" would be used socially as a substitute for alternate-lane validation |
| B. Implement a first honest alternate York lane | Make cross-lane comparison real by implementing the currently "pending" observer/foliation lane with honest tensor semantics | Highest scientific leverage: tests whether the NHM2 classification is lane-invariant vs lane-dependent; converts current inconclusive cross-lane status into evidence [filecite](turn7file0#L1) | High implementation risk: a half-implemented lane would create *fake* confidence; incorrect tensor transforms could silently invalidate results | The alternate lane is currently declared unsupported in the contract and proof pack [filecite](turn3file0#L1) [filecite](turn7file0#L1) | Baseline lane must remain trusted; cross-check tooling (offline-vs-render congruence, guardrails) must be applied to the new lane as strictly as baseline [filecite](turn6file0#L1) | Choose if baseline lane is already calibrated/robust (it is) and cross-lane status is blocked by unsupported alternate lane (it is) [filecite](turn7file0#L1) | Do not choose if baseline lane is failing integrity preconditions or if you cannot commit to "supported=false until proven" discipline for the new lane |
| C. Move upstream into NHM2 solve/generation tuning | Change upstream NHM2 generation/solve parameters to explore different physical/morphological regimes | Potential scientific upside **only after** measurement is lane-robust: can explore whether NHM2 family membership moves with tuning | High epistemic risk right now: tuning before cross-lane validation can overfit to a single diagnostic lane; can create "coding progress" with low scientific value | Lack of lane-invariance evidence; cross-lane comparison currently inconclusive [filecite](turn7file0#L1) | Requires a measurement stack that's stable across lanes (not present yet) | Choose after alternate lane exists and you have a policy for preventing overfitting (e.g., multi-lane acceptance gates) | Do not choose while alternate lane is unimplemented; do not tune to chase a desired classification label |
| D. Add more non-York evidence lanes before touching physics | Add complementary evidence channels (constraint residuals, citation-grounded checks, invariants, etc.) so conclusions don't rest on York alone | Increases evidentiary diversity; aligns with the repo's "citation trace" discipline and staged maturity model [filecite](turn11file0#L1) [filecite](turn14file0#L1) | Risk of "instrumentation sprawl": many weak/duplicative lanes instead of one strong lane-invariance test; may delay the most decisive falsifier (alternate lane) | Need a clear ladder of evidence vs "proxy_only" mappings (many citation mappings are explicitly proxy-only today) [filecite](turn14file0#L1) | Baseline lane trust, plus a defined schema/contract for non-York lanes so they don't become narrative-only | Choose if York lanes are known to be insufficient or if you must support external-facing claims requiring multiple independent checks | Do not choose as an alternative to implementing the missing alternate York lane (because lane dependence is currently the dominant unknown) |

### Narrative assessment focused on scientific leverage

The current York proof pack already demonstrates that **within the baseline lane**, NHM2 is closer to the Natario-like control than to the Alcubierre-like control by a large margin, and that this verdict is **stable under 28 local contract perturbations**. As a single-lane diagnostic, it is doing what it claims to do. [filecite](turn7file0#L1)

But the repo has also engineered a clear "stop sign": **the alternate lane is declared unsupported**, and cross-lane comparison is therefore forced to **inconclusive**. That is an explicit admission that the project currently lacks the most important scientific robustness check for York-based morphology claims: whether the conclusion is **lane-invariant**. [filecite](turn3file0#L1) [filecite](turn7file0#L1)

Because this is a *scientific* leverage question, "more tuning" (C) is low leverage right now: if your measurement is not yet lane-validated, tuning the generator risks optimizing to an artifact. Likewise, "freezing" (A) is useful operationally but does not answer the most load-bearing unknown. "More lanes" (D) can be valuable, but it risks dispersing effort across many partial checks while the primary falsifier - cross-lane invariance - remains untested.

## Recommended Next Branch

**Choose Branch B: Implement a first honest alternate York lane.**

### Why this is the highest-leverage move now

The current York framework is already set up to compute and report cross-lane agreement, but it cannot do so today because the alternate lane is explicitly unsupported. The proof pack explicitly reports the cross-lane comparison as **inconclusive** for that reason. [filecite](turn7file0#L1)

This makes Branch B uniquely high leverage because it directly turns a known "unknown" into answerable evidence:

- The contract explicitly names an **alternate_lane_id** and marks it unsupported pending "honest tensor-path semantics." [filecite](turn3file0#L1)
- The proof pack already runs lane evaluations and would compare baseline vs alternate verdicts if both lanes were supported and calibrated; today it cannot and therefore says **lane comparison inconclusive**. [filecite](turn7file0#L1) [filecite](turn6file0#L1)

In other words: Branch B is not "feature work"; it is completing the repo's own epistemic contract by building the missing lane needed to test what the York framework is designed to test.

### Exact decision rule for choosing among A/B/C/D

Use this gate-like rule set, driven by *the York proof-pack outputs* and the repo's own "unsupported lane" policy:

**Decision rule (deterministic):**

1. **If baseline lane integrity is not proven, do not proceed to B/C/D. Choose A (stabilize baseline) first.**
   Baseline integrity means (at minimum) the proof pack reports: preconditions ready, controls calibrated, no guard failures, and offline-vs-render congruence is clear. [filecite](turn7file0#L1)

2. **Else, if cross-lane comparison is blocked because alternate lane is unsupported, choose B.**
   Concretely: if the contract marks the alternate lane `supported=false` and the proof pack reports `cross_lane_status = lane_comparison_inconclusive` with notes referencing an unsupported lane, then the next highest-leverage branch is B. [filecite](turn3file0#L1) [filecite](turn7file0#L1)

3. **Else (alternate lane exists and is supported), choose between A/C/D by the dominant remaining uncertainty:**
   - If your main risk is regression/reproducibility and you need a stable reference, choose **A** (freeze/certify). This aligns with the repo's own staged maturity approach (Stage 3 = "certified / policy-gated"). [filecite](turn11file0#L1)
   - If your main risk is "single diagnostic channel," choose **D** (add non-York evidence lanes) before tuning generators. This aligns with the citation-trace discipline where many mappings are currently "proxy_only" and need falsifier-backed upgrades. [filecite](turn14file0#L1)
   - Only choose **C** (NHM2 tuning) once you have (i) multi-lane York support and (ii) a policy that prevents overfitting by requiring agreement across lanes/evidence channels.

By this rule, the current repo state selects **B**.

## Branch-by-Branch Decision Rules

**Branch A: Freeze current lane as certified reduced-order baseline**
Choose A if and only if the repo can commit to a "baseline is a product" posture: the baseline lane remains calibrated and guard-clean in the proof pack, and you need to protect that as an invariant while other work proceeds. A aligns with the repo's own staged maturity framing for "Certified / Policy-gated" components (Stage 3), which requires hard checks and integrity discipline. [filecite](turn7file0#L1) [filecite](turn11file0#L1)
Do not choose A if stakeholders might mistakenly treat "certified baseline lane" as a substitute for cross-lane validity; the repo currently flags cross-lane comparison as inconclusive when alternate lanes are unsupported. [filecite](turn7file0#L1)

**Branch B: Implement a first honest alternate York lane**
Choose B when: baseline lane is already meeting proof-pack integrity conditions; NHM2 classification is stable under the contract robustness sweep; and cross-lane status is currently blocked due to unsupported alternate lane. This is exactly today's state. [filecite](turn7file0#L1)
Do not choose B if you cannot enforce the repo's own honesty rule: keep the alternate lane `supported=false` until you can demonstrate congruence checks and control calibration comparable to baseline (the proof pack tooling is explicitly designed to enforce these prerequisites). [filecite](turn6file0#L1)

**Branch C: Move upstream into NHM2 solve/generation tuning**
Choose C only after you can evaluate changes against *lane-invariant* diagnostics. Today, the proof pack's cross-lane comparison is explicitly inconclusive because one lane is unsupported, so tuning upstream risks optimizing against a single lane. [filecite](turn7file0#L1)
Do not choose C if the goal is to reach a preferred label ("low expansion" or otherwise). The proof-pack boundary statement and the repo's citation-trace rules emphasize avoiding over-claiming; tuning to a label is the opposite of that discipline. [filecite](turn7file0#L1) [filecite](turn14file0#L1)

**Branch D: Add more non-York evidence lanes before touching physics**
Choose D when the key risk is "York alone is not enough" for the target audience or decision, and you can integrate additional lanes as falsifier-backed, evidence-typed checks (not narrative). The citation trace document is explicit that many mappings are "proxy_only," which is a signal that formalizing additional evidence lanes could add integrity. [filecite](turn14file0#L1)
Do not choose D as a substitute for implementing the alternate York lane - because the repo has already identified lane dependence as a first-class unknown by explicitly scaffolding an alternate lane and marking it unsupported until honest semantics exist. [filecite](turn3file0#L1)

## Top 5 Next Tasks

1. **Specify the alternate lane's semantics in the contract (without enabling it yet).**
   Replace the "pending" placeholders (observer/foliation/theta_definition/kij_sign_convention) with a concrete, documented target, while keeping `supported=false` until implementation is complete. This matches the contract's current integrity posture ("unsupported_reason" is explicit). [filecite](turn3file0#L1)

2. **Implement the alternate-lane tensor-path semantics end-to-end, then wire proof-pack execution through it.**
   The proof pack already contains explicit guardrails against "fake" cross-frame claims, including lane support gating and strict York diagnostics/provenance requirements. The implementation work should be structured so those same guards can pass for lane B. [filecite](turn6file0#L1)

3. **Make the alternate lane "earn" `supported=true` by passing the same integrity checks as baseline.**
   Concretely, the new lane should be required to satisfy: controls independence, all required views rendered, provenance hashes present, runtime status provenance present, and offline-vs-rendered congruence clear - mirroring the baseline lane's current status. [filecite](turn7file0#L1)

4. **Run the proof pack in a "two-lane" mode and promote cross-lane output to a first-class gating signal.**
   The current report explicitly shows baseline verdict present and alternate inconclusive, producing `lane_comparison_inconclusive`. The target is a report where cross-lane status is no longer blocked by "unsupported lane," enabling real lane agreement/disagreement evidence. [filecite](turn7file0#L1)

5. **Strengthen control separation in a way that improves scientific signal rather than cosmetic robustness.**
   The repo recently refined Alcubierre signal sufficiency logic to treat "tiny but signed" structure as sufficient, via offline lobe evidence and a very small sign threshold. That change is compatible with today's proof pack, but it also flags a risk: your control separation may rely heavily on discrete morphology rather than strong magnitude separation. Introduce an explicit "control separability" diagnostic in the proof pack (even if it's only an audit note at first). [filecite](turn16file0#L1) [filecite](turn7file0#L1)

## Do-Not-Do List

- **Do not tune NHM2 upstream (Branch C) to chase a desired classification label** while cross-lane status remains inconclusive; this would optimize against a single-lane diagnostic and reduce scientific value. [filecite](turn7file0#L1)
- **Do not mark the alternate lane as supported** until you can demonstrate "honest tensor-path semantics" and pass the same proof-pack integrity gates as baseline. [filecite](turn3file0#L1)
- **Do not weaken the proof-pack boundary statement** or let downstream docs imply feasibility claims; the proof pack is explicitly a geometry/render audit, not a feasibility claim. [filecite](turn7file0#L1)
- **Do not compensate for lack of lane-invariance evidence by adding many weak evidence lanes** (Branch D) without falsifiers and clear evidence typing; the citation trace explicitly distinguishes "exact/derived" from "proxy_only," and adding more proxy-only lanes increases noise, not confidence. [filecite](turn14file0#L1)
- **Do not treat the citation trace mapping as codebase truth**; it is labeled "provided_unverified" and explicitly says it "must not be treated as the codebase solution." [filecite](turn14file0#L1)

## Final Recommendation

Proceed with **Branch B: Implement a first honest alternate York lane**.

This is the highest-leverage move because the baseline lane already delivers a stable, robustness-swept NHM2 classification result **within** that lane, but the repo's own framework clearly identifies the next missing scientific check: **cross-lane validation** is impossible until an honest alternate lane exists. [filecite](turn7file0#L1) [filecite](turn3file0#L1)
