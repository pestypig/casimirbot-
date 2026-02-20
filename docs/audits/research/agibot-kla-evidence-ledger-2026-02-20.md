# AGIBOT KLA Evidence Ledger (2026-02-20)

Normalized from `agibot-open-source-knowledge-linked-agents-deep-research-2026-02-20.md` for machine-auditable execution.

## Claim ledger

| claim_id | assertion | status | relevance | evidence_anchor | deterministic_follow_up |
|---|---|---|---|---|---|
| AGIBOT-KLA-001 | AGIBOT public surfaces include Open Source + Document Center paths relevant to engineering intake. | confirmed | knowledge-linking | Deep research: "Scope and key findings", "AGIBOT open source assets". | none |
| AGIBOT-KLA-002 | Link-U-OS positions simulation/verification, deployment management, and data recording as closed-loop workflow supports. | confirmed | simulation | Deep research: "AGIBOT open source assets and what they enable". | none |
| AGIBOT-KLA-003 | AimRT runtime/release notes include record-playback/timer/timestamp primitives useful for replay-oriented debugging. | inferred | deterministic-timing | Deep research: "AGIBOT open source assets", "Event-segmented timing". | Collect one primary AimRT doc release URL and pin exact feature lines in a follow-up citation packet. |
| AGIBOT-KLA-004 | X1 open materials expose hardware/development artifacts with downstream training/inference integration relevance. | inferred | runtime | Deep research: "AGIBOT open source assets", "X1 development materials". | Build an X1 asset manifest (`docs/audits/research/agibot-x1-asset-manifest.md`) with path-level provenance. |
| AGIBOT-KLA-005 | "SoulSync" branding is ambiguous; architecture translation should be source-of-truth -> retrieval binding rather than product-name coupling. | confirmed | knowledge-linking | Deep research: "Custom knowledge linking for an AGIbot". | none |
| AGIBOT-KLA-006 | OpenAI vector stores + Retrieval/`file_search` can implement practical knowledge-binding in this repo. | confirmed | knowledge-linking | Deep research: "Custom knowledge linking", "Codex cloud alignment". | none |
| AGIBOT-KLA-007 | Codex Cloud ask/code modes and parallel tasking align with lane-based repo work. | confirmed | codex-cloud | Deep research: "Deep research and Codex cloud alignment". | none |
| AGIBOT-KLA-008 | Deterministic replay should separate physical time from logical order and enforce event ordering in replay. | confirmed | deterministic-timing | Deep research: "Event-segmented timing...", "Practical meaning of time sector strobing". | none |
| AGIBOT-KLA-009 | Physics constants (c, Planck time) should be treated as conceptual bounds, not software timer targets. | confirmed | simulation | Deep research: "Event-segmented timing...". | none |
| AGIBOT-KLA-010 | Repository already contains lane-oriented artifacts compatible with deterministic-lane framing. | inferred | runtime | Deep research: "Scope and key findings" final paragraph. | Add a deterministic-lane artifact index under `reports/` mapping existing lane docs to owners. |
| AGIBOT-KLA-011 | SMB operations benefit from replay-driven debugging because live concurrency diagnosis is limited. | inferred | runtime | Deep research: "Simultaneous development and closed-loop workflows". | Validate with at least one incident postmortem sample and measured MTTR delta before promoting to confirmed. |
| AGIBOT-KLA-012 | AGIBOT stack language about recording/replay supports event-segmented architecture direction for this repo. | inferred | deterministic-timing | Deep research: "Event-segmented timer architecture (recommended)". | Add direct crosswalk table from AGIBOT runtime primitives to Casimir trace schema fields. |
| AGIBOT-KLA-013 | Public evidence does not support claiming specific SoulSync vendor implementation details. | confirmed | knowledge-linking | Deep research: "Custom knowledge linking for an AGIbot" opening lines. | none |
| AGIBOT-KLA-014 | No safe path should allow direct high-level LLM output to actuator-level execution without gates. | unknown | runtime | Guardrail requirement from prompt pack, not fully proven in deep-research artifact alone. | Execute architecture audit of control path boundaries and produce explicit actuator-gate proof artifact. |

## Unknown/conflict queue

Claims requiring deterministic closure before certified-stage deployment claims:

1. `AGIBOT-KLA-003`: lock primary AimRT provenance lines.
2. `AGIBOT-KLA-004`: create X1 asset-level manifest.
3. `AGIBOT-KLA-010`: build lane artifact index with owner + replay checkpoints.
4. `AGIBOT-KLA-011`: obtain incident data to validate operational benefit claim.
5. `AGIBOT-KLA-012`: publish AGIBOT->Casimir schema crosswalk.
6. `AGIBOT-KLA-014`: publish actuator-gate audit proving fail-closed control boundaries.

## Status taxonomy

- `confirmed`: directly supported in referenced research artifact language.
- `inferred`: plausible synthesis from current research but pending tighter source pinning or local proof.
- `unknown`: materially important claim lacking sufficient evidence for promotion.

## Contract linkage

- `AGIBOT-KLA-005`, `AGIBOT-KLA-006`, and `AGIBOT-KLA-013` are operationalized in `docs/architecture/agibot-knowledge-linking-contract-v1.md`.
- Indexing execution details are defined in `docs/runbooks/agibot-knowledge-indexing-runbook-2026-02-20.md`.
- `AGIBOT-KLA-008` and `AGIBOT-KLA-012` replay operationalization now maps to `docs/runbooks/rare-bug-replay-and-lane-debugging-2026-02-20.md`.
