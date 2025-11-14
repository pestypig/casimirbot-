# DPO for Math (SymPy supervision)

This folder is a lightweight scaffold for building preference datasets from the new `math.sympy.verify` checker and training downstream Direct Preference Optimization (DPO) models offline. Nothing here is wired into runtime execution; the scripts operate on exported logs only.

## Workflow

1. **Export logs** – capture solver/verifier traces that include the original prompt, solver output, verifier result, and optional metadata. A simple `pnpm logs:export` or manual query against the task trace table works.
2. **Build preference pairs** – run `python research/dpo-math/build_pairs.py --input sympy_logs.jsonl --output pairs.jsonl`. The script will emit JSONL entries shaped as `{ "prompt": "...", "chosen": "...", "rejected": "...", "meta": {...} }`.
3. **Train DPO** – point `train_dpo.py` at the generated pairs and your preferred base model, e.g.:

   ```bash
   python research/dpo-math/train_dpo.py \
     --model meta-llama/Llama-3-8b-chat-hf \
     --data pairs.jsonl \
     --out ./checkpoints/math-dpo
   ```

4. **Evaluate offline** – sample generations, re-run them through `math.sympy.verify`, and report pass rates before shipping anything back into runtime.

## File overview

- `build_pairs.py` – parses SymPy verifier logs into `prompt/chosen/rejected` JSONL compatible with TRL or Axolotl pipelines.
- `train_dpo.py` – thin wrapper that shells out to your trainer of choice (default stub prints the chosen arguments so you can paste into TRL).
- `README.md` – this file; feel free to flesh it out with dataset schemas or evaluation targets as the pipeline matures.

## JSONL schema

Each line produced by `build_pairs.py` looks like:

```json
{
  "prompt": "Solve 2*(3+4)",
  "chosen": "FINAL ANSWER: 14",
  "rejected": "FINAL ANSWER: 15",
  "meta": {
    "trace_id": "trace-123",
    "verifier": "math.sympy.verify"
  }
}
```

This format plays nicely with common DPO trainers:

- TRL: `--dataset-format jsonl --text-column prompt --chosen-column chosen --rejected-column rejected`
- Axolotl: `prompt_column: prompt`, `completion_column: chosen`, `rejected_column: rejected`

Extend the `meta` object with whatever attribution or guard-rail data you need (difficulty, persona, etc.). The runtime never reads these files, so you can iterate without redeploying the app.
