# Personal AGI – Phase 2 (Hardening & Persistence)

**Intent:** Take the scaffolding to a durable, laptop-safe baseline without breaking existing features.

## End-State (Phase 2)
- Durable memory & Essence envelopes in Postgres (+ pgvector when enabled).
- Heavy media stored in object storage (local-fs by default).
- Queue with laptop-safe scheduling; STT CPU fallback; diffusion queued behind LLM.
- Metrics endpoint and structured logs.
- Minimal JWT auth (env-gated) and per-persona ACLs.
- Bench harness producing tok/s, image latency, and STT RTF.

## Work Tracks (parallelizable)

1. **DB & DAL**
   - Migrations for `persona`, `memory`, `task_trace`, `essence_envelope`, `essence_packet`.
   - Vector index (optional) and hybrid search.
   - DAL functions: `put/get/search` for memory & essence.

2. **Storage**
   - `putBlob/getBlob` abstraction; fs + s3 backends.
   - Update tools to store blobs and write URIs into envelopes.

3. **Queue & Scheduling**
   - BullMQ when `REDIS_URL` present; local queue otherwise.
   - GPU scheduler + CPU fallback for STT.

4. **Metrics & Logs**
   - `/metrics` endpoint; counters/histograms.
   - Structured tool-call logs with seeds/params.

5. **Auth & Policy**
   - JWT middleware (gated); per-persona ACL checks.
   - Keep approvals for risky tools.

6. **Bench**
   - `scripts/bench.ts` prints `{ tok_s, img_ms, stt_rtf }` for quick laptop checks.

## Build Steps (Phase 2 kickoff)
Below is the step-by-step build path for the Phase 2 components. Finish each step before moving to the next.

1. Durable storage (DB + DAL)
   - Step 1: finalize migrations for persona, memory, task_trace, essence_envelope, essence_packet with strict constraints.
   - Step 2: implement DAL create/read/search with in-memory fallbacks.
   - Step 3: wire services + tests; confirm persistence across restarts.
   - Evidence: server/db/*, server/services/essence/store.ts, server/services/agi/memory.ts, tests/*.spec.ts.

2. Blob handling (object storage)
   - Step 1: route all media output through putBlob/getBlob and persist Essence packet URIs + hashes.
   - Step 2: enforce content type/size limits; define retention + cleanup hooks.
   - Step 3: add storage tests for fs and s3 with local fallback.
   - Evidence: server/storage/index.ts, server/db/essence.ts, server/services/essence/*, tests/storage*.spec.ts.

3. Queues and scheduling
   - Step 1: confirm BullMQ with REDIS_URL, in-memory queue otherwise.
   - Step 2: set priorities (LLM > STT > diffusion), GPU slot guards, and CPU fallback for STT.
   - Step 3: surface queue depth + approvals in /api/hull/status and add alert thresholds.
   - Evidence: server/queue.ts, server/services/hardware/gpu-scheduler.ts, server/routes/hull.status.ts, tests/queue*.spec.ts.

4. Auth and ACLs
   - Step 1: env-gated JWT middleware; anonymous access only when ACL allows.
   - Step 2: per-persona checks on memory, trace, essence fetch, and uploads.
   - Step 3: record audit trails for access decisions.
   - Evidence: server/auth/*, server/routes/*, server/services/essence/store.ts, tests/auth*.spec.ts.

5. Metrics and bench
   - Step 1: counters/histograms for tool calls, queue latency, and storage writes.
   - Step 2: bench harness outputs tok/s, img_ms, stt_rtf and writes reports.
   - Step 3: CI gates for regression budgets.
   - Evidence: server/metrics/index.ts, scripts/bench.ts, reports/*.

## Acceptance (Phase 2)
- All existing tests pass; new DAL tests pass against ephemeral DB.
- `curl /metrics` shows non-zero counters after a run.
- With `ENABLE_AUTH=1`, memory writes require auth; with `ENABLE_AUTH=0`, behavior unchanged.
- Bench shows target budgets met on Helios-class hardware.

## Risks & Mitigations
- **DB outages** → keep `USE_INMEM_MEMORY=1` fallback in dev.
- **GPU thermal throttling** → queue generation; STT to CPU.
- **Vector lib missing** → keyword-only search path retained.

## Next (Phase 3)
- Federation (actors + signatures),
- Self-RAG reflection quality tuning,
- Agent Console UI: TaskTrace stream, memory viewer, provenance inspector.
