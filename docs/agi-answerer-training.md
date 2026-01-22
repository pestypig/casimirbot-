# Answerer LoRA/QLoRA Training (RC0)

Use the RC0 SFT export to train an answerer-first adapter. Training is expected
to run on off-box GPU.

## Inputs
- RC0 SFT JSONL: read the `export.sft.path` entry from
  `artifacts/rc0/agi-refinery-rc0.manifest.json`.
- JSONL rows must include `x` (prompt), `y` (answer), and `E` (evidence).

## LoRA (baseline)
```bash
python scripts/agi-train-answerer.py \
  --base-model <base-model-id-or-path> \
  --train <rc0-sft-jsonl> \
  --outdir artifacts/agi-answerer-lora \
  --use-lora \
  --lora-r 16 \
  --max-length 2048 \
  --bsz 2 \
  --epochs 1
```

## QLoRA (4-bit)
```bash
python scripts/agi-train-answerer.py \
  --base-model <base-model-id-or-path> \
  --train <rc0-sft-jsonl> \
  --outdir artifacts/agi-answerer-qlora \
  --use-lora \
  --qlora \
  --bnb-4bit-quant-type nf4 \
  --bnb-4bit-compute-dtype bfloat16 \
  --max-length 2048 \
  --bsz 2 \
  --epochs 1
```

## Optional checks
- Dry run: add `--dry-run` to validate the dataset before training.
- Eval split: pass `--eval <jsonl>` if you have a dedicated RC0 eval file.

## Merge adapter (optional)
```bash
python scripts/merge_lora.py \
  --base-model <base-model-id-or-path> \
  --lora-path artifacts/agi-answerer-lora \
  --output-dir artifacts/agi-answerer-merged
```
