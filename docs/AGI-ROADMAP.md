# Personalâ€‘AGI Roadmap (Essence + Luma + noisegen)

**Goal:** Reach **v1.0 "Personal AGI"** on a laptop by delivering a persistent, toolâ€‘using agent that can plan, act, remember, and createâ€”grounded in **Essence** provenanceâ€”without breaking existing features.

---

## Definition of Done (v1.0 threshold)

- âœ… Plans and completes multiâ€‘step tasks with tool use (LLM + web/files + generation adapters).
- âœ… Maintains longâ€‘lived **personal memory** (preferences, projects) retrievable via RAG.
- âœ… All outputs are **collapsed to Essence** with provenance (seeds, transforms, signatures).
- âœ… Selfâ€‘heal/retry; success â‰¥ **80%** on our internal eval suite; safeâ€‘ops gates respected.

---

## Milestones

### v0.1 Agentic MVP
- [ ] Tool/Skill registry with local LLM tool (stub ok).
- [ ] Planner + Executor stubs (plan â†’ execute â†’ log TaskTrace).
- [ ] Essence router mounted (gated) with SSE keepalive.
- [ ] Basic Memory search (string match or simple embeddings).
- [ ] Daily Jobs + Token budget surfaced in Essence console (list, budget, propose/complete).
- **Acceptance:** Plan/execute succeeds on 5 canned tasks; TaskTrace recorded.
- **Essence â‡† Codex loop:** Trace export JSON includes plan + manifest + knowledge context, policy denials render inline, and eval replay persists an Essence envelope.

**Additional acceptance (local LLM / Hull Mode):**
- [ ] **Local LLM spawn tool** (`llm.local.spawn.generate`) runs on a laptop with `LLM_POLICY=local` and produces an Essence envelope plus TaskTrace for at least one console turn.
- [ ] **Metrics exposed** for local runs: `llm_local_spawn_calls_total` and `llm_local_spawn_latency_ms` visible at `GET /metrics`; `npm run bench` and `pnpm run eval:smoke` complete offline.

### v0.2 Personalization
- [ ] PersonaProfile CRUD.
- [ ] RAG integration with Essence memory.
- [ ] Reflection writes procedural/semantic memories after tasks.
- **Acceptance:** â‰¥ 70% success; memory fetch within topâ€‘k for eval queries.

### v0.3 Multimodal Creation
- [ ] Luma/SD adapter with **LCMâ€‘LoRA** lowâ€‘step path; provenance to Essence.
- [ ] STT adapter (fasterâ€‘whisper INT8) with CPU fallback.
- **Acceptance:** Image 512px in â‰¤2s typical on laptop; provenance recorded.

### v1.0 Personal AGI
- [ ] KV budgeter wired; long chats stabilized via summarizeâ†’Essenceâ†’evict.
- [ ] Determinism: record seeds/params; signatures on envelopes.
- [ ] Safety gates (approvals for risky tools).
- **Acceptance:** â‰¥ 80% success on eval battery; <5% weekly regression; safety checks enforced.

---

## Build Steps - Local LLM Spawn, Memory/RAG, Multi-Agent Mapping
This section sequences the three core build tracks so each step lands cleanly before the next.

1. Local LLM spawn (llm.local.spawn.generate)
   - Step 1: define the spawn contract (inputs, outputs, timeouts) and validate env config in one place.
   - Step 2: implement the spawn runner with streaming, kill switch, and deterministic seed capture.
   - Step 3: persist output to Essence + TaskTrace and emit tool-log telemetry.
   - Step 4: add offline smoke + bench coverage for tok/s and latency.
   - Evidence: server/skills/llm.local.spawn.ts, server/services/planner/chat-b.ts, server/services/observability/tool-log-store.ts, tests/llm-local-spawn.spec.ts.

2. Memory and RAG
   - Step 1: complete DAL read/write/search for memory and Essence packets with persistence fallback.
   - Step 2: implement retrieval that returns citations and knowledge_context with token budget + dedupe.
   - Step 3: reflection writes (episodic + semantic) after tasks with provenance.
   - Step 4: add eval fixtures for recall, citation coverage, and RAG ordering.
   - Evidence: server/services/agi/memory.ts, server/services/knowledge/*, server/routes/agi.memory.ts, tests/agi-memory.spec.ts.

3. Multi-agent plan/execute mapping
   - Step 1: define an agent map (role -> tools -> budget -> verifier) and expose it to the planner.
   - Step 2: translate PlanDSL into multi-agent steps with explicit owner + intent tags.
   - Step 3: consolidate outputs and verifier results into a single TaskTrace with citations.
   - Step 4: add harness tests for plan -> execute -> verify under debate + agentic runs.
   - Evidence: server/services/planner/chat-b.ts, server/routes/agi.plan.ts, server/skills/debate.run.ts, tools/agentic/run.ts.

## Agentic Architecture Integration (phased plan)
Purpose: pair the `all-agentic-architectures` LangGraph repo with Essence so every pattern (reflection, ReAct, tree-of-thoughts, ensemble, blackboard, meta-controller, PEV, dry-run, self-improve) is runnable, observable, and token-efficient on our stack.

### Phase 1 - Ingest & Harness
- [x] Add repo as submodule/shallow clone at `external/agentic-architectures` pinned to a commit (pinned `9612b347ffe7b63bde12c54d69b9be14d18bce8c`).
- [x] Shell harness to run notebooks/scripts headless (no GPU assumptions) with env toggles. (`tools/agentic/run.ts`)
- [x] Minimal config map to point their vector/cache paths at `data/essence` temp dirs. (`configs/agentic-architectures.json`)

### Phase 2 - Essence Capture & Provenance
- [x] Wrapper that collapses every LangGraph node output/judge result into Essence envelopes (modality-tagged, `provenance.pipeline.name=<architecture>`).
- [x] Attach embeddings + seeds + params; enforce `information_boundary` on outbound artifacts.
- [x] Route storage via `putEnvelope`/`putBlob`; surface links in console traces.

### Phase 3 - Planning/PEV Alignment
- [ ] Map each architecture into our plan/execute verbs (plan->graph run->verify->repair).
  - Add an `agentic_arch_map` (arch -> planner strategy -> executor step template -> verifier/repair hooks) and surface it in `configs/agentic-architectures.json`; wire `agi.plan` to pick an arch via intent flag/strategy and emit a single `ExecutorStep` that wraps `tools/agentic/run.ts --arch <name> --trace <trace.jsonl>`.
  - Standardize LangGraph event labels so plan nodes are tagged (`kind: plan.node`), graph runs (`kind: graph.run`), verifiers (`kind: judge|verify`), and repairs (`kind: repair.retry`) to align with PEV telemetry and TaskTrace steps.
  - Publish an arch->PEV table in the console (reflection/react/tree-of-thoughts/blackboard/meta-controller) so operators can choose and see which verbs fire.
- [ ] Plug LLM-as-a-Judge outputs into verifier steps; persist as Essence + TaskTrace entries.
  - Treat LangGraph `judge`/`verdict` events as `verify` steps: collapse to Essence via `collapseLangGraphTrace`, attach to `TaskTrace.steps` with verdict text, score/confidence, and `ok` flag, and emit a dedicated SSE/tool-log entry.
  - Persist verifier artifacts under `provenance.pipeline.name=agentic.<arch>` with `information_boundary` copied from the graph run; thread citations/embeddings so downstream reflection/memory can reuse verdicts.
  - Add a small adapter so PEV `verify` can reuse either local LLM-as-a-Judge or the architecture’s built-in judge node, and fall back to a shared `verifier.llm` tool when none is emitted.
- [ ] Dry-run harness: propose-only mode that emits plan Essence and waits for approval.
  - Add `--dry-run` / `AGI_AGENTIC_DRY_RUN=1` to `tools/agentic/run.ts` to emit plan/graph envelopes without executing tools; persist a `collapse_trace` entry and stop before `execute`.
  - `agi.plan`/`execute` gain `mode: "propose"` that writes a plan Essence + TaskTrace skeleton, marks approvals required, and holds execution until `POST /api/agi/execute?approve=1` (or console UI) is received.
  - SSE/console should show “propose-only” badge with the generated Essence IDs so operators can inspect the plan before allowing real tool calls.

### Phase 4 - Memory & Context Efficiency
- [ ] Bridge their vector stores to `memory-store` (episodic vs semantic) with chunk -> packet mapping.
- [ ] Auto-summarize long contexts to semantic Essence cards; keep branch roots for replay.
- [ ] Token policy: cap per-step ctx; use rolling summary + retrieval to maximize usable tokens.

### Phase 5 - Multi-Agent Routing & Safety
- [ ] Meta-controller that selects our specialists based on envelope features/resonanceKind.
- [ ] Blackboard/ensemble mode writes shared artifacts to Essence, tagged per branch.
- [ ] Safety gates: simulator/checker pass before tool use; approvals logged as pipeline steps.

### Phase 6 - Regression & Telemetry
- [ ] CI smoke: run 2-3 reference flows (reflection, tree-of-thoughts, blackboard) and assert Essence IDs exist.
- [ ] Metrics: counters for `agentic_runs_total{arch=...}` + latency; failures emit Essence error envelopes.
- [ ] Console view: filter traces by architecture tag; drill into branch envelopes.

### Codex Chat Gates
- Phase 1 usable in chat after: submodule pinned (done) + harness stub lands + config map present; chats can trigger read-only previews of reference flows.
- Phase 2 usable in chat after: Essence capture shim active; chats may request running an arch and get Essence links back.
- Phase 3 usable in chat after: plan/execute wiring supports arch selection + verifier capture; chats can ask for PEV-backed runs.
- Phase 4 usable in chat after: memory bridge + token policy enforced; chats use summarized contexts by default.
- Phase 5 usable in chat after: meta-controller routing flag; chats can ask for multi-agent/ensemble with safety prechecks.
- Phase 6 usable in chat after: CI smoke and metrics live; chats surface status + last-known pass/fail before running.

---

## Workstreams & Owners

1. **Essence & Memory**
   - Files: `shared/essence-schema.ts`, `server/routes/essence.ts`, `server/routes/agi.memory.ts`
   - Tasks: collapse/provenance, memory search, verification endpoints.

2. **Planner & Executor**
   - Files: `server/routes/agi.plan.ts`, `server/services/planner/*`
   - Tasks: plan DSL, execution engine, WS/SSE progress, retries.

3. **Tools/Skills**
   - Files: `shared/skills.ts`, `server/skills/*`
   - Tasks: llm.local, essence.search/get, web.fetch (sandbox), file IO (safe).

4. **Multimodal**
   - Files: `server/skills/luma.generate.ts`, `server/skills/stt.whisper.ts`
   - Tasks: LCM-`LoRA path, STT streaming, CPU fallback, provenance.

5. **Safety & Approvals**
   - Files: middleware in executor
   - Tasks: policy checks, rate limits, human-in-the-loop approvals.

6. **Observability & Eval**
   - Files: metrics hooks; `tests/evals/*`
   - Tasks: success rate, latency, hallucination complaints; eval harness.
 
7. **Local LLM & Hull Mode**
   - Focus: zero-HTTP local inference, offline posture, and operator tooling.

8. **Jobs & Token Economy**
   - Files: `shared/jobs.ts`, `server/routes/jobs.ts`, `server/services/jobs/*`, `client/src/components/agi/JobsBudgetModal.tsx`, `client/src/lib/agi/jobs.ts`
   - Tasks: discover jobs from docs and repo (gap report, patch plan, alignment, TODO/FIXME), expose budget/ledger API, console modal for list + propose/complete, basic heuristics for proposal agreement, metrics hooks.
### Workstream 7 — Local LLM & Hull Mode
### Run Book â€” Hull Mode (local LLM)
**Purpose:** flip a laptop into pure offline "Hull Mode" and verify local LLM is live with metrics and Essence provenance.

```bash
# Core gates
export ENABLE_ESSENCE=1
export ENABLE_AGI=1
export ENABLE_LOG_TEXT=1

# Trace / replay gates
export ENABLE_TRACE_EXPORT=1
export ENABLE_POLICY_REASONS=1
export ENABLE_EVAL_REPLAY=1

# Hull posture
export HULL_MODE=1
export LLM_POLICY=local

# Local spawn adapter
export ENABLE_LLM_LOCAL_SPAWN=1
export LLM_LOCAL_CMD=./bin/llama-cli              # path to local binary
export LLM_LOCAL_MODEL=./models/Local-7B-Q4.gguf  # quantized model
export LLM_LOCAL_ARGS_BASE="--ctx-size=8192 --n-gpu-layers=20 --threads=6 --no-color"
export LLM_LOCAL_MAX_TOKENS=512
export LLM_LOCAL_TEMP=0.2
export LLM_LOCAL_SEED=42

pnpm dev

# Smoke in the Essence console:
# - Send a prompt â†’ Trace shows solver: llm.local.spawn.generate
# - Live tool logs stream; an Essence text envelope is created

# Observability
curl -s http://localhost:3000/metrics | grep -E "llm_local_spawn_calls_total|llm_local_spawn_latency_ms" || true

# Bench & eval (offline)
npm run bench
pnpm run eval:smoke
```

**Notes**
- If first-token latency is high, enable prompt cache flags supported by your binary and set a stable preamble hash.
- If GPU is thermally constrained, lower `--n-gpu-layers` or threads; the scheduler serializes LLM with other workloads.

## Debate Mode (Proponent <-> Skeptic)

- Gated by `ENABLE_DEBATE`; every round collapses to Essence envelopes + TaskTrace compatible SSE.
- Roles: **Proponent** proposes, **Skeptic** challenges, **Referee** enforces stop rules + emits verdicts.
- Budgets: `DEBATE_MAX_ROUNDS`, `DEBATE_MAX_WALL_MS`, `DEBATE_VERIFIERS`; metrics land in `agi_debate_*`.
- UI: Essence console toggle adds a live two-column debate viewer with replayable SSE stream (`/api/agi/debate/stream`).

### Run Book

```bash
# Enable
export ENABLE_ESSENCE=1 ENABLE_AGI=1 ENABLE_DEBATE=1 ENABLE_TRACE_API=1

pnpm dev

# Start a debate via API
curl -s -X POST http://localhost:3000/api/agi/debate/start \
  -H "Content-Type: application/json" \
  -d '{"goal":"Should we use math.expr or math.sum to compute 2*(3+4)?","persona_id":"persona:demo"}' | jq

# Live stream (replace <id>)
curl -N "http://localhost:3000/api/agi/debate/stream?debateId=<id>"

# Inspect status/outcome
curl -s "http://localhost:3000/api/agi/debate/<id>" | jq
```

---

## Laptop Budget & Flags

- `ENABLE_ESSENCE`, `ENABLE_AGI` gates
- KV budget: `KV_BUDGET_BYTES=1500000000`, evict oldest turns â†’ write Essence summary
- Diffusion lowâ€‘step path: `DIFF_ENGINE=sd15-lcm`, `DIFF_STEPS=4`, `DIFF_SLICING=true`

---

## Daily Jobs + Tokens (Essence Console)

Purpose: keep a steady stream of repo-aware, provenance-friendly work available to the operator (and to Codex), while tying effort to a simple token budget that grows with completions.

What ships
- Server routes (gated by `ENABLE_ESSENCE_JOBS`):
  - `GET /api/jobs/list` — discover daily jobs from docs (gap report, patch plan, alignment), repo TODO/FIXME, and user-submitted items.
  - `GET /api/jobs/budget` — token balance, daily base, and a small ledger.
  - `POST /api/jobs/complete { jobId }` — awards job.rewardTokens to the caller.
  - `POST /api/jobs/propose { title, description, kind?, priority?, paths?, tags?, traceId? }` — user job submission; lightweight heuristic to mark `agreed`.
- Client UI (Essence console):
  - Header adds a “Budget” button (wallet icon) that opens the modal.
  - Modal shows balance/ledger and a sortable daily job list.
  - “Open in console” pre-fills a prompt for Codex; “Mark completed” credits tokens.
  - “Propose a job” form posts to `/api/jobs/propose` and injects the new job.

Env
- `ENABLE_ESSENCE_JOBS=1` (default on)
- `ESSENCE_TOKENS_DAILY_BASE=500` (optional; per-user daily refill)

Implementation pointers
- Types: `shared/jobs.ts`
- Router: `server/routes/jobs.ts`
- Engine: `server/services/jobs/engine.ts` (parses docs + scans repo + holds user jobs)
- Budget: `server/services/jobs/token-budget.ts`
- UI: `client/src/components/agi/JobsBudgetModal.tsx` (+ header button in `client/src/components/agi/essence.tsx`)
- Client API: `client/src/lib/agi/jobs.ts`

Acceptance
- With `ENABLE_ESSENCE_JOBS=1`, the Budget modal opens and loads jobs + balance.
- Completing a job increases balance by its reward and appends to the ledger.
- Proposing a job returns `{ ok: true, agreed: <bool>, job }` and the job appears in the list.
- Jobs pulled from docs include evidence/file paths and sensible priorities.

Notes / next
- Replace the heuristic “agree” with a chat-based validator (planner call + trace) and persist proposal provenance as Essence.
- Persist jobs and balances in Postgres (current memory store is fine for dev).
- Add Prometheus counters for job proposals/completions and expose a small dashboard.

---
## Smoke Tests

```bash
ENABLE_ESSENCE=1 ENABLE_AGI=1 pnpm dev

# Essence SSE
curl -N -H "Accept: text/event-stream" http://localhost:3000/api/essence/events

# Persona + Memory
curl -s -X PUT http://localhost:3000/api/agi/persona/alice -H "Content-Type: application/json" -d '{"display_name":"Alice"}'
curl -s -X POST http://localhost:3000/api/agi/memory/put -H "Content-Type: application/json" -d '{"id":"m1","owner_id":"alice","created_at":"2025-11-08T00:00:00Z","kind":"semantic","text":"Alpha is on track"}'
curl -s "http://localhost:3000/api/agi/memory/search?q=Alpha&k=6"

# Plan + Execute
curl -s -X POST http://localhost:3000/api/agi/plan -H "Content-Type: application/json" -d '{"goal":"Summarize Alpha"}'
curl -s -X POST http://localhost:3000/api/agi/execute -H "Content-Type: application/json" -d '{"traceId":"<from_plan>"}'
```

---

## Risks & Nonâ€‘goals

* Don't change or remove existing simulation/lattice/warp/helix code paths.
* Don't rely on long raw context; use Essence memory instead.
* Avoid new heavy dependencies unless required for local runtimes.

---

## Done = Ready for Iteration

Once v0.1 passes smoke tests, we proceed to v0.2 (persona + RAG + reflection), then v0.3 (multimodal), then v1.0 acceptance.






