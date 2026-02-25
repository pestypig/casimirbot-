# Helix Ask Failure Attribution Guard

Use this when Helix Ask says "key/config" but behavior suggests short-circuit.

## Rule order (authoritative)

1. Check `debug.llm_invoke_attempted` first.
2. Only then classify key/auth/network/backend outcomes.

## Deterministic classification

- `short_circuit`
  - criteria:
    - `debug.llm_invoke_attempted = false`
    - `debug.llm_skip_reason` is non-empty
  - interpretation:
    - ask did not invoke provider at all
    - do not attribute this to API key validity

- `http_auth_failure`
  - criteria:
    - `debug.llm_invoke_attempted = true`
    - `debug.llm_backend_used = http`
    - `debug.llm_provider_called = true`
    - `debug.llm_error_code in { llm_http_401, llm_http_403 }`
  - interpretation:
    - key/project/permission problem

- `http_transport_or_breaker_failure`
  - criteria:
    - `debug.llm_invoke_attempted = true`
    - `debug.llm_backend_used = http`
    - `debug.llm_provider_called = true`
    - `debug.llm_error_code startsWith llm_http_transport:` OR `llm_http_circuit_open`
  - interpretation:
    - egress/proxy/transport or breaker state

- `http_success`
  - criteria:
    - `debug.llm_invoke_attempted = true`
    - `debug.llm_backend_used = http`
    - `debug.llm_provider_called = true`
    - `debug.llm_http_status = 200`
    - `debug.llm_calls` non-empty
  - interpretation:
    - OpenAI-backed lane proven for this request

## Why this file exists

The most common misdiagnosis is treating any fallback output as "bad key."
Fallback content can be produced by short-circuit rules before provider invocation.
Always classify from debug fields, not from answer text alone.
