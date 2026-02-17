# Universal Constraints Crossover Audit — 2026-02-17

## 1) Executive Summary

This audit finds that **Helix Ask is strong at explanation and evidence-shaped narration, but uneven at proof-relevant execution continuity**. The system can retrieve, summarize, and even trigger selected tools, but the end-to-end “universal constraints” loop (ideology -> retrieval -> action -> verification -> trace continuity) is not consistently represented as one enforceable contract.

### Top findings

- **P0 — Contract drift in verification response typing:** `server/routes/agi.adapter.ts` returns `certificate` in adapter responses, but `shared/schema.ts` `adapterRunResponseSchema` does not include a `certificate` field. This breaks strict typed parity for clients and proof packet automation. **(confirmed)** (`server/routes/agi.adapter.ts:643-652, 784-794`; `shared/schema.ts:2608-2618`)
- **P0 — Proof-relevant execution pathways are fragmented:** Helix Ask can *describe* actions and open panels, and adapter can run gate loops, but there is no unified ask-time execution contract that binds “act” to required gate/certificate/traces in the same envelope. **(confirmed + inferred)** (`shared/prompt-spec.ts:3-14`; `shared/local-call-spec.ts:31-38`; `server/routes/agi.plan.ts:25235-25274, 25702`; `server/routes/agi.adapter.ts:676-794`)
- **P1 — Language discipline is partially enforced but can be bypassed by UX prompt shaping:** There are good anti-overclaim instructions for warp ask and viability, but client-side prompt templates explicitly suppress output of certificates/logs, which can hide maturity/gate status from users even when available. **(confirmed)** (`server/skills/physics.warp.ask.ts:218-227`; `server/skills/physics.warp.viability.ts:216-223`; `client/src/components/helix/HelixAskPill.tsx:805`)
- **P1 — Ideology grounding exists, but ideology→tool→gate mapping is not first-class:** ideology detection and references are wired, yet the system does not enforce ideology branch-specific required tools/artifacts before high-confidence recommendations. **(confirmed + inferred)** (`server/routes/agi.plan.ts:5206-5233, 17665-17675`; `docs/ethos/ideology.json:6-50`)
- **P1 — Trace continuity exists but packet completeness is inconsistent by route:** training traces support `firstFail`, `certificateHash`, `integrityOk`, and movement episodes, but some workflows only emit partial artifacts, and ask responses do not consistently expose proof packet fields. **(confirmed + inferred)** (`shared/schema.ts:2396-2468`; `server/routes/agi.adapter.ts:637-652, 739-781`; `client/src/lib/agi/api.ts:74-205`)

---

## 2) Constraint Singularity Model

### Proposed system invariants

A “universal constraints” Helix Ask should satisfy these invariants:

1. **Invariant A — Claim admissibility:** No viability/certification claims unless HARD constraints pass and admissibility policy is satisfied.
   - Evidence: warp policy in `WARP_AGENTS.md` and viability policy semantics in skill implementation. **(confirmed)** (`WARP_AGENTS.md:3-8, 53-76`; `server/skills/physics.warp.viability.ts:264-281`)
2. **Invariant B — Action boundary:** LLM may propose intents, not direct actuation.
   - Evidence: adapter blocks motor/actuator commands. **(confirmed)** (`server/routes/agi.adapter.ts:412-460`; `docs/robot-recollection-cloud-build-plan-2026.md:20-24`)
3. **Invariant C — Proof packet continuity:** Every proof-relevant action produces a coherent packet: verdict, firstFail, deltas, certificate hash/integrity, artifact refs, and trace id.
   - Evidence: adapter contract and trace schemas define this expectation. **(confirmed)** (`docs/ADAPTER-CONTRACT.md:48-77, 84-89`; `shared/schema.ts:2386-2402, 2608-2618`)
4. **Invariant D — Maturity-aligned language:** Exploratory/diagnostic outputs cannot be presented with certified certainty.
   - Evidence: maturity guidance in AGENTS and atomic overview. **(confirmed)** (`AGENTS.md:38-39`; `docs/helix-ask-atomic-system-overview.md:96-117`)
5. **Invariant E — Ideology-constrained execution:** Ideology references should resolve to explicit branch constraints and required evidence/action rails.
   - Evidence: ideology tree structure exists, but no strict gate coupling is visible. **(inferred)** (`docs/ethos/ideology.json:6-50, 154-199`; `server/routes/agi.plan.ts:5206-5233`)

### Admissibility conditions (system-level)

An ask-driven action is admissible only if:

- Request is grounded (repo/docs/telemetry evidence path is available). **(confirmed)** (`server/routes/agi.plan.ts:25465`)
- Any execution intent crossing into physics viability has gate/certificate status bound to response. **(inferred)** (`server/routes/agi.plan.ts:11228-11237`; `server/skills/physics.warp.viability.ts:283-334`)
- Adapter verification yields `PASS` + certificate hash + integrity OK when policy requires certification. **(confirmed)** (`AGENTS.md:7-17`; `docs/ADAPTER-CONTRACT.md:84-89`)

---

## 3) Current Capability Map

### Matrix (`read | observe | act | verify`)

| Surface | Read | Observe | Act | Verify |
|---|---|---|---|---|
| `agi.plan` / Helix Ask | Strong repo/topic retrieval and grounding signals. **confirmed** (`server/routes/agi.plan.ts:3305-3346`) | Panel telemetry snapshots and summaries available. **confirmed** (`server/routes/agi.plan.ts:2390-2394, 2457-2488`) | Can execute compiled tool plans; supports panel/open flows and viewer launch. **confirmed** (`server/routes/agi.plan.ts:25725-25830`; `client/src/components/helix/HelixAskPill.tsx:1364-1392, 2079-2099`) | Evidence/coverage/belief gates in debug payload; not a single hard proof packet contract for all asks. **confirmed+inferred** (`client/src/components/helix/HelixAskPill.tsx:2460-2522`) |
| Adapter (`/api/agi/adapter/run`) | Accepts action/pack requests. **confirmed** (`docs/ADAPTER-CONTRACT.md:14-45`; `shared/schema.ts:2596-2605`) | Uses telemetry auto-ingest and pack evaluators. **confirmed** (`server/routes/agi.adapter.ts:201-230, 570-616`) | Runs GR loop, premeditation scoring, robotics safety veto. **confirmed** (`server/routes/agi.adapter.ts:676-710, 316-410`) | Emits verdict/firstFail/deltas/certificate/artifacts; best proof packet surface. **confirmed** (`server/routes/agi.adapter.ts:643-652, 784-794`) |
| Skills layer | Rich retrieval and specialty tools (`docs.*`, `repo.*`, `physics.*`, telemetry). **confirmed** (`server/skills/*`; `server/routes/agi.plan.ts:65-97`) | Telemetry panel/time-dilation capture available. **confirmed** (`server/skills/telemetry.panels.ts:16-29`; `server/skills/telemetry.time_dilation.activate.ts:52-99`) | Limited direct control tools (time dilation activate/control route exists). **confirmed** (`server/routes/helix/time-dilation.ts:198-224, 252-457`) | Viability skill records traces with cert/integrity; many other skills do not emit equivalent proof packets. **confirmed+inferred** (`server/skills/physics.warp.viability.ts:295-323`) |

### Retrieval-only vs executable

- **Retrieval-heavy / explanation-first:** ideology references, docs evidence extraction, repo graph/lattice retrieval, warp ask narrative. **(confirmed)** (`configs/agent-map.json:11-21`; `server/skills/physics.warp.ask.ts:218-227`)
- **Executable with verification:** adapter GR loop and constraint-pack mode; warp viability certificate issuance. **(confirmed)** (`server/routes/agi.adapter.ts:462-653, 708-794`; `server/skills/physics.warp.viability.ts:254-334`)
- **Executable without tight proof gating by default:** panel control/time-dilation control endpoints; open panel commands in UI. **(confirmed + inferred)** (`server/routes/helix/time-dilation.ts:198-224`; `client/src/components/helix/HelixAskPill.tsx:2079-2099`)

---

## 4) Claim Maturity & Language Discipline

### Where discipline is good

- Warp ask system prompt forbids viability claims and invented numerics. **(confirmed)** (`server/skills/physics.warp.ask.ts:221-223`)
- Warp viability supplement explicitly constrains claim language to certificate payload and status. **(confirmed)** (`server/skills/physics.warp.viability.ts:216-223`)
- Repo guidance states atomic route is diagnostic, not certified simulation. **(confirmed)** (`docs/helix-ask-atomic-system-overview.md:16-18, 96-117`)

### Where discipline is weak or misaligned

- Client prompt builder says “Do not output ... certificates,” which can suppress the exact maturity artifacts users need. **(confirmed)** (`client/src/components/helix/HelixAskPill.tsx:805`)
- Debug fields expose many gate metrics, but the user-facing contract does not require mandatory maturity banner tied to those metrics. **(inferred)** (`client/src/lib/agi/api.ts:91-205`; `client/src/components/helix/HelixAskPill.tsx:2460-2522`)
- Adapter response schema type omits `certificate`, encouraging downstream codepaths that do not treat cert status as first-class. **(confirmed)** (`shared/schema.ts:2608-2618`; `server/routes/agi.adapter.ts:650, 792`)

---

## 5) Crossover Gap Inventory (Primary)

| Gap ID | Severity | Symptom | Root Cause | Evidence | User Impact | Recommended Change | Files to touch |
|---|---|---|---|---|---|---|---|
| UCX-001 | P0 | Adapter returns certificate, but typed response schema omits it. | Contract drift between runtime route and shared schema. | `server/routes/agi.adapter.ts` returns `certificate` (`643-652`, `784-794`), while `shared/schema.ts` `adapterRunResponseSchema` lacks it (`2608-2618`). | Clients/parsers can silently drop certification state; proof packet automation breaks. | Add `certificate` to `adapterRunResponseSchema` and client typings; enforce parity tests. | `shared/schema.ts`, `docs/ADAPTER-CONTRACT.md`, client adapter typings/tests |
| UCX-002 | P0 | Ask path can narrate action/proof but lacks unified action->gate envelope. | `PromptSpec`/`LocalCallSpec` separate intent from proof requirements; no single enforceable ask contract. | `shared/prompt-spec.ts:3-37`; `shared/local-call-spec.ts:31-38`; `server/routes/agi.plan.ts:25235-25274, 25702`. | High-confidence recommendations without guaranteed gate/cert packet continuity. | Introduce `proof_required` and `required_artifacts` in ask contract; enforce at `/plan` and `/execute` boundaries. | `shared/prompt-spec.ts`, `shared/local-call-spec.ts`, `server/routes/agi.plan.ts` |
| UCX-003 | P1 | UX templates can suppress certificate/gate visibility. | Prompt shaping prioritizes readability and omits operational proof artifacts. | `client/src/components/helix/HelixAskPill.tsx:805`. | Users may mistake polished prose for certified status. | Add “maturity + gate capsule” block always shown for physics/verification intents. | `client/src/components/helix/HelixAskPill.tsx`, `client/src/lib/agi/api.ts` |
| UCX-004 | P1 | Ideology references exist, but not mapped to mandatory tools/gates. | Ideology treated as retrieval/context signal, not execution policy graph. | Ideology cues and references in ask (`server/routes/agi.plan.ts:5206-5233, 17665-17675`); ideology tree branch structure (`docs/ethos/ideology.json:6-50`). | Normative guidance can be detached from operational constraints and proofs. | Create ideology branch policy map (branch -> required tool calls -> expected artifacts). | `docs/ethos/ideology.json`, `configs/agent-map.json`, `server/routes/agi.plan.ts` |
| UCX-005 | P1 | Movement/proof traces are emitted in adapter but not consistently surfaced in Ask responses. | Trace model richer than Ask response envelope contract. | Trace payload supports movement episodes (`shared/schema.ts:2440-2468`); adapter writes movement traces (`server/routes/agi.adapter.ts:739-781`); ask response lacks explicit proof packet fields (`client/src/lib/agi/api.ts:74-205`). | Provenance continuity breaks between execution and conversational layers. | Extend Ask response envelope with optional `proof_packet` + `trace_refs` contract. | `shared/helix-ask-envelope*`, `client/src/lib/agi/api.ts`, `server/routes/agi.plan.ts` |
| UCX-006 | P1 | Panel/control actions can execute without hard gate coupling. | Control routes are operational endpoints independent of universal gate policy. | Time dilation control and activate endpoints (`server/routes/helix/time-dilation.ts:198-224, 252-457`). | Observe/act features may be used without verification loop discipline. | Add optional policy middleware requiring gate context for high-impact controls. | `server/routes/helix/time-dilation.ts`, shared policy middleware |
| UCX-007 | P2 | Agent-map tool allowlists are broad and not maturity-aware. | Role tooling not tied to ladder tier or proof obligations. | `configs/agent-map.json:5-21`; maturity tiers exist elsewhere (`shared/schema.ts:1362`). | Inconsistent behavior by persona/agent under same risk profile. | Add maturity tier policy and proof obligations per agent profile. | `configs/agent-map.json`, planner agent-map service |
| UCX-008 | P2 | Business model promises executable constraints/provenance, but some ask flows remain explain-only. | Product claims exceed current guaranteed execution coupling. | Promise statements (`docs/BUSINESS_MODEL.md:41-47, 82-97`), ask execution variability (`server/routes/agi.plan.ts:25235-25274`). | Trust gap between platform narrative and operator experience. | Define “explain-only” vs “verified-act” response modes in UI and API. | `docs/BUSINESS_MODEL.md`, ask contract + UI badges |

---

## 6) Ideology ↔ Tool ↔ Gate Alignment

### Proposed alignment map

| Ideology branch (example) | Required tools | Required constraints/gates | Required proof artifacts |
|---|---|---|---|
| `verification-based-diplomacy` | `physics.warp.viability`, `physics.gr.grounding`, adapter run | HARD constraints pass + admissible status policy | `verdict`, `firstFail`, `certificateHash`, `integrityOk`, trace export ref |
| `metric-integrity-guardrail` | panel telemetry + constraint-pack evaluator | evidence + coverage + belief + pack gates | gate metrics, pack notes, policy profile id, training trace id |
| `no-bypass-guardrail` | control endpoints + policy middleware | block unsafe actuation/control w/o gate context | veto reason, blocked action id, trace entry |
| `interbeing-systems` | repo graph + dependency walk + adapter premeditation | dependency coherence + uncertainty bound + safety gate | candidate scores, optimism/entropy, chosen path, replay seed |

**Current state:** ideology tree is rich, but this mapping is mostly not encoded in runtime policy. **(inferred)** (`docs/ethos/ideology.json:154-199`; `server/routes/agi.plan.ts:5206-5233`; `server/routes/agi.adapter.ts:678-781`)

---

## 7) Proof Packet Readiness

### Required fields coverage

| Field | Status | Notes |
|---|---|---|
| `verdict` | ✅ confirmed | Adapter responses include it in both pack and GR paths. (`server/routes/agi.adapter.ts:646-647, 787-788`) |
| `firstFail` | ✅ confirmed | Included when available and recorded in traces. (`server/routes/agi.adapter.ts:648-649, 789`) |
| `certificateHash` | ⚠️ partial | Runtime returns certificate hashes; shared adapter response type currently omits certificate object. (`server/routes/agi.adapter.ts:640-641, 735-736`; `shared/schema.ts:2608-2618`) |
| `integrityOk` | ⚠️ partial | Present in certificates/traces, but not guaranteed to be surfaced in all ask-facing contracts. (`shared/schema.ts:2396-2401`; `server/skills/physics.warp.viability.ts:317-321`) |
| `artifacts` | ✅ confirmed | Adapter emits run/trace/certificate refs. (`server/routes/agi.adapter.ts:256-300, 637-652`) |
| `trace refs` | ⚠️ partial | Adapter includes trace refs; Ask response types do not uniformly carry proof packet refs. (`server/routes/agi.adapter.ts:283-286`; `client/src/lib/agi/api.ts:74-205`) |

Overall readiness: **medium** (strong backend primitives, weak cross-surface contract strictness).

---

## 8) Risk Register

### Fail-open risks

- **R-FO-1:** Non-proof ask outputs can sound definitive without enforced gate packet inclusion. **(inferred)** (`server/routes/agi.plan.ts:25235-25274`; `client/src/components/helix/HelixAskPill.tsx:805`)
- **R-FO-2:** Control routes accept commands independently of explicit verification handshake. **(confirmed)** (`server/routes/helix/time-dilation.ts:198-224`)

### False-certainty risks

- **R-FC-1:** Certificate data exists but is not always shown due UI/prompt suppression. **(confirmed)** (`client/src/components/helix/HelixAskPill.tsx:805`)
- **R-FC-2:** Schema drift can mislead typed clients about certification availability. **(confirmed)** (`shared/schema.ts:2608-2618`; `server/routes/agi.adapter.ts:650, 792`)

### Provenance gaps

- **R-PV-1:** Rich provenance in specialized physics paths is not normalized into universal ask envelope. **(confirmed + inferred)** (`server/skills/physics.curvature.ts:674-763, 806-819`; `client/src/lib/agi/api.ts:74-205`)

---

## 9) Remediation Program

## Phase 1 — Contract Integrity (P0)

Scope:
- Fix adapter response schema parity (`certificate` object + integrity fields).
- Add contract tests ensuring runtime JSON matches shared schema and docs.

Acceptance criteria:
- `adapterRunResponseSchema` validates real route payloads for both constraint-pack and GR paths.
- CI fails on response drift.
- PASS verification run returns typed `certificateHash` + `integrityOk`.

Measurable outcomes:
- 0 schema/runtime mismatches in adapter snapshots.
- 100% adapter responses include parseable proof capsule when certificate exists.

## Phase 2 — Universal Ask Proof Capsule (P1)

Scope:
- Add optional `proof_packet` to ask response envelope with: verdict, firstFail, certificate, artifacts, trace refs, maturity tier.
- UI displays mandatory maturity+gate capsule for physics/verification intents.

Acceptance criteria:
- For verification-intent asks, UI always shows maturity tier + certification status.
- User cannot receive “high-confidence” style without adjacent gate status indicator.

Measurable outcomes:
- 90%+ of verification-intent asks include visible proof capsule.
- Reduced operator confusion incidents (qualitative support metric).

## Phase 3 — Ideology Policy Binding & Action Governance (P1/P2)

Scope:
- Encode ideology branch policy map (required tools/gates/artifacts).
- Enforce policy checks before high-impact actions and control commands.

Acceptance criteria:
- Actions under selected ideology branches fail closed when required proofs are absent.
- Branch-to-artifact matrix is machine-readable and tested.

Measurable outcomes:
- 100% policy-covered branches emit required artifacts.
- Reduction in ungated action executions.

---

## 10) Top 3 PRs to Start Immediately

1. **PR-1 (P0): Adapter Contract Parity Hardening**
   - Add `certificate` field to `adapterRunResponseSchema`; add parity tests and docs sync.
   - Touch: `shared/schema.ts`, adapter tests, `docs/ADAPTER-CONTRACT.md`.

2. **PR-2 (P1): Helix Ask Proof Capsule + UI Maturity Banner**
   - Extend ask envelope and client rendering to always show proof state for verification intents.
   - Touch: ask response schema/types, `server/routes/agi.plan.ts`, `client/src/lib/agi/api.ts`, `client/src/components/helix/HelixAskPill.tsx`.

3. **PR-3 (P1): Ideology Branch Execution Policy Map**
   - Add explicit mapping from ideology branches to mandatory tools/gates/artifacts and enforce preflight checks.
   - Touch: `docs/ethos/ideology.json` (or companion policy file), `server/routes/agi.plan.ts`, agent policy loader.

---

## 11) Open Questions / Unknowns

1. Should `proof_packet` be mandatory for all asks or only intent classes (warp/physics/control)? **(hypothesis)**
2. Is there an existing canonical `HelixAskResponseEnvelope` extension path for proof capsules, or should this live beside `debug`? **(hypothesis)**
3. How should multi-tool composite proofs (e.g., warp viability + GR grounding + panel telemetry) be signed as one integrity unit? **(hypothesis)**
4. Do we require tenant-scoped signing keys for certificate verification in multi-tenant deployments? **(hypothesis)**
5. Should UI ever hide certificates/logs by default if maturity policy indicates “diagnostic only”? **(hypothesis)**

---

## Classification Legend

- **confirmed** = directly evidenced in repository docs/code.
- **inferred** = logically concluded from confirmed evidence, but not explicitly encoded.
- **hypothesis** = unresolved/ambiguous; requires implementation or additional evidence.
