# Helix Ask / Codex Parity Work Program v1

Status: canonical program-control document.

Active program gate: **G1**

## Program outcome

Make Helix Ask a transparent, governed projection of a real Codex-owned turn:

- Codex owns model sampling, generic tool execution, observation re-entry,
  retries, approvals, sandboxing, compaction, session lifecycle, subagents, and
  completion of the reasoning turn.
- Helix owns identity and permission policy, source and capability admission,
  evidence identity and provenance, proof gates, route/product contracts,
  terminal eligibility, and the public debug trace.
- Every response identifies the runtime path that actually handled it. A
  compatibility fallback may not silently present itself as native parity.
- The operator can inspect the complete public lifecycle—requests, admissions,
  calls, observations, retries, budget decisions, candidate support, and
  terminal selection—without exposing or fabricating private chain of thought.
- No executable Ask behavior remains reachable only through an unclassified
  legacy branch in `server/routes/agi.plan.ts` or the legacy
  `HelixAskPill.tsx` bridge.

The desired end state is not an unconstrained or literally endless loop. It is
a progress-based Codex turn whose limits are explicit, configurable, observable,
and equivalent across supported surfaces. Safety, cost, timeout, and context
limits remain legitimate when they are declared and produce typed outcomes.

## Scope and non-goals

This program governs Helix Ask runtime parity, trace fidelity, compatibility
fallbacks, backend monolith detachment, and frontend ReCrown completion. It does
not replace:

- `docs/architecture/helix-ask-canonical-turn-lifecycle.md`, which owns the
  canonical event sequence and authority matrix;
- `docs/helix-ask-codex-loop-discipline.md`, which owns patch-time discipline;
- `docs/helix-environment-harness-work-program-v1.md`, which alone owns the
  environment-harness active gate and capability maturity;
- `docs/helix-ask-route-extraction-ledger.md`, which records individual backend
  extraction slices; or
- dated audits and run artifacts, which remain immutable evidence snapshots.

Explicit non-goals:

- Do not expose, infer, or manufacture model-private chain of thought.
- Do not build a private Helix sampling, tool-execution, retry, compaction,
  subagent, or terminal-completion runtime.
- Do not remove evidence, permission, provenance, proof, or terminal gates in
  the name of parity.
- Do not delete a legacy path until its activation predicate, replacement, and
  parity evidence are known.
- Do not fork or embed a local Codex repository merely because the current
  adapter is incomplete. The local checkout is a read-only reference until the
  final decision gate proves a fork is necessary.
- Do not treat a passing deterministic test as keyed provider acceptance, or a
  direct Codex success as Helix acceptance.

## Source-of-truth map

| Question | Sole authority |
| --- | --- |
| What gate is active and what evidence advances this effort? | this document |
| What is the canonical Ask event sequence and authority split? | `docs/architecture/helix-ask-canonical-turn-lifecycle.md` |
| What may Helix implement around the Codex loop? | `docs/helix-ask-codex-loop-discipline.md` and `docs/helix-ask-turn-solver-spine.md` |
| What must the Ask API and terminal product expose? | `docs/helix-ask-api-parity-matrix.md` |
| How is the first divergent lifecycle stage found? | `docs/helix-ask-readiness-debug-loop.md` |
| What backend extraction slice is stable or pending? | `docs/helix-ask-route-extraction-ledger.md` |
| What workstation provider surface is wired? | `docs/helix-ask-codex-workstation-release-readiness.md` |
| What environment capability maturity or gate is current? | `docs/helix-environment-harness-work-program-v1.md` |
| What happened in one run? | its immutable audit and exact artifacts |

## Program closure states

These terms describe closure of this parity program only. They are not the
environment-harness capability-maturity vocabulary.

1. `unclassified`
2. `inventoried`
3. `lifecycle-observable`
4. `deterministically parity-proven`
5. `keyed parity-proven`
6. `default-path adopted`
7. `legacy-retired`

No component inherits a later state from a neighboring component or from an
aggregate suite result.

## Dependency order

```text
G0 authority inventory and trapdoor disposition
  -> G1 truthful runtime identity and complete public trace
  -> G2 same-state Codex / MCP / Helix differential baseline
  -> G3 first-divergence and provider-family closure
  -> G4 runtime convergence and fallback confinement
  -> G5 backend monolith detachment
  -> G6 frontend ReCrown and legacy-bridge retirement
  -> G7 release evaluation and local-Codex decision
```

The order is deliberate. A parity result is not trustworthy until the actual
runtime path and full public lifecycle are observable. Deletion is unsafe until
equivalent replacement behavior has been proven.

## Program gates

| Gate | State | Depends on | Closure evidence | Unlocks |
| --- | --- | --- | --- | --- |
| G0 — Authority inventory and trapdoor disposition | closed | none | `docs/audits/helix-ask-codex-parity-g0-closure-audit-2026-08-26.md` | G1 |
| G1 — Truthful runtime identity and complete public trace | **active** | G0 | API and UI expose the actual native/fallback runtime, downgrade reason, budgets, and a complete pageable public lifecycle with stable event references; presentation truncation is distinguishable from execution limits. | G2 |
| G2 — Differential parity baseline | blocked | G1 | Same prompt, state, permissions, source identity, and acceptance criteria are run through reference Codex, authenticated Codex-through-MCP, native Helix, and any retained compatibility path; the observer reports the first divergent lifecycle stage. | G3 |
| G3 — First-divergence and provider-family closure | blocked | G2 | Each observed mismatch is fixed at its first divergent stage. The 298-case provider suite is bucketed, and scholarly, Image Lens, translation, calculator-recovery, and timeout failures have exact dispositions and targeted evidence. | G4 |
| G4 — Runtime convergence and fallback confinement | blocked | G3 | Native Codex is the parity-bearing path; any retained `codex exec` compatibility path is explicitly degraded, isolated, and unable to claim native parity. Progress-based continuation replaces unexplained fixed-step behavior, with explicit hard ceilings and typed exhaustion. | G5 |
| G5 — Backend monolith detachment | blocked | G4 | `/api/agi` routes are thin parsing/auth/dispatch shells; `agi.plan.ts` no longer owns Ask sampling, execution, re-entry, retry, answer writing, or hidden fallback authority. Every removal is recorded in the extraction ledger and protected by parity tests. | G6 |
| G6 — Frontend ReCrown and legacy-bridge retirement | blocked | G5 | The recrowned console is the active default, all behavior-sensitive slices have parity evidence, quarantines have explicit outcomes, the unknown-trapdoor count is zero, and the legacy bridge is unreachable before deletion. | G7 |
| G7 — Release evaluation and local-Codex decision | blocked | G6 | Contract and variety batteries, keyed A/B traces, runtime identity, full public trace, cross-surface terminal hashes, and representative pass/fail evidence meet release thresholds. A written decision records whether MCP/app-server is sufficient or a local Codex change is necessary. | release decision |

Exactly one gate is active. Work in a later gate is permitted only when it is
declared as a non-perturbing parallel investigation and cannot assume an open
prerequisite has passed.

## Closed gate G0: authority inventory and trapdoor disposition

### Goal

Produce a falsifiable, repository-pinned map of what can execute today. This is
the prerequisite for deciding whether Helix is actually detached from the
monolith and whether a displayed 15-step narrative reflects execution,
presentation truncation, or a compatibility cap.

### Required inventory

For every reachable Ask path, record:

- entry point and activation predicate;
- lifecycle stage and authority owner;
- native Codex, authenticated MCP, compatibility `codex exec`, deterministic
  policy fallback, legacy frontend, or presentation-only classification;
- model/tool catalog, configuration isolation, timeout, output, continuation,
  context, and presentation limits;
- authoritative event source and terminal writer;
- deterministic and keyed evidence already available;
- disposition: retain, replace, quarantine, or remove; and
- the downstream gate responsible for that disposition.

The minimum inventory includes:

- `server/routes/agi.plan.ts` and all mounted `/api/agi` Ask entry points;
- `server/services/helix-ask/`, including native app-server and compatibility
  provider branches;
- deterministic policy fallbacks and older runtime branches;
- `client/src/components/helix/HelixAskPill.tsx` and the ReCrown inventory;
- debug trace projection, timeline pagination/truncation, and terminal
  materialization; and
- environment capability routing only to the extent needed to identify the Ask
  runtime boundary. Environment maturity remains owned by its G8 program.

### G0 closure criteria

G0 closes only when:

1. every reachable executable path has one activation predicate and authority
   owner;
2. runtime limits and UI display limits are separately identified;
3. every fallback emits a stable path identity and reason, or has an explicit
   G1 repair item;
4. every known legacy branch has a retain/replace/quarantine/remove disposition;
5. the ReCrown inventory reports zero `unknown trapdoor` entries;
6. no path is deleted or declared detached solely because its mainline call was
   moved to a service; and
7. the inventory is checked by focused static tests so path drift fails visibly.

### G0 stop/fail criteria

- A path can execute but its predicate or terminal writer cannot be identified.
- Native and compatibility results cannot be distinguished in stored evidence.
- A proposed removal depends on an untested behavior-sensitive legacy branch.
- An inventory claim relies only on line numbers rather than stable symbols,
  tests, or artifact hashes.

G0 does not authorize refactoring the runtime, raising limits, deleting legacy
code, or changing terminal behavior. Those actions belong to later gates.

G0 closed on 2026-08-26. Its exact closure evidence is recorded in
`docs/audits/helix-ask-codex-parity-g0-closure-audit-2026-08-26.md`.

## Active gate G1: truthful runtime identity and complete public trace

### Goal

Make every Ask result and debug export state which runtime path actually handled
the turn and expose the complete public lifecycle without confusing UI
truncation with execution completion.

### Work permitted

- Define one stable runtime-path identity contract covering authenticated MCP,
  native Codex app-server, compatibility `codex exec`, native Helix, future
  provider, client transport retry, and legacy route handling.
- Emit the selected path, attempted paths, downgrade reason, effective model
  policy, time/output/continuation budgets, and exhaustion state into canonical
  lifecycle/debug evidence.
- Preserve the same runtime identity through API JSON, SSE final payload,
  debug export, client reply state, and operator-visible status.
- Replace first-12/first-18 silent timeline truncation with an explicit count,
  truncation marker, and pageable or expandable access to every public event.
- Prove JSON-after-SSE fallback is bound to the same turn and cannot duplicate a
  physical or workstation effect.
- Add poisoned-projection tests showing that stale client or legacy debug state
  cannot relabel native output as compatibility or vice versa.

### Required evidence to close G1

1. Every terminal response exposes one actual runtime path plus attempted path
   history and a typed downgrade reason when applicable.
2. Native, compatibility, native-Helix, future, legacy-route, and transport
   fallback identities survive API, SSE, debug export, and UI projection.
3. Runtime budgets and presentation limits are separate typed fields.
4. The complete public lifecycle is retrievable with stable event IDs; any
   visible subset declares total count and truncation/pagination state.
5. Stream-to-JSON retry preserves the same turn identity and produces zero
   duplicate effects in deterministic fixtures.
6. Focused runtime-path, debug-export, stream, terminal-parity, and client
   projection tests pass.
7. One keyed native turn and one deliberately induced compatibility turn expose
   truthful, distinguishable paths with matching visible terminal hashes. If no
   suitable keyed server is available, G1 remains open.

### Current G1 progress (2026-08-26)

Implementation and deterministic evidence are recorded in
`docs/audits/helix-ask-codex-parity-g1-progress-audit-2026-08-26.md` and the
follow-on immutable packet
`docs/audits/helix-ask-codex-parity-g1-runtime-transport-evidence-2026-08-26.md`.
The latest requirement-by-requirement audit is
`docs/audits/helix-ask-codex-parity-g1-deterministic-closure-readiness-2026-08-26.md`.

- The canonical runtime identity, attempted-path history, downgrade, effective
  model policy, runtime budgets, and presentation-limit distinction are now
  projected at the provider response boundary and legacy response/debug-export
  boundaries.
- Runtime identity v2 separates execution path from API transport/history, so
  SSE, JSON replay, authenticated MCP, and legacy bridging cannot relabel the
  engine that executed the turn. Pre-runtime failures state that no engine ran.
- The public lifecycle projection declares total count, stable event IDs,
  default visible count, and presentation truncation. The legacy console now
  prefers canonical transcript events, no longer caps runtime iterations at 12,
  reads the server-declared visible limit, and exposes overflow rows. A bounded
  lifecycle endpoint pages the complete canonical event sequence with stable
  IDs and session-mismatch rejection.
- Completed SSE turns are cached by turn ID plus a session-and-prompt
  fingerprint at the completion boundary. An in-flight execution claim now
  closes the race before provider or tool execution begins. After access
  checks, same-identity JSON fallback either waits on the original execution or
  replays its completed payload and reports zero duplicate executions in the
  deterministic route fixtures.
- Native Codex public protocol events are retained in the final canonical
  transcript rather than existing only as transient SSE notifications. A
  37-event fixture proves there is no 15-event projection cap; stable IDs are
  deduplicated and the terminal event remains last. This is public lifecycle
  evidence, not private chain of thought.
- The universal JSON and SSE terminal boundaries now stamp early policy and
  admission failures as `pre_runtime_policy_boundary`, so a rejected request
  cannot falsely claim that Helix or Codex executed it. Future-provider failures
  likewise report a failed attempted path and typed reason instead of a
  completed attempt.
- Focused G1 runtime/route/replay/client tests pass, as do the declared quick
  discipline guard, the 12 selected terminal-rejection parity cases, and the
  terminal-equivalence cases in split runs. The full API parity matrix again did
  not complete within the observed run window and was interrupted without
  verdict.
- The newest terminal-equivalence rerun was rejected before solver execution by
  the enabled memory governor (`host_memory_limit`) in two production-estimate
  attempts and one 1 MiB fake-workload estimate attempt. That is an
  environmental no-verdict caused by the host-free threshold; the other five
  pure harness cases and the earlier bounded-reservation route case pass.
- G1 remains **active**. The existing local server on port 1522 reports Codex as
  launchable but runs build `4ba5f51a067a7938f72f68d4877db1bab2db434e`,
  which does not contain this projection, and the keyed canary failed closed as
  `openai_api_credits_exhausted`. Native and deliberately induced compatibility
  evidence must be rerun on a suitable keyed server containing this patch.

### Explicit non-goals

- Do not lift runtime limits merely to make the trace longer.
- Do not export private chain of thought.
- Do not remove compatibility or legacy paths in G1.
- Do not begin same-state capability parity repairs assigned to G2/G3.
- Do not promote environment-harness maturity from Ask trace evidence alone.

### Stop/fail criteria

- A terminal response can omit or misstate the actual runtime path.
- A fallback reason exists only in logs or a noncanonical side record.
- UI truncation can still look like runtime completion.
- JSON retry can execute a second effect for the same admitted turn.
- Keyed native and compatibility paths cannot be distinguished without reading
  secrets, process command lines, or private reasoning.

## Falsifiable parity method

For each representative capability, freeze the prompt, initial state, account,
permissions, source identity, tool catalog, and acceptance criteria. Capture:

```text
request -> admission -> execution -> normalization -> evidence re-entry
        -> follow-up reasoning -> materialization -> terminal eligibility
        -> presentation
```

Compare these paths when available:

- A0: direct capability or environment feasibility oracle;
- A1: authenticated Codex through the Helix MCP boundary;
- B-native: keyed Helix Ask using native Codex app-server;
- B-compat: the retained compatibility path, labeled as such.

The comparison reports the first divergent stage, not merely answer similarity.
Required public evidence includes runtime-path identity, admitted and executed
capabilities, observations and re-entry references, retry causes, budgets,
candidate text hashes and support references, terminal decision, and visible
text hash. Private reasoning is neither requested nor used as evidence.

Run keyed tests only against the user-configured keyed server. If no suitable
server is running, report deterministic results and `no keyed run` separately.
Run one heavy live suite at a time.

## Provider-suite disposition rule

The current reported result, 276/298 with 22 failures, is a baseline—not a
release verdict and not evidence that the failures are unrelated. Each failure
must be assigned to its first divergent lifecycle stage and one of:

- product defect;
- provider or fixture defect;
- unsupported capability with a typed failure contract;
- stale expectation; or
- nondeterministic infrastructure requiring a bounded rerun.

Scholarly, Image Lens, and translation cases remain open until their buckets
have targeted evidence. Aggregate percentage alone cannot close G3.

## Local Codex repository decision rule

The default architectural target is the authenticated MCP/native app-server
boundary, not a permanent local Codex fork. G7 may recommend a local Codex
change only if G2–G4 evidence demonstrates all of the following:

1. the missing behavior belongs to Codex-owned runtime semantics rather than a
   Helix admission, adapter, evidence, terminal, or presentation defect;
2. MCP or the native app-server cannot expose the required supported behavior;
3. configuration, catalog refresh, adapter repair, or an upstream extension
   cannot close the gap; and
4. the ownership, update, security, and parity costs of a maintained fork are
   explicitly accepted.

Until then, `external/openai-codex-compare` remains read-only comparison
material and must not become a hidden production dependency.

## Relationship to environment-harness G8

This program may provide the truthful runtime identity and public event trace
needed by operator-visible Codex steering. It cannot close environment G8,
promote an environment capability, or replace adapter-specific evidence. An
environment work packet continues to use the maturity vocabulary, task header,
and evidence rules in `docs/helix-environment-harness-work-program-v1.md`.

## Required work-packet header

Every development packet governed by this program begins with:

```text
Program gate:
Workstream:
Capability or component:
Change classification:
Runtime owner:
Current closure state:
Target closure state:
Required frozen inputs:
Required evidence:
Stop/fail criteria:
Explicit non-goals:
Downstream gate unlocked:
```

`Change classification` must be one of: prompt interpretation, intent
arbitration, source admission, tool admission, evidence normalization, evidence
re-entry, follow-up reasoning, terminal authority, presentation, or Codex-owned
runtime behavior.

## Progress discipline

- Read this program, the active-gate section, and the loop-discipline contract
  before modifying a Helix Ask-sensitive surface.
- Update only the active gate from new evidence. Dated audits stay immutable.
- A test name or implementation presence is not acceptance evidence.
- Every failure report names the first divergent lifecycle stage or explicitly
  records that the stage is not yet observable.
- Every completion report separates deterministic, keyed, and skipped evidence.
- Use `npm run helix:ask:discipline:quick` for changed-file classification and
  shortcut-risk scanning, then run the narrow contract test for the changed
  lifecycle stage. Use the full discipline suite only for live-source identity
  or continuation changes.
- Casimir verification is not required for documentation-only or ordinary
  non-physics parity work. It remains mandatory when a patch enters its defined
  warp/GR, adapter, certificate, training-trace, or proof-maturity scope.
