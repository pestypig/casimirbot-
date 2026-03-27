# Helix Ask Test-Type Runner

## Purpose

Run Helix Ask probes by a named test type instead of memorizing individual script names.

Command:

```bash
npm run helix:ask:test-type -- --type <name>
```

## Test Types

- `objective_loop`: runs `helix:ask:patch-probe:strict`
- `debug_loop`: runs `helix:ask:dot:debug-loop`
- `prompt_quality`: runs `helix:ask:prompt-quality:probe`
- `differential`: runs `helix:ask:differential`
- `retrieval`: runs `helix:ask:retrieval:ablation`
- `regression_light`: runs `helix:ask:regression:light`
- `codex_baseline`: runs, in order:
  - `helix:ask:patch-probe:strict`
  - `helix:ask:prompt-quality:probe`
  - `helix:ask:dot:debug-loop`

Aliases:

- `objective`, `fallback`, `divergence` -> `objective_loop`
- `debug`, `live` -> `debug_loop`
- `prompt` -> `prompt_quality`
- `diff`, `differential_mode`, `codex_diff` -> `differential`
- `retrieval_ablation` -> `retrieval`
- `regression` -> `regression_light`
- `codex` -> `codex_baseline`

## Common Examples

```bash
# Strict objective-loop validation
npm run helix:ask:test-type -- --type objective_loop --base-url http://127.0.0.1:5050

# Codex-aligned baseline chain
npm run helix:ask:test-type -- --type codex --base-url http://127.0.0.1:5050

# Differential run with fixed corpus + divergence report
npm run helix:ask:test-type -- --type differential --base-url http://127.0.0.1:5050

# Show available types
npm run helix:ask:test-type -- --list

# Dry run (print underlying commands without executing)
npm run helix:ask:test-type -- --type codex_baseline --dry-run
```

## Notes

- For multi-step test types (for example `codex_baseline`), pass-through args are applied to the final step only.
- Use `--continue-on-fail` to keep running subsequent steps after a step fails.
