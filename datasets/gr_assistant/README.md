# GR Assistant Dataset (v0)

This folder stores the JSONL dataset used by the local GR assistant tools.

## Files
- `gr_dataset.jsonl`: generated dataset (fixtures + flat metrics, baseline checks).

## Generate
```bash
python tools/gr_assistant/dataset.py --out datasets/gr_assistant/gr_dataset.jsonl --count 200
```

## Evaluate
```bash
python tools/gr_assistant/eval.py --dataset datasets/gr_assistant/gr_dataset.jsonl --base-url http://127.0.0.1:8000
```
