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
