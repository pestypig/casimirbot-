# Essence Console Gap Report

Audit date: 2025-03-09. Scope: Essence console workflow (plan → execute → trace → memory → observability) versus the “Plan in Essence → Codex patch → re-validate” loop.

| # | Capability | Status | Evidence | Why it matters | Patch pointer |
|---|------------|--------|----------|----------------|---------------|
| 1 | Routing & health (plan/execute/trace/SSE) | ⚠️ Partial | `server/routes/agi.plan.ts:174-366` exposes `/plan`, `/execute`, `/tools/logs(/stream)`; `server/routes/agi.trace.ts:4-37` only returns raw traces; `server/db/agi.ts:115-146` **omits `knowledge_context` in the SELECT**, so attachments disappear after persistence. | Trace + SSE exist, but attachments silently vanish once `planRecords` are evicted, so Codex can’t reopen a trace with its evidence. | PR-EC1 (Trace export) will add a full export route and fix the DB select. |
| 2 | Trace → export for Codex | ❌ Missing | `client/src/components/agi/TraceDrawer.tsx:49-210` renders trace rows, but there is no download/copy; server side lacks any `/trace/:id/export` route. | Without an export payload, Codex cannot ingest the approved plan/manifest that the operator just scoped. | PR-EC1. |
| 3 | Policy / safety reasoning surfaced | ❌ Missing | `server/services/planner/chat-b.ts:526-563` records approval `reason` strings, but `/api/agi/trace/:id` never includes them and `TraceDrawer` rows (`client/src/components/agi/TraceDrawer.tsx:117-183`) only display `error`. | Hull/approval denials show up as generic failures, so the operator can’t tell why a tool was blocked or which risk was invoked. | PR-EC2. |
| 4 | Repo-aware skills (search/diff/patch) | ❌ Missing | `server/routes/agi.plan.ts:193-247` only registers llm/luma/stt/curvature tools; `rg -n "repo\\." server/skills` returns no hits. | Essence can’t reason about repo state directly; every patch request must leave the system or be hand-simulated. | PR-EC4 will add stubbed `repo.search`, `repo.diff.review`, `repo.patch.simulate` with approvals + Essence envelopes. |
| 5 | Eval loop after Codex edits | ⚠️ Partial | UI exposes only a blunt “Run smoke eval” button (`client/src/components/agi/EvalPanel.tsx:6-52`) calling `/api/agi/eval/smoke` (`server/routes/agi.eval.ts:8-45`). There is no way to bind an eval run to a trace or Essence envelope. | After Codex lands a patch you cannot tag the run, capture metrics, or tie the smoke result back to the originating trace. | PR-EC3 introduces `/api/agi/eval/replay` + “Verify patch” flow. |
| 6 | Knowledge / citation guard rails | ❌ Missing | Knowledge payloads are only MIME/size validated (`server/routes/agi.plan.ts:73-145`). There is no citation check or retry when planner output lacks `citations` despite attachments (`server/services/planner/chat-b.ts:330-450`). | Attachments can be ignored with no escalation; Codex receives plans without evidence references. | PR-EC5 adds `knowledge/citations.ts` verifier + retry. |
| 7 | Hull / runtime status strip in console | ❌ Missing | Console header (`client/src/components/agi/essence.tsx:205-242`) shows persona + context meter only; there is no indicator for `HULL_MODE`, LLM policy, queue depth, or flag drift. | Operators have to drop to env introspection to confirm offline posture before approving tool use. | PR-EC6 adds `/api/hull/status` + header chip. |
| 8 | NoiseGen & Luma provenance surfaced | ⚠️ Partial | Planner registers `luma.generate` (`server/routes/agi.plan.ts:203-208`) but no `noise.gen.*` tools; `TraceDrawer` just shows generic Essence links and no per-tool badges. | Creative adapters run outside the tracked path; Codex can’t tell whether a media asset already collapsed to Essence or if NoiseGen ever ran. | PR-EC7 (polish) will register `noise.gen.cover` + add Trace badges. |
| 9 | Metrics coverage for knowledge + repo ops | ❌ Missing | `server/metrics/index.ts:5-150` emits task/tool/LLM counters only; no `knowledge_attach_*`, `trace_export_*`, or repo-tool metrics. | Can’t prove Hull posture or reason about attachment usage in Prometheus/Essence console. | PR-EC1/EC4/EC6 tie-ins. |
| 10 | Debate SSE verdict fidelity | ⚠️ Partial | Debate SSE delivers refs (`client/src/lib/agi/api.ts:115-188`), and `DebateView` renders citations for proponent/skeptic turns (`client/src/components/agi/DebateView.tsx:340-386`), but `RefereeCard` omits citations/essence links even though payload supports them. | Reviewers can’t audit which Essence envelope supported the referee verdict, undermining provenance. | PR-EC7 follow-up. |
| 11 | Tokenizer registry + canary | Missing | docs/tokenizer-guardrails.md not checked into repo; 	ools/tokenizer-verify.ts / canary tests do not exist. | GGUF swaps can change token counts + truncation boundaries with zero visibility, so Hull posture + Codex traces drift silently. | PR-EC8. |

## Highlights

- Highest risk gaps: **Trace export**, **policy reasoning**, **eval replay**. Without them Codex cannot inherit provenance or prove a patch passed evals.
- Knowledge context is persisted but never selected, so reopening old traces loses evidence until PR-EC1 lands.
- Hull posture remains invisible in the console; PR-EC6 must introduce a `/api/hull/status` endpoint and status chip.

## Immediate next steps

1. Implement PR-EC1…PR-EC3 (details in `docs/ESSENCE-CONSOLE_PATCH-PLAN.md`) behind the new env gates: `ENABLE_TRACE_EXPORT`, `ENABLE_POLICY_REASONS`, `ENABLE_EVAL_REPLAY`.
2. Add Prometheus counters for trace exports, repo tools, and eval replays so Hull posture is observable.
3. Backfill Vitest coverage for the new APIs (trace export payload, policy reason propagation, eval replay contract).

