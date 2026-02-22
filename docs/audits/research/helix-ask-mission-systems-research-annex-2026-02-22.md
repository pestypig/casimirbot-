# Helix Ask Mission Systems Research Annex (2026-02-22)

Companion to:
- `docs/architecture/helix-ask-mission-systems-integration-plan.md`
- `docs/audits/research/helix-ask-mission-systems-codex-cloud-autorun-batch-prompt-pack-2026-02-22.md`

Purpose:
Preserve the full research rationale behind mission-systems build choices so implementation lanes do not lose long-horizon context.

## 1) Scope and intent boundary

This annex captures the parts that a build-sequencing plan cannot fully encode:
- decision rationale and tradeoffs
- rejected alternatives and why they were rejected
- assumptions and confidence posture
- time-sensitive external dependencies (pricing/licensing)
- leadership decisions still required

It is not a replacement for contract docs. Contract authority remains:
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/mission-go-board-spec.md`
- `docs/helix-ask-agent-policy.md`

## 2) Evidence and rationale map

### 2.1 Build-now rationale

Reason:
The repository already has the key seams required for mission-overwatch integration:
- live Helix Ask event hooks in desktop and pill
- conservative evidence/uncertainty policy
- existing audio focus primitive
- runtime resilience and rate-control patterns
- adapter verification and training-trace lifecycle

Implication:
The highest-value work is integration and enforcement, not new theoretical architecture.

### 2.2 Why deterministic v1 over LLM-heavy v1

Decision:
Use rule-based salience and deterministic state updates for v1.

Reason:
- lower certainty-inflation risk
- easier replay/debug
- lower and more predictable operating cost
- easier CI gating and regression control

Deferred:
- predictive threat modeling
- LLM-authored callout synthesis

## 3) Assumptions register

A1 (assumption): operators prefer concise action callouts over rich voice narration in mission contexts.
A2 (assumption): confidence labels (`confirmed|reasoned|hypothesis|unknown`) are sufficient for v1 communication posture.
A3 (assumption): mission identity can be represented with one canonical mission ID that links board events, voice callouts, and traces.
A4 (assumption): enterprise buyers require explicit provider governance before external rollout.
A5 (assumption): initial sensor set (Helix Ask streams + operator readiness + timers) is adequate for proving workflow value before external hardware integration.

Assumption handling rule:
Any prompt that invalidates A1-A5 must log a deterministic conflict note in the execution ledger and propose a contract-safe adjustment.

## 4) Rejected alternatives and rationale

R1) Chatty always-on voice narration
Rejected because it conflicts with low-noise operational doctrine and increases alert fatigue.

R2) Voice as primary control plane
Rejected because it introduces accessibility, ambiguity, and auditability risks. Voice remains an output channel.

R3) LLM-derived state engine in v1
Rejected because determinism and replay requirements are stronger than expressive synthesis needs at launch.

R4) Provider-specific lock-in in core contract
Rejected to preserve local-first ownership and reduce commercial/legal coupling.

## 5) Time-sensitive dependency notes

The following inputs are volatile and must be refreshed at decision time:
- managed TTS pricing
- model/provider licensing terms
- enterprise data processing policy requirements

Policy:
No permanent cost or licensing assertions in code comments/spec contracts without timestamped source references in a dedicated policy doc.

## 6) Leadership decision backlog

L1) Mission scope identity
- single-session mission IDs vs multi-session mission threads

L2) Provider default policy
- self-hosted-first vs managed-first default
- legal review threshold for new providers

L3) v1 transport mode for board updates
- polling-only vs optional SSE in same release

L4) Voice certainty boundary
- whether uncertain events can be summarized verbally or only surfaced as verify-next prompts

L5) Operator override model
- default voice mode and enterprise override rights

## 7) Congruence checks for implementation lanes

All implementation prompts should pass these congruence checks:
1) No increase in certainty relative to source evidence.
2) No direct coupling that makes voice success a prerequisite for board state progression.
3) No API breakage to existing Helix Ask ask/job behavior.
4) No non-deterministic state fold behavior in board engine.
5) No unmanaged provider enablement in enterprise path.

## 8) Mapping to batch prompts

- Prompt -1: locks annex context into ledger preflight.
- Prompt 1: resolves contract conflicts against this annex.
- Prompts 2-6: enforce deterministic implementation patterns.
- Prompt 7: encodes quality/SLO checks linked to annex risks.
- Prompt 8: operationalizes provider governance decisions.
- Prompt 9: preserves replay provenance for long-horizon learning.
- Prompt 10: final GO/NO-GO includes annex conflict status.

## 9) Exit criteria for full encapsulation claim

You may claim the research is fully encapsulated for implementation only when:
1) prompt pack includes Prompt -1 preflight against this annex,
2) execution ledger records assumption/rejection/leadership blocks,
3) contract docs and implementation outputs show no unresolved annex conflicts,
4) final readiness report includes annex congruence summary.
