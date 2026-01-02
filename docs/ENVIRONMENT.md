# Environment Variables

Use `.env` for local overrides and start from `.env.example`, which is the
canonical list of supported variables.

## GR agent loop audit log
- `GR_AGENT_LOOP_PERSIST`: set to `0` to disable persistence (default on).
- `GR_AGENT_LOOP_AUDIT_PATH`: explicit JSONL path override.
- `GR_AGENT_LOOP_AUDIT_DIR`: directory used when no explicit path is set
  (default `.cal`, file `gr-agent-loop-audit.jsonl`).
- `GR_AGENT_LOOP_BUFFER_SIZE`: in-memory ring size for API responses.

Notes:
- The audit log is append-only JSONL.
- `.cal` is gitignored, so logs stay local by default.

## Constraint pack policy profiles
- `CONSTRAINT_PACK_POLICY_PERSIST`: set to `0` to disable persistence.
- `CONSTRAINT_PACK_POLICY_AUDIT_PATH`: explicit JSONL path override.
- `CONSTRAINT_PACK_POLICY_AUDIT_DIR`: directory used when no explicit path is set
  (default `.cal`, file `constraint-pack-policies.jsonl`).
- `CONSTRAINT_PACK_POLICY_BUFFER_SIZE`: in-memory ring size for API responses.

## Constraint pack telemetry ingestion
- `CASIMIR_AUTO_TELEMETRY`: set to `1` to auto-ingest telemetry from env/files.
- `CASIMIR_TELEMETRY_PATH`: default JSON telemetry path (relative to repo).
- `CASIMIR_REPO_TELEMETRY_PATH`: repo convergence JSON telemetry path.
- `CASIMIR_TOOL_TELEMETRY_PATH`: tool-use budget JSON telemetry path.
- `CASIMIR_TEST_JUNIT_PATH`: JUnit XML path (repo convergence).
- `JUNIT_PATH`: fallback JUnit XML path.
- `CONSTRAINT_PACK_TELEMETRY_MAX_BYTES`: max JSON/XML size (default 5MB).
- Repo convergence envs:
  `CASIMIR_BUILD_STATUS`, `CASIMIR_BUILD_OK`, `CASIMIR_BUILD_EXIT_CODE`,
  `CASIMIR_BUILD_DURATION_MS`, `CASIMIR_TEST_STATUS`, `CASIMIR_TEST_OK`,
  `CASIMIR_TEST_FAILED`, `CASIMIR_TEST_PASSED`, `CASIMIR_TEST_TOTAL`,
  `CASIMIR_SCHEMA_CONTRACTS`, `CASIMIR_SCHEMA_OK`, `CASIMIR_DEPS_COHERENCE`,
  `CASIMIR_LINT_STATUS`, `CASIMIR_TYPECHECK_STATUS`, `CASIMIR_TIME_TO_GREEN_MS`,
  `CASIMIR_REPO_METRICS_JSON`.
- Tool-use budget envs:
  `CASIMIR_STEPS_USED`, `CASIMIR_STEPS_TOTAL`, `CASIMIR_COST_USD`,
  `CASIMIR_OPS_FORBIDDEN`, `CASIMIR_OPS_APPROVAL_MISSING`,
  `CASIMIR_PROVENANCE_MISSING`, `CASIMIR_RUNTIME_MS`, `CASIMIR_TOOL_CALLS`,
  `CASIMIR_TOOL_TOTAL`, `CASIMIR_TOOL_METRICS_JSON`.

## AGI auth + tenant isolation
- `ENABLE_AGI_AUTH`: set to `1` to require JWTs on `/api/agi/*` even if global auth is off.
- `AGI_TENANT_REQUIRED`: set to `1` to require a tenant id; unset defaults to
  `ENABLE_AUTH`/`ENABLE_AGI_AUTH`.
- `AGI_TENANT_HEADERS`: comma-separated headers for tenant id lookup (default:
  `x-tenant-id,x-customer-id,x-org-id`).

## OpenTelemetry tracing
- `OTEL_TRACING`: set to `1` to enable span capture.
- `OTEL_HTTP_SPANS`: set to `0` to skip HTTP request spans (defaults to on when tracing is enabled).
- `OTEL_SERVICE_NAME`: service name resource attribute (defaults to `casimir-verifier`).
- `OTEL_SERVICE_VERSION`: optional service version resource attribute.
- `OTEL_SERVICE_INSTANCE_ID`: optional service instance id (defaults to hostname).
- `OTEL_SPAN_PERSIST`: set to `1` to persist spans to JSONL.
- `OTEL_SPAN_AUDIT_PATH`: explicit JSONL path override.
- `OTEL_SPAN_AUDIT_DIR`: directory used when no explicit path is set
  (default `.cal`, file `otel-span.jsonl`).
- `OTEL_SPAN_BUFFER_SIZE`: in-memory ring size for API responses.
- `OTEL_EXPORTER_OTLP_ENDPOINT`: optional; when set, tracing is enabled and spans can be forwarded by an external collector.
