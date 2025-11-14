#!/usr/bin/env python3
"""
Offline evaluation helper that runs a local causal LM and scores outputs with the math verifier.
"""
from __future__ import annotations

import argparse
import json
import random
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from verifier_math import VerifyOutcome, verify_math

DEFAULT_SYSTEM_PROMPT = (
    "You are Luma, Helix's librarian. Cite internal documents first. When solving math, end with a single line "
    'formatted as "FINAL ANSWER: ...". Use [NO_EVIDENCE] when the corpus lacks support.'
)


@dataclass
class Question:
    id: str
    prompt: str
    gold: str
    extras: Dict[str, Any]

    @staticmethod
    def from_json(data: dict) -> "Question":
        try:
            id_value = str(data["id"])
            prompt_value = str(data["prompt"])
            gold_value = str(data["gold"])
        except KeyError as exc:  # noqa: PERF203
            raise ValueError(f"missing question field: {exc.args[0]}") from exc
        extras = {k: v for k, v in data.items() if k not in {"id", "prompt", "gold"}}
        return Question(id=id_value, prompt=prompt_value, gold=gold_value, extras=extras)


def read_questions(path: str) -> List[Question]:
    records: List[Question] = []
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            records.append(Question.from_json(json.loads(line)))
    return records


def bucket_difficulty(question: Question, key: Optional[str]) -> str:
    if key:
        value = question.extras.get(key)
        if value is not None:
            return str(value).strip().lower()
    # heuristic fallback based on prompt length
    length = len(question.prompt.split())
    if length >= 120:
        return "hard"
    if length >= 60:
        return "medium"
    return "easy"


def parse_budgets(spec: Optional[str]) -> Optional[Dict[str, int]]:
    if not spec:
        return None
    result: Dict[str, int] = {}
    for chunk in spec.split(","):
        if ":" not in chunk:
            continue
        key, value = chunk.split(":", 1)
        key = key.strip().lower()
        try:
            result[key] = int(value)
        except ValueError:
            raise ValueError(f"invalid difficulty budget '{chunk}' (expected form 'label:int')") from None
    return result


def set_seed(seed: int) -> None:
    random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def ensure_pad_token(tokenizer: AutoTokenizer) -> None:
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token


def resolve_model_device(model: AutoModelForCausalLM) -> torch.device:
    if hasattr(model, "device"):
        device = getattr(model, "device")
        if isinstance(device, torch.device):
            return device
        return torch.device(str(device))
    hf_map = getattr(model, "hf_device_map", None)
    if isinstance(hf_map, dict) and hf_map:
        first = next(iter(hf_map.values()))
        if isinstance(first, str):
            return torch.device(first)
        if isinstance(first, list) and first:
            return torch.device(first[0])
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def build_chat(tokenizer: AutoTokenizer, system_prompt: str, user_prompt: str) -> torch.Tensor:
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    return tokenizer.apply_chat_template(
        messages,
        return_tensors="pt",
        add_generation_prompt=True,
    )


def generate_answer(
    model: AutoModelForCausalLM,
    tokenizer: AutoTokenizer,
    system_prompt: str,
    question: Question,
    temperature: float,
    top_p: float,
    max_new_tokens: int,
    device: torch.device,
) -> str:
    input_ids = build_chat(tokenizer, system_prompt, question.prompt).to(device)
    output = model.generate(
        input_ids,
        max_new_tokens=max_new_tokens,
        do_sample=temperature > 0,
        temperature=max(temperature, 1e-6),
        top_p=top_p,
        pad_token_id=tokenizer.pad_token_id,
    )
    generated = output[0][input_ids.shape[-1] :]
    return tokenizer.decode(generated, skip_special_tokens=True).strip()


def timestamped_dir(base: Optional[str]) -> Path:
    if base and base != "-":
        return Path(base)
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    return Path("eval") / "runs" / stamp


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run offline math evaluation with the local model.")
    parser.add_argument("--model", required=True, help="Base model repo or path.")
    parser.add_argument("--questions", required=True, help="JSONL file with prompts and gold answers.")
    parser.add_argument("--output-dir", default="-", help="Directory for outputs (default: eval/runs/<timestamp>).")
    parser.add_argument("--system-prompt", default=DEFAULT_SYSTEM_PROMPT, help="System prompt to prepend.")
    parser.add_argument("--lora-adapter", help="Optional LoRA adapter to load before evaluation.")
    parser.add_argument("--dtype", default="bfloat16", choices=("float16", "bfloat16", "float32"))
    parser.add_argument("--device-map", default="auto", help="Device map for model loading.")
    parser.add_argument("--max-new-tokens", type=int, default=256, help="Generation length cap.")
    parser.add_argument("--temperature", type=float, default=0.7, help="Sampling temperature.")
    parser.add_argument("--top-p", type=float, default=0.95, help="Top-p sampling value.")
    parser.add_argument("--seed", type=int, default=1, help="Random seed.")
    parser.add_argument("--num-samples", type=int, default=1, help="Number of samples to draw per prompt (default: 1).")
    parser.add_argument(
        "--difficulty-key",
        type=str,
        default=None,
        help="Field in the dataset that stores difficulty labels (default: heuristic based on prompt length).",
    )
    parser.add_argument(
        "--difficulty-budgets",
        type=str,
        default=None,
        help="Override per-difficulty sampling counts, e.g. 'hard:32,medium:16,easy:8'.",
    )
    parser.add_argument(
        "--out-jsonl",
        default=None,
        help="Per-sample JSONL output path (default: <output_dir>/candidates.jsonl).",
    )
    parser.add_argument(
        "--summary-json",
        default=None,
        help="Aggregate metrics JSON path (default: <output_dir>/summary.json).",
    )
    parser.add_argument(
        "--merge-lora",
        action="store_true",
        help="Merge the LoRA adapter into the base weights before evaluation.",
    )
    return parser.parse_args()


def dtype_from_name(name: str) -> torch.dtype:
    mapping = {
        "float16": torch.float16,
        "bfloat16": torch.bfloat16,
        "float32": torch.float32,
    }
    if name not in mapping:
        raise ValueError(f"unsupported dtype '{name}'")
    return mapping[name]


def main() -> int:
    args = parse_args()
    set_seed(args.seed)

    output_dir = timestamped_dir(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    out_jsonl_path = Path(args.out_jsonl) if args.out_jsonl else output_dir / "candidates.jsonl"
    summary_path = Path(args.summary_json) if args.summary_json else output_dir / "summary.json"
    out_jsonl_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.parent.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(args.model, use_fast=True)
    ensure_pad_token(tokenizer)

    model_dtype = dtype_from_name(args.dtype)

    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        torch_dtype=model_dtype,
        device_map=args.device_map,
    )
    if args.lora_adapter:
        from peft import PeftModel  # lazy import to avoid dependency when unused

        model = PeftModel.from_pretrained(model, args.lora_adapter)
        if args.merge_lora:
            model = model.merge_and_unload()
    model.eval()

    model_device = resolve_model_device(model)

    questions = read_questions(args.questions)

    budgets = parse_budgets(args.difficulty_budgets)
    stats = defaultdict(int)
    per_example_records: List[Dict[str, Any]] = []

    # ensure the JSONL file starts empty before appending
    out_jsonl_path.write_text("", encoding="utf-8")

    with out_jsonl_path.open("a", encoding="utf-8") as handle:
        for question in questions:
            difficulty = bucket_difficulty(question, args.difficulty_key)
            samples_target = args.num_samples
            if budgets:
                samples_target = budgets.get(difficulty, samples_target)
            if samples_target <= 0:
                samples_target = 0

            candidates: List[Dict[str, Any]] = []
            for sample_id in range(samples_target):
                answer = generate_answer(
                    model=model,
                    tokenizer=tokenizer,
                    system_prompt=args.system_prompt,
                    question=question,
                    temperature=args.temperature,
                    top_p=args.top_p,
                    max_new_tokens=args.max_new_tokens,
                    device=model_device,
                )
                outcome: VerifyOutcome = verify_math(question.gold, answer)
                record = {
                    "qid": question.id,
                    "difficulty": difficulty,
                    "sample_id": sample_id,
                    "prompt": question.prompt,
                    "response": answer,
                    "verifier": asdict(outcome),
                }
                candidates.append(record)
                handle.write(json.dumps(record, ensure_ascii=False) + "\n")

                if outcome.is_correct is True:
                    stats["sympy_correct"] += 1
                elif outcome.is_correct is False:
                    stats["sympy_incorrect"] += 1
                else:
                    stats["sympy_parse_none"] += 1

            finals = [
                c["verifier"]["pred_final"]
                for c in candidates
                if c["verifier"]["pred_final"] is not None
            ]
            mv_final = None
            mv_correct: Optional[bool] = None
            if finals:
                mv_final = Counter(finals).most_common(1)[0][0]
                mv_outcome = verify_math(question.gold, f"FINAL ANSWER: {mv_final}")
                mv_correct = mv_outcome.is_correct

            selected = None
            if candidates:
                selected = next(
                    (c for c in candidates if c["verifier"]["is_correct"] is True),
                    candidates[0],
                )
            vg_correct: Optional[bool] = None
            vg_sample_id: Optional[int] = None
            if selected is not None:
                vg_sample_id = selected["sample_id"]
                sel_outcome = selected["verifier"]
                vg_correct = sel_outcome["is_correct"]
                if vg_correct is not None:
                    vg_correct = bool(vg_correct)

            per_example_records.append(
                {
                    "qid": question.id,
                    "difficulty": difficulty,
                    "k": samples_target,
                    "mv_final": mv_final,
                    "mv_correct": mv_correct,
                    "vg_chosen_sample_id": vg_sample_id,
                    "vg_correct": vg_correct,
                    "num_parsed": sum(1 for c in candidates if c["verifier"]["parsed"]),
                    "num_correct": sum(1 for c in candidates if c["verifier"]["is_correct"] is True),
                    "num_incorrect": sum(1 for c in candidates if c["verifier"]["is_correct"] is False),
                    "num_parse_none": sum(1 for c in candidates if c["verifier"]["is_correct"] is None),
                }
            )

    def accuracy(values: List[Optional[bool]]) -> float:
        filtered = [v for v in values if v is not None]
        if not filtered:
            return 0.0
        return sum(1 for v in filtered if v) / len(filtered)

    total_samples = stats["sympy_correct"] + stats["sympy_incorrect"] + stats["sympy_parse_none"]
    parse_none_rate = stats["sympy_parse_none"] / total_samples if total_samples else 0.0

    summary = {
        "config": {
            "model": args.model,
            "lora_adapter": args.lora_adapter,
            "temperature": args.temperature,
            "top_p": args.top_p,
            "max_new_tokens": args.max_new_tokens,
            "seed": args.seed,
            "num_samples": args.num_samples,
            "difficulty_key": args.difficulty_key,
            "difficulty_budgets": args.difficulty_budgets,
        },
        "k_default": args.num_samples,
        "parse_none_rate": parse_none_rate,
        "acc_majority": accuracy([rec["mv_correct"] for rec in per_example_records]),
        "acc_verifier_oracle": accuracy([rec["vg_correct"] for rec in per_example_records]),
        "by_difficulty": {},
        "total_questions": len(per_example_records),
    }

    difficulties = sorted({rec["difficulty"] for rec in per_example_records})
    for bucket in difficulties:
        subset = [rec for rec in per_example_records if rec["difficulty"] == bucket]
        summary["by_difficulty"][bucket] = {
            "n": len(subset),
            "acc_majority": accuracy([rec["mv_correct"] for rec in subset]),
            "acc_verifier_oracle": accuracy([rec["vg_correct"] for rec in subset]),
            "avg_parsed": sum(rec["num_parsed"] for rec in subset) / len(subset),
            "avg_parse_none": sum(rec["num_parse_none"] for rec in subset) / len(subset),
            "avg_k": sum(rec["k"] for rec in subset) / len(subset),
        }

    with summary_path.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2, ensure_ascii=False)

    print(f"[run-eval] wrote candidates to {out_jsonl_path}")
    print(f"[run-eval] wrote summary to {summary_path}")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
