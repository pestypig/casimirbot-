# Tokenizer Guardrails

GGUF swaps regularly carry mismatched tokenizer metadata (missing merges, stale `tokenizer.json`, special IDs that moved). When that happens, token counts shrink/grow silently, `llm.local.spawn` truncates different spans, and Hull approvals become meaningless. This doc wires the guardrails Codex recommended: registry hashes, a verification CLI, a canary prompt, and a recovery loop.

## Checklist (per model)

1. **Registry entry** — add/update `server/config/tokenizer-registry.json` with:
   - relative paths for the GGUF, tokenizer JSON, merges file, and canary fixture
   - expected SHA-256 hashes (`sha256:<hex>`) and known vocab/merge counts
   - special token IDs (bos/eos/pad/unk) so the verifier can compare GGUF headers
2. **Verification CLI** — run `tools/tokenizer-verify.ts` whenever you ship a new GGUF or tokenizer asset.
   - CI hook: `npx tsx tools/tokenizer-verify.ts --tokenizer-id mock-helix-local --canary tests/fixtures/tokenizer-canary.json --quiet`
   - Pass `--gguf /path/to/model.gguf` to cross-check GGUF metadata against the registry.
3. **Canary prompt + test** — keep `tests/fixtures/tokenizer-canary.json` up to date via `npx tsx tools/generate-tokenizer-canary.ts`.
   - `tests/tokenizer-canary.spec.ts` re-tokenizes the saved prompt and fails if IDs/hash drift.
   - The fixture stores prompt text, prompt hash, token IDs, and hashes for tokenizer + merges so you catch both content edits and metadata swaps.
4. **Recovery playbook** — if the CLI/test fails:
   - rerun `npx tsx tools/generate-tokenizer-canary.ts <tokenizer-id>` after confirming the intended tokenizer + merges combo
   - regenerate GGUF metadata with the correct tokenizer assets (e.g., rerun `convert-llama-gguf.py` or `llama.cpp` exporter)
   - update the registry entry with the new hashes, then rerun the CLI + Vitest to ensure the alarm clears

## CLI quick reference

```
npx tsx tools/tokenizer-verify.ts \
  --tokenizer-id mock-helix-local \
  --gguf ./models/local.gguf \
  --canary tests/fixtures/tokenizer-canary.json
```

The script loads the registry entry, computes tokenizer/merge hashes, optionally parses GGUF metadata, then replays the canary prompt (using the same BPE logic as the worker). Non-zero exit means you have a drift to investigate.

## Files touched by this guardrail

- `server/config/tokenizer-registry.json` — source of truth for tokenizer metadata.
- `tools/tokenizer-verify.ts` — policy enforcement (hash + GGUF checks).
- `tools/generate-tokenizer-canary.ts` — helper to refresh the snapshot fixture.
- `tests/fixtures/tokenizer-canary.json` — saved canary prompt, hashes, and token IDs.
- `tests/tokenizer-canary.spec.ts` — Vitest that replays the canary and shells out to the CLI.

Wire these commands into Hull smoke / CI so any tokenizer drift blocks deploys before it corrupts traces.
