# Copilot Instructions

Use `AGENTS.md` as the primary source of agent instructions for this repo.

Mandatory verifier ritual (summary):
- Run `POST /api/agi/adapter/run` after any patch and resolve the first failing
  HARD constraint until the verdict is PASS.
- Do not claim completion without PASS (and certificate hash when required).
- Export traces via `GET /api/agi/training-trace/export` for audit/training.

If AGI auth/tenant isolation is enabled, include `Authorization: Bearer ...`
and `X-Tenant-Id` (or `X-Customer-Id`) headers.
