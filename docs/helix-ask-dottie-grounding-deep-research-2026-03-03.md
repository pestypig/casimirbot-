# Deep research on Dottie integration, Helix Ask grounding, and step-by-step scientific reasoning sessions

## Repository-backed snapshot of where Dottie lives today

Across the repo, Dottie is implemented as part of a "mission-overwatch" + voice callout subsystem, with its own event normalization, salience policy, and an orchestrator that emits short, action-oriented guidance rather than acting as a first-class signal inside Helix Ask's core retrieval -> synthesis funnel. The clearest structural evidence is that Dottie-related runtime code is organized under mission-overwatch services and operates on normalized "mission events," not on Helix Ask's internal reasoning artifacts. [filecite:turn27file0:L1]

That actual "Dottie contract surface" is explicitly documented as a prompt-style contract intended to keep text/voice/board behavior aligned and deterministic (including certainty posture constraints), but it is authored and evolved as a mission/voice control-plane artifact, not as an Ask-core routing primitive. In other words, the repo already treats "Dottie behavior" as a downstream presentation/action layer with hard invariants (certainty parity, evidence posture), rather than as a routing feature baked into Ask's topic inference, query expansion, or reranking. [filecite:turn18file0:L1]

A separate deep-research package in the repo reinforces the same maturity assessment: the system has pieces of an end-to-end overwatch loop (mission-board context ingestion, deterministic event IDs, salience and cooldowns, voice gating), but lacks evidence of a single, contract-verified pipeline wiring "Helix Ask internal signals -> normalized mission events -> consistent board + voice outputs." That gap matters directly for your "parity prompt" failure mode: even if Dottie contracts exist, "Dottie-driven reasoning signal" won't exist until those signals participate in Ask's routing/retrieval/rerank decisions. [filecite:turn33file0:L1]

## How Helix Ask currently decides "repo-grounded vs hybrid vs general," and why that is the right backbone

Your proposed dual-lane reasoning session ("repo recall first; open-world only when repo evidence missing") is not just intuitive, it is already strongly aligned with the direction the repo has taken for Helix Ask routing: a dedicated arbiter function selects among `repo_grounded | hybrid | general | clarify`, using retrieval confidence thresholds plus additional signals like "must-include satisfied," "has repo hints," "topic tags," and "verification anchor" checks. [filecite:turn32file0:L1]

Two details in this arbiter design matter for "objective scientific reasoning aligned to repo evidence":

First, the arbiter's decision is explicitly treated like a mode selection problem with measurable inputs and debuggable outputs (ratio, topicOk, conceptMatch), not a vague "try to be grounded" instruction. This is the right primitive if you want consistent behavior across prompts and reproducible audits. [filecite:turn32file0:L1]

Second, Helix Ask adds an "evidence-critic" option that reduces false confidence from instruction-like tokens (for example, "answer," "bullets," "cite") by filtering them out before evaluating evidence match ratios. Even though this is not "scientific reasoning" by itself, it is a concrete mitigation for a common failure mode: prompts whose language causes naive token-overlap gates to conclude "evidence is present" when it is not. [filecite:turn32file0:L1]

Taken together, the repo already encodes the core of the mental model you described:

- Decide whether the user expects repo grounding, and whether the system can achieve it.
- Use measurable gates (retrieval confidence, must-include constraints, evidence match) to select a mode.
- Emit debug fields so misroutes can be diagnosed rather than argued about. [filecite:turn32file0:L1]

This is the correct "spine" to hang a Dottie integration on: instead of making Dottie a persona override, you make it one more signal source that influences arbiter-mode selection and/or reranking while preserving the arbiter's determinism and auditability.

## Why Dottie currently behaves like a downstream layer, not an Ask-core reasoning signal

In code, mission-overwatch takes in raw "mission events," normalizes them deterministically, classifies them, then applies a salience policy that rate-limits and decides whether a voice callout should occur. This is a classic control-plane architecture (ingest -> normalize -> classify -> policy -> output), and it is clearly separated from Helix Ask's core (retrieve -> gate -> synthesize). [filecite:turn27file0:L1]

Two repo details help explain your observed "it mentions Dot/Dottie mostly from docs, not from an active Dottie-driven reasoning signal":

- The mission-overwatch event pipeline includes heuristic/keyword classification (a pragmatic starting point), which is fine for callouts but insufficient to be a reliable reasoning feature unless it is wired into the same evidence posture and contradiction handling the Ask arbiter expects. [filecite:turn33file0:L1]
- The repo's own uniform-utility research package explicitly calls out that "overwatch sensing as unified pipeline" is "present as parts, not as a single contract-verified pipeline," and it treats higher-order claims as hypothesis until tested. That language is consistent with your "mission-overwatch parity prompt drifted" observation: the system doesn't yet have a consolidated mechanism to route "mission-overwatch" prompts into a Dottie-relevant retrieval + synthesis posture. [filecite:turn33file0:L1]

This is also why "just adding Dottie contracts" doesn't automatically improve Ask performance: contracts improve correctness once the contract is on the critical path. Today the contracts are real, but the critical path for Helix Ask routing is still dominated by its own arbiter + retrieval confidence + topic/tag/hint signals. [filecite:turn32file0:L1]

## Atlas exists now, but it is not yet an Ask-runtime retrieval channel

Your diagnosis that "there is no Atlas channel wired into ask runtime yet" is directionally consistent with what the repo shows: "Repo Atlas" is implemented as an offline/CI-supported artifact generation and query subsystem, exposed via build/query scripts (build, why, trace) that operate on `artifacts/repo-atlas/repo-atlas.v1.json`. [filecite:turn39file0:L1]

On top of that, Atlas is being operationalized through a benchmark harness and a CI gate, plus playbook language that makes "Atlas retrieval flow before edits" mandatory for repo-wide indexed tasks. This framing positions Atlas as (a) a deterministic investigation substrate and (b) a developer/operator workflow requirement, not yet as a runtime Ask retrieval engine. [filecite:turn40file0:L1]

The Atlas benchmark corpus explicitly includes Helix Ask and mission-control/voice task prompts and expects documentation such as `docs/architecture/helix-ask-mission-systems-integration-plan.md`. That is strong evidence that Atlas is envisioned as the backbone for cross-system traceability and retrieval quality, but it does not itself prove runtime integration into Ask's retrieval stack, especially since the Atlas interface is "build an artifact then query it," with CI gates around that artifact. [filecite:turn40file0:L1]

This matters for your "scientific reasoning aligned to repo evidence" goal because Atlas is exactly the kind of artifact that can improve coverage and attribution pathways (upstream/downstream trace), but until Ask runtime consumes Atlas (or an Atlas-derived index) as a retrieval channel, Ask will continue to rely on its existing channels and heuristics.

## A step-by-step reasoning session that is both intuitive and consistent with the repo's direction

The most intuitive "reasoning session" design for your goals is one that makes mode selection, evidence posture, and output contract explicit, and minimizes expensive LLM calls given the repo's documented performance constraints.

In that sense, your proposed dual-lane approach maps cleanly onto the existing arbiter modes, and can be made more rigorous by treating it as a deterministic state machine with measurable transitions:

A reasoning session starts with deterministic classification and constraints extraction. The key output is not "an answer," but a declared mode consistent with the arbiter concept: `repo_grounded`, `hybrid`, `general/open_world`, or `clarify`. In the repo, this structure already exists as an arbiter decision driven by retrieval confidence plus additional signals (repo hints, topic tags, must-include, verification-anchor constraints). [filecite:turn32file0:L1]

Next comes repo recall and evidence assembly. In your "dual-lane" framing, this is where you run the repo lane first. To make it scientific and objective, the system should compute and log evidence quality metrics (coverage ratio, contradiction rate, unsupported-claim rate), and then gate the mode decision on those metrics rather than on prompt vibes. The repo already demonstrates this philosophy via evidence eligibility checks and an "evidence critic" that reduces false matches caused by meta-tokens. [filecite:turn32file0:L1]

Only then should the system synthesize an answer, and the synthesis should be constrained by a stable schema that forces scientific structure in every mode:

- Hypothesis (what you think is true)
- Evidence (repo citations if repo-grounded/hybrid; otherwise explicit open-world references)
- Counterpoints (alternate explanations or failure modes)
- Uncertainty (what would change your mind)
- Next falsifiable check (a concrete repo check, test, or measurement)

This is not just "nice formatting." It is a guardrail against the most costly failure: a plausible, fluent answer that cannot be audited. The repo's own Dottie uniform-utility planning emphasizes deterministic templates and stable reason labels as a core risk reducer, and it explicitly treats missing integration evidence as a blocker for higher-order claims. [filecite:turn33file0:L1]

Finally, a post-pass should enforce contract compliance: claim-to-evidence linking for repo-attributed claims, and strict suppression/downgrade rules when evidence is missing. This mirrors the repo's stated principle that "voice certainty must not exceed text certainty" and that evidence posture must be preserved across surfaces. [filecite:turn18file0:L1]

In practical terms, this design is intuitive because it matches how scientists and engineers already work: classify the question, gather evidence, decide what you can justify, then present conclusions with falsifiable follow-ups. More importantly, it is intuitive for debugging: every failure becomes either (a) incorrect mode selection, (b) poor evidence retrieval, or (c) synthesis contract violation, each of which can be instrumented and tested.

## LLM call count per prompt and why the repo's performance constraints push toward a two-call cap

Your focus on "how many LLM calls happen per prompt" is justified for two reasons: latency and auditability. The repo's own research artifacts point to throughput/latency bottlenecks tied to serialized inference and constrained runtime resources, and they explicitly call for deterministic degradation modes when long answers are slow. That reality makes unbounded helper calls a direct product risk if you want mission-time situational awareness. [filecite:turn33file0:L1]

A call-count model that stays intuitive, auditable, and consistent with the existing arbiter direction looks like this:

A prompt may have a deterministic short-circuit stage (for clearly deterministic questions or hard-guard answers). This stage should be zero-LLM where feasible, because it is faster and more reproducible.

Then comes the primary synthesis call. In the ideal single-LLM configuration, most prompts should finish with exactly one LLM call, because mode selection and evidence checks can be implemented deterministically (as in the existing arbiter + evidence critic patterns). [filecite:turn32file0:L1]

A single optional rescue call is justified only when a downstream gate fails: missing required sections, unacceptable unsupported-claim rate, or contract violations. That yields a hard cap of two synthesis calls, which is aligned with your stated reliability/latency goals and consistent with the repo's emphasis on deterministic gates + stable failure reasons. [filecite:turn33file0:L1]

If your runtime implements overflow retries, the physically executed backend calls per stage can multiply. This makes instrumenting attempt counts as important as instrumenting logical stages. The repo's general direction for debug field expansion (arbiter ratios, critic metrics) is aligned with this: you cannot manage what you do not measure. [filecite:turn32file0:L1]

For your specific ask, "is this the most intuitive way to align objective answers to repo reference even if codebase has nothing?", the key is mode discipline:

- If repo evidence is weak, the system should explicitly switch into open-world mode and say so, rather than hallucinating repo references.
- This preserves scientific reasoning quality even when the repo is silent: you still form hypotheses, cite external knowledge appropriately, state uncertainty, and propose falsifiable repo checks (for example: "search for X symbol," "run test Y," "trace identifier Z in Atlas").

That is exactly how you ensure good reasoning without pretending the repo has more coverage than it does.

## Minimal integration patch set and why it should hook into the arbiter, not bypass it

Your proposed "minimal integration patch set" is directionally correct, but the repo evidence suggests one refinement: integrate Dottie as a soft signal into Ask routing/reranking, not as a separate or overriding reasoning persona.

The repo's Dottie contract work emphasizes determinism and parity: voice is event-driven, rate-limited, and must not exceed the certainty posture of the text answer. That implies Dottie should not become a competing synthesis agent inside Ask; rather, it should influence which evidence is most salient and how outputs are structured across surfaces. [filecite:turn18file0:L1]

A minimal patch set consistent with the repo's existing patterns would therefore look like:

Add mission-overwatch/Dottie topic tags and make them affect arbiter inputs (topicTags, repo hints, or must-include profiles). This keeps the decision logic centralized in the same place that already decides `repo_grounded | hybrid | general | clarify`. [filecite:turn32file0:L1]

Add Dottie/mission-overwatch query seeds so retrieval is less likely to drift when the user implicitly asks for parity/integration behavior. You want the retrieval side to surface mission-overwatch and Dottie contracts as first-class evidence when relevant, instead of relying on incidental doc mentions. The repo's uniform-utility research package treats the lack of unified ingestion wiring as a major gap; query expansion is a low-risk first step toward closing that gap. [filecite:turn33file0:L1]

Wire mission-overwatch normalization/salience into Ask as a soft rerank feature, not a hard gate. Mission-overwatch already constructs deterministic, policy-driven views of "what matters now." If Ask can consume that as an additional feature, you can improve mission-prompt relevance without violating the evidence posture. [filecite:turn27file0:L1]

Add explicit debug fields: `dottie_signal_applied`, channel contributions, salience boost applied, and mode decision rationale. This follows the same philosophy as the arbiter debug fields and evidence critic metrics: if it is not visible in debug payloads, it will be impossible to reconcile disagreements about why a prompt routed one way or another. [filecite:turn32file0:L1]

Finally, run the repo's required verification lane. The repo's own autorun prompt pack establishes a mandatory `casimir:verify` command and a reporting block that includes verdict, firstFail, certificateHash, and integrityOk. Treating this as non-optional is consistent with the repo's emphasis on deterministic safety posture for mission + voice behaviors. [filecite:turn33file0:L1]

## Build context: goals, proposed changes, and expected gains

Primary goal:

- Make Helix Ask produce objective, repo-referenced scientific reasoning by default, while cleanly switching to explicit open-world reasoning when repo evidence is insufficient.

Operational goals:

- Improve first-pass relevance for mission-overwatch and Dottie-adjacent prompts without requiring users to spell exact repo terms.
- Preserve deterministic routing and auditable debug signals.
- Keep runtime latency bounded by controlling LLM call count.
- Maintain certainty parity across text, voice, and board surfaces.

Proposed changes:

- Keep arbiter mode selection as the control spine and make mode declaration explicit each turn.
- Add deterministic intent and constraint extraction before synthesis.
- Integrate Dottie as a soft routing and rerank signal, not a competing persona.
- Add mission-overwatch and Dottie query seeds and topic tags to reduce drift on implicit prompts.
- Feed mission-overwatch salience as a soft retrieval/rerank boost.
- Add Atlas as a runtime retrieval channel, not only an offline CI artifact flow.
- Enforce a scientific answer contract (hypothesis, evidence, counterpoints, uncertainty, next falsifiable check).
- Add post-synthesis claim-to-evidence checks with certainty downgrade and open-world fallback when needed.
- Expand debug payloads with channel contributions and Dottie-specific routing/rerank effects.
- Cap synthesis orchestration at one primary call plus one rescue call.

Expected gains:

- Higher retrieval precision and recall on mission-system prompts.
- Lower unsupported repo-grounded claims.
- Better first-response quality without overfitting to explicit keyword prompts.
- Faster failure attribution (routing vs retrieval vs synthesis contract).
- Better operator trust through deterministic evidence posture and replayable reasons.

## Build plan (phased, testable, and reversible)

Phase 0: baseline and acceptance contract

- Define baseline metrics from current Helix Ask battery: mode precision, citation coverage ratio, unsupported-claim rate, contradiction rate, and p50/p95 latency.
- Lock target thresholds for promotion.
- Add one canonical scorecard artifact for before/after comparison.

Done criteria:

- Baseline report committed.
- Promotion thresholds documented and agreed.

Phase 1: routing and relevance upgrades (arbiter + Dottie soft signal)

- Extend arbiter inputs with mission-overwatch and Dottie topic signals.
- Add query seed expansion for implicit mission/Dottie prompts.
- Add debug fields: `dottie_signal_applied`, `channel_contributions`, `mode_rationale`.
- Keep all new behavior behind feature flags for safe rollout.

Done criteria:

- Contract battery passes.
- Variety battery shows improved mode precision on mission/Dottie prompts.
- No regression on non-mission prompts.

Phase 2: retrieval depth upgrade (Atlas runtime lane)

- Introduce Atlas-backed retrieval as an additional runtime channel.
- Add channel fusion and weighted rerank using existing arbiter confidence posture.
- Log per-channel evidence contribution and final selected evidence set.

Done criteria:

- Atlas channel is visible in debug payloads for qualifying prompts.
- Coverage ratio improves versus Phase 1 baseline on mixed prompts.
- Latency remains within agreed budget.

Phase 3: synthesis hardening (scientific contract + certainty discipline)

- Enforce output schema for reasoning answers.
- Add claim-to-evidence checker and certainty downgrade rules.
- Enforce explicit open-world declaration when repo evidence is insufficient.

Done criteria:

- Unsupported-claim rate drops to threshold.
- Certainty posture is consistent across text and voice contract tests.
- Fail reasons are deterministic and replayable.

Phase 4: productionization and governance

- Run readiness debug loop batteries and publish scorecards.
- Add CI policy gates for regression on grounding metrics.
- Promote flags gradually (shadow mode -> partial traffic -> default on).

Done criteria:

- All gates pass with target thresholds.
- Rollback playbook validated.
- Final integration report committed with evidence artifacts.

## Measurement and guardrails

Core metrics:

- Mode precision and mode confusion matrix.
- Citation coverage ratio and evidence-match quality.
- Unsupported-claim and contradiction rates.
- Latency p50/p95 and LLM call count distribution.
- Mission prompt relevance win-rate against baseline.

Guardrails:

- Do not claim repo grounding when evidence lane fails.
- Voice certainty must not exceed text certainty.
- One primary synthesis call, one rescue call max, except explicit overflow policy events that must be logged.
- All major behavior changes remain flag-gated until scorecard thresholds are met.

## Immediate execution checklist

- [ ] Add Phase 0 baseline scorecard artifact.
- [ ] Implement Phase 1 arbiter and query-seed changes behind flags.
- [ ] Run contract and variety batteries, publish delta.
- [ ] Implement Phase 2 Atlas runtime channel with channel-contribution debug.
- [ ] Implement Phase 3 synthesis contract and claim-evidence checks.
- [ ] Run readiness loop and Casimir verification gate for each patch cycle.
