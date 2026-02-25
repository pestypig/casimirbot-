# OpenAI key/env sanity + direct network probe (2026-02-25)

This audit records a no-leak diagnostics pass using key fingerprints only.

## Commands run

1. Key fingerprint + env sanity (SHA-256 fingerprint prefix only).
2. `unset LLM_HTTP_API_KEY` (session-scoped for follow-up probes).
3. Direct `curl` probe to `https://api.openai.com/v1/models`.
4. Direct Node `fetch` probe to the same endpoint.

## Sanitized results

```json
{
  "hasOpenAI": true,
  "hasHttp": true,
  "same": true,
  "openaiLen": 164,
  "httpLen": 164,
  "openaiTrimDiff": false,
  "httpTrimDiff": false,
  "openaiFp": "02b6c3e89735",
  "httpFp": "02b6c3e89735",
  "httpsProxy": "http://proxy:8080",
  "httpProxy": "http://proxy:8080",
  "noProxy": "browser"
}
```

- `curl` result: exit code `56`; proxy CONNECT tunnel rejected with `HTTP/1.1 403 Forbidden` from `proxy:8080`.
- Node `fetch` result: failed with `ENETUNREACH` to OpenAI edge IPs (no proxy path used by this probe).

## Interpretation

- API key presence/path looked consistent (`OPENAI_API_KEY` and `LLM_HTTP_API_KEY` matched before unsetting).
- The primary blocker is network egress/proxy policy, not key mismatch/format.
