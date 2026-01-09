# Essence Console Patch Plan

All work must stay additive and env-gated. Priorities follow the required order: trace export → policy surfacing → eval replay → repo tool stubs → citation verification → Hull status chip → creative tool polish.

## PR-EC1 — Trace export + knowledge persistence

- **Problem**: `/api/agi/trace/:id` is the only endpoint and it silently drops `knowledge_context` once traces leave memory (see `server/db/agi.ts:115-146`). TraceDrawer has no way to export a manifest for Codex.
- **Minimal fix**:
  1. Persist + hydrate `knowledge_context` from Postgres.
  2. Add `GET /api/agi/trace/:id/export` (gated by `ENABLE_TRACE_EXPORT`) that returns `{ trace, plan, executor_steps, tool_manifest, knowledge_context, env }`.
  3. Add `POST /api/agi/trace/:id/export`? not needed.
  4. Wire a “Export trace JSON” button in `TraceDrawer`, add Prometheus counter `trace_export_total`, and expose a `copy to clipboard` helper.
- **Files touched**: `server/db/agi.ts`, `server/routes/agi.trace.ts`, `server/metrics/index.ts`, `client/src/components/agi/TraceDrawer.tsx`, new `tests/trace-export.spec.ts`.
- **Env gate(s)**: `ENABLE_TRACE_EXPORT=1` required for the new route/button.
- **Acceptance**:
  - `ENABLE_TRACE_EXPORT=1 pnpm vitest run tests/trace-export.spec.ts`.
  - `curl -H "Accept: application/json" /api/agi/trace/<id>/export` returns manifest+knowledge_context.
  - TraceDrawer shows “Export trace JSON” and downloads exactly what the API returned.

```diff
--- a/server/db/agi.ts
+++ b/server/db/agi.ts
@@
-      SELECT id, persona_id, goal, created_at, plan_json, steps, approvals, result_summary, ok
+      SELECT id, persona_id, goal, created_at, plan_json, steps, approvals, result_summary, ok, knowledge_context
       FROM task_trace
@@
-    knowledgeContext: Array.isArray(row.knowledge_context) ? (row.knowledge_context as any[]) : undefined,
+    knowledgeContext: Array.isArray(row.knowledge_context) ? (row.knowledge_context as any[]) : undefined,
```

```diff
--- a/server/routes/agi.trace.ts
+++ b/server/routes/agi.trace.ts
@@
-traceRouter.get("/:id", async (req, res) => {
+const exportEnabled = () => process.env.ENABLE_TRACE_EXPORT === "1";
+
+traceRouter.get("/:id", async (req, res) => {
@@
 });
+
+traceRouter.get("/:id/export", async (req, res) => {
+  if (!exportEnabled()) {
+    return res.status(404).json({ error: "export_disabled" });
+  }
+  const id = req.params.id?.trim();
+  if (!id) {
+    return res.status(400).json({ error: "bad_request", message: "id required" });
+  }
+  const trace = await loadTraceOr404(id, req, res);
+  if (!trace) return;
+  const record = (await import("../services/planner/chat-b")) as any;
+  const manifest = record.__getManifest?.(id) ?? [];
+  res.json({
+    trace,
+    plan: trace.plan_json ?? [],
+    executor_steps: trace.steps ?? [],
+    tool_manifest: manifest,
+    knowledge_context: trace.knowledgeContext ?? [],
+    env: {
+      hull_mode: process.env.HULL_MODE === "1",
+      llm_policy: process.env.LLM_POLICY ?? "remote",
+    },
+  });
+});
```

```diff
--- a/client/src/components/agi/TraceDrawer.tsx
+++ b/client/src/components/agi/TraceDrawer.tsx
@@
-      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
+      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
         <div className="flex flex-col">
           <span className="font-semibold">Task Trace</span>
           {trace?.goal && <span className="text-[11px] opacity-70 truncate max-w-[280px]">{trace.goal}</span>}
         </div>
-        <button className="text-xs opacity-70 hover:opacity-100 underline" onClick={onClose}>
-          close
-        </button>
+        <div className="flex items-center gap-3">
+          {traceId && isFlagEnabled("ENABLE_TRACE_EXPORT") && (
+            <button className="text-xs underline" onClick={() => void exportTrace(traceId)}>
+              Export JSON
+            </button>
+          )}
+          <button className="text-xs opacity-70 hover:opacity-100 underline" onClick={onClose}>
+            close
+          </button>
+        </div>
       </div>
```

```diff
--- /dev/null
+++ b/tests/trace-export.spec.ts
@@
+import { describe, expect, it } from "vitest";
+import request from "supertest";
+import app from "../server/index";
+
+describe("trace export", () => {
+  it("returns manifest + knowledge context when ENABLE_TRACE_EXPORT=1", async () => {
+    process.env.ENABLE_TRACE_EXPORT = "1";
+    const traceId = await seedTraceWithKnowledge();
+    const res = await request(app).get(`/api/agi/trace/${traceId}/export`);
+    expect(res.status).toBe(200);
+    expect(res.body.knowledge_context).toHaveLength(1);
+    expect(Array.isArray(res.body.tool_manifest)).toBe(true);
+  });
+});
```

## PR-EC2 — Policy / hull reasons surfaced in TraceDrawer

- **Problem**: Approval reasons captured in `ensureToolApprovals` never travel back to the UI, so the operator simply sees “Task failed.”
- **Minimal fix**:
  1. Extend `ExecutionResult` to carry an optional `policy_reason`.
  2. When `ensureToolApprovals` denies or when `hull-guard` blocks a tool, push `{ reason, capability }` onto the step record (and persist to `task_trace.steps`).
  3. Update `/api/agi/trace/:id` serializer to include `policy_reason`.
  4. Render a yellow callout in `TraceDrawer` with copy-to-clipboard support.
- **Files touched**: `server/services/planner/chat-b.ts`, `shared/essence-persona.ts` (step schema), `client/src/components/agi/TraceDrawer.tsx`, `tests/persona-policy.spec.ts`.
- **Env gate(s)**: `ENABLE_POLICY_REASONS=1`.
- **Acceptance**:
  - Block a risky tool with `ENABLE_POLICY_REASONS=1`; TraceDrawer shows the reason string (Hull blocked, missing approval, etc.).
  - Vitest `tests/persona-policy.spec.ts` asserts reason propagation.

```diff
--- a/server/services/planner/chat-b.ts
+++ b/server/services/planner/chat-b.ts
@@
-      throw new Error(decision.message ?? `Approval denied for ${tool.name} (${capability}).`);
+      const error = new Error(decision.message ?? `Approval denied for ${tool.name} (${capability}).`);
+      (error as any).policyReason = reason;
+      throw error;
@@
-        : { id: step.id, kind: step.kind, ok: false, output, citations, latency_ms: latencyMs, essence_ids: stepEssenceIds };
+        : {
+            id: step.id,
+            kind: step.kind,
+            ok: false,
+            output,
+            citations,
+            latency_ms: latencyMs,
+            essence_ids: stepEssenceIds,
+            policy_reason: (result.error as any)?.policyReason ?? result.error?.message,
+          };
```

```diff
--- a/client/src/components/agi/TraceDrawer.tsx
+++ b/client/src/components/agi/TraceDrawer.tsx
@@
-            {row.error && <div className="text-[11px] text-red-300">{row.error}</div>}
+            {row.policyReason && (
+              <div className="text-[11px] rounded border border-amber-400/40 bg-amber-500/10 text-amber-100 p-2">
+                {row.policyReason}
+              </div>
+            )}
+            {row.error && <div className="text-[11px] text-red-300">{row.error}</div>}
```

## PR-EC3 — Eval replay (“Verify patch <essenceId>”)

- **Problem**: The Eval panel only runs a blind smoke test, so you cannot tie a verification run to a trace or capture the results as Essence.
- **Minimal fix**:
  1. Add `POST /api/agi/eval/replay` (gated by `ENABLE_EVAL_REPLAY`) accepting `{ traceId?, essenceId? }`. It shells `scripts/eval-smoke.ts` (or `pnpm run eval:smoke`) and collapses the stdout/stderr as a private Essence envelope.
  2. Extend `EvalPanel` with a “Verify patch” form: paste trace/essence id → call the new route → show link to the envelope.
  3. Emit metrics `agi_eval_replay_total` and store the envelope id on the response.
- **Files touched**: `server/routes/agi.eval.ts`, new `server/services/agi/eval-replay.ts`, `client/src/components/agi/EvalPanel.tsx`, `server/metrics/index.ts`, `tests/eval-replay.spec.ts`.
- **Env gate(s)**: `ENABLE_EVAL_REPLAY=1`.
- **Acceptance**:
  - `ENABLE_EVAL_REPLAY=1 pnpm vitest run tests/eval-replay.spec.ts`.
  - When the button is clicked, the UI renders success/failure + Essence link.

```diff
--- a/server/routes/agi.eval.ts
+++ b/server/routes/agi.eval.ts
@@
-evalRouter.post("/smoke", async (req, res) => {
+evalRouter.post("/smoke", async (req, res) => {
@@
 });
+
+evalRouter.post("/replay", async (req, res) => {
+  if (process.env.ENABLE_EVAL_REPLAY !== "1") {
+    return res.status(404).json({ error: "replay_disabled" });
+  }
+  try {
+    const payload = await runEvalReplay({
+      traceId: req.body?.traceId,
+      essenceId: req.body?.essenceId,
+      baseUrl: inferBaseUrl(req),
+    });
+    metrics.recordEvalReplay(payload.ok);
+    res.json(payload);
+  } catch (error) {
+    const message = error instanceof Error ? error.message : String(error);
+    res.status(500).json({ error: "eval_replay_failed", message });
+  }
+});
```

```diff
--- a/client/src/components/agi/EvalPanel.tsx
+++ b/client/src/components/agi/EvalPanel.tsx
@@
 export default function EvalPanel() {
   const evalUiEnabled = isFlagEnabled("ENABLE_EVAL_UI") || Boolean(import.meta.env?.DEV);
+  const replayEnabled = isFlagEnabled("ENABLE_EVAL_REPLAY");
   const [busy, setBusy] = useState(false);
+  const [replayBusy, setReplayBusy] = useState(false);
   const [result, setResult] = useState<EvalPayload | null>(null);
+  const [replayResult, setReplayResult] = useState<ReplayPayload | null>(null);
+  const [replayTarget, setReplayTarget] = useState("");
@@
       <div className="opacity-70">{status}</div>
       {error && <div className="text-red-400">{error}</div>}
+      {replayEnabled && (
+        <form
+          className="mt-3 space-y-2"
+          onSubmit={(event) => {
+            event.preventDefault();
+            void runReplay();
+          }}
+        >
+          <label className="block text-[11px] uppercase opacity-60">Verify patch (trace or Essence ID)</label>
+          <input
+            className="w-full rounded border border-white/20 bg-black/30 px-2 py-1 text-xs"
+            value={replayTarget}
+            onChange={(event) => setReplayTarget(event.target.value)}
+          />
+          <button className="underline text-left disabled:opacity-40" disabled={!replayTarget || replayBusy}>
+            {replayBusy ? "Verifying..." : "Verify patch"}
+          </button>
+          {replayResult && (
+            <div className="text-[11px]">
+              {replayResult.ok ? "Pass" : "Fail"} —{" "}
+              <a href={`/api/essence/${replayResult.essenceId}`} target="_blank" rel="noreferrer" className="underline">
+                envelope
+              </a>
+            </div>
+          )}
+        </form>
+      )}
     </div>
   );
 }
```

---

## PR-EC4 — Repo tool stubs

- **Problem**: There is no way for the planner to call repo-aware helpers (search/diff/patch) while staying Hull-safe.
- **Minimal fix**: Add three stub tools under `server/skills/repo.*` that wrap `rg`, `git diff`, and `git apply --check` respectively, expose them in the manifest, and gate them behind approvals + `ENABLE_REPO_TOOLS`.
- **Acceptance**: `tests/repo-tools.spec.ts` covers stub execution; TraceDrawer shows Essence IDs for repo outputs.

## PR-EC5 — Knowledge citation verifier + retry

- **Problem**: Attachments can be ignored silently.
- **Minimal fix**: Add `server/services/knowledge/citations.ts` that checks whether the final step includes citations referencing the attached knowledge; if not, push a retry step that asks the LLM to cite or mark `[NO_EVIDENCE]`.
- **Acceptance**: `tests/knowledge-citation.spec.ts`; TraceDrawer now shows a dedicated warning when citations are missing.

## PR-EC6 — Hull status chip

- **Problem**: Console header lacks runtime posture.
- **Minimal fix**: Add `/api/hull/status` returning `{ hullMode, llmPolicy, queueDepth, approvalsOutstanding }` and render chips in `essence.tsx`.
- **Acceptance**: `tests/hull-status.spec.ts`; chip updates when env flags change.
- **Status**: implemented in `server/routes/hull.status.ts`, `client/src/components/agi/essence.tsx`, `tests/hull-status.spec.ts` (pending verification gate).

## PR-EC7 — Creative tool provenance polish

- **Problem**: NoiseGen tools aren’t registered, and Debate referee cards lack Essence links.
- **Minimal fix**: Register `noise.gen.cover` + `noise.gen.fingerprint` tools, ensure they emit Essence IDs, and add badges in `TraceDrawer` + `DebateView` linking to `/api/essence/:id`.
- **Acceptance**: `tests/noise-tools.spec.ts`; Debate referee cards show citations.
- **Status**: implemented in `server/skills/noise.gen.cover.ts`, `server/skills/noise.gen.fingerprint.ts`, `server/routes/agi.plan.ts`, `client/src/components/agi/TraceDrawer.tsx`, `client/src/components/agi/DebateView.tsx`, `tests/noise-tools.spec.ts` (pending verification gate).
## PR-EC8 � Tokenizer guardrails + canary

- **Problem**: Swapping GGUF builds or tokenizer assets mutates token counts silently; Hull never notices until truncation corrupts a trace.
- **Minimal fix**:
  1. Land docs/tokenizer-guardrails.md with a concrete checklist (registry hash, verify CLI, canary, recovery) and link it from the Essence docs index.
  2. Ship 	ools/tokenizer-verify.ts that inspects a GGUF header + tokenizer artifacts, comparing vocab size, merges hash, and special token IDs against an on-disk registry.
  3. Add 	ests/tokenizer-canary.spec.ts plus 	ests/fixtures/tokenizer-canary.json to diff a saved prompt�s IDs whenever the tokenizer changes.
  4. Wire the CLI + canary test into CI (pnpm tsx tools/tokenizer-verify.ts � + pnpm vitest run tests/tokenizer-canary.spec.ts) so deploys fail fast when metadata drifts.
- **Files touched**: docs/ESSENCE-CONSOLE_GAP-REPORT.md, docs/tokenizer-guardrails.md, 	ools/tokenizer-verify.ts, 	ests/tokenizer-canary.spec.ts, 	ests/fixtures/tokenizer-canary.json.
- **Env gate(s)**: none; runs in CI and local smoke.
- **Status**: guardrails already in repo via `docs/tokenizer-guardrails.md`, `tools/tokenizer-verify.ts`, `tools/generate-tokenizer-canary.ts`, `tests/tokenizer-canary.spec.ts`, `tests/fixtures/tokenizer-canary.json`.
- **Acceptance**:
  - pnpm tsx tools/tokenizer-verify.ts --gguf ./models/local.gguf --tokenizer-json ./tokenizers/local/tokenizer.json --merges ./tokenizers/local/merges.txt --canary tests/fixtures/tokenizer-canary.json exits 0 when metadata matches.
  - pnpm vitest run tests/tokenizer-canary.spec.ts fails if the prompt hash or token IDs drift.
  - Gap report row #11 flips to �planned� once this PR merges.
