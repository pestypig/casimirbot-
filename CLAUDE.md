# Claude Instructions

This repo uses `AGENTS.md` as the single source of truth for agent behavior.
Read and follow `AGENTS.md` before making changes.

Key requirement (short form):
- Run the Casimir verifier for every patch via `POST /api/agi/adapter/run`.
- Do not claim completion without a PASS (and certificate hash when required).
- Export traces for audit/training via `GET /api/agi/training-trace/export`.
