#!/usr/bin/env python3
"""
Lightweight SymPy-based verifier for math completions that end with a FINAL ANSWER line.

Two modes:
- score: emit per-example verdicts (ok / final answer string).
- dpo: build preference pairs by grouping correct vs incorrect generations.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from dataclasses import asdict, dataclass
from typing import Iterable, List, Optional, Tuple

import sympy as sp

FINAL_PATTERN = re.compile(r"FINAL\s*ANSWER\s*:\s*(.+)", re.IGNORECASE | re.DOTALL)


@dataclass
class Generation:
    id: str
    prompt: str
    gold: str
    model_output: str

    @staticmethod
    def from_json(data: dict) -> "Generation":
        try:
            return Generation(
                id=str(data["id"]),
                prompt=str(data["prompt"]),
                gold=str(data["gold"]),
                model_output=str(data["model_output"]),
            )
        except KeyError as exc:
            raise ValueError(f"missing required field: {exc.args[0]}") from exc


def read_generations(source: Iterable[str]) -> List[Generation]:
    records: List[Generation] = []
    for line in source:
        line = line.strip()
        if not line:
            continue
        payload = json.loads(line)
        records.append(Generation.from_json(payload))
    return records


@dataclass
class VerifyOutcome:
    is_correct: Optional[bool]
    parsed: bool
    pred_final: Optional[str]
    gold_final: Optional[str]
    parse_error: Optional[str] = None
    reason: Optional[str] = None


def parse_final_answer(text: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract the FINAL ANSWER substring and return (value, error_reason).
    """
    match = FINAL_PATTERN.search(text)
    if not match:
        return None, "no_final_answer_marker"
    final = match.group(1).strip()
    if not final:
        return None, "empty_final_answer"
    return final, None


def parse_gold(text: str) -> sp.Expr:
    try:
        return sp.simplify(text)
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"unable to parse gold expression '{text}': {exc}") from exc


def verify_math(gold_expr: str, pred_text: str) -> VerifyOutcome:
    gold = parse_gold(gold_expr)
    final_text, parse_error = parse_final_answer(pred_text)
    if parse_error is not None:
        return VerifyOutcome(
            is_correct=None,
            parsed=False,
            pred_final=None,
            gold_final=str(gold),
            parse_error=parse_error,
            reason="parse_failed",
        )

    try:
        pred_expr = sp.simplify(final_text)
    except Exception as exc:  # noqa: BLE001
        return VerifyOutcome(
            is_correct=None,
            parsed=True,
            pred_final=final_text,
            gold_final=str(gold),
            parse_error=f"sympy_parse_exception:{type(exc).__name__}",
            reason="sympy_exception",
        )

    try:
        ok = sp.simplify(pred_expr - gold) == 0
    except Exception as exc:  # noqa: BLE001
        return VerifyOutcome(
            is_correct=None,
            parsed=True,
            pred_final=final_text,
            gold_final=str(gold),
            parse_error=f"sympy_compare_exception:{type(exc).__name__}",
            reason="sympy_exception",
        )

    return VerifyOutcome(
        is_correct=bool(ok),
        parsed=True,
        pred_final=final_text,
        gold_final=str(gold),
        reason="sympy_equal" if ok else "sympy_not_equal",
    )


def score_generation(gold_expr: str, pred_text: str) -> bool:
    """
    Backwards-compatible wrapper: treat non-boolean outcomes as incorrect.
    """
    outcome = verify_math(gold_expr, pred_text)
    return bool(outcome.is_correct)


def verify_generation(gen: Generation) -> dict:
    outcome = verify_math(gen.gold, gen.model_output)
    return {
        "id": gen.id,
        "prompt": gen.prompt,
        "final": outcome.pred_final,
        "ok": bool(outcome.is_correct),
        "verifier": asdict(outcome),
    }


def make_dpo_pairs(gens: List[Generation]) -> Iterable[dict]:
    buckets: dict[str, dict[str, list[str]]] = defaultdict(lambda: {"prompt": "", "chosen": [], "rejected": []})
    for gen in gens:
        result = verify_generation(gen)
        bucket = buckets[gen.id]
        bucket["prompt"] = gen.prompt
        if result["ok"]:
            bucket["chosen"].append(gen.model_output)
        else:
            bucket["rejected"].append(gen.model_output)

    for payload in buckets.values():
        if payload["chosen"] and payload["rejected"]:
            yield {
                "prompt": payload["prompt"],
                "chosen": payload["chosen"][0],
                "rejected": payload["rejected"][0],
                "meta": {"source": "verifier_math"},
            }


def write_jsonl(records: Iterable[dict], destination: Optional[str]) -> None:
    stream = sys.stdout if destination in (None, "-", "") else open(destination, "w", encoding="utf-8")
    try:
        for record in records:
            stream.write(json.dumps(record, ensure_ascii=False) + "\n")
    finally:
        if stream is not sys.stdout:
            stream.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Verifier for FINAL ANSWER math outputs.")
    parser.add_argument(
        "--generations",
        default="-",
        help="JSONL file with generations (id, prompt, gold, model_output). Use '-' for stdin.",
    )
    parser.add_argument(
        "--mode",
        choices=("score", "dpo"),
        default="score",
        help="score emits per-example verdicts; dpo emits preference pairs.",
    )
    parser.add_argument(
        "--output",
        default="-",
        help="Destination JSONL file (default: stdout).",
    )
    args = parser.parse_args()

    stream = sys.stdin if args.generations in ("-", None) else open(args.generations, "r", encoding="utf-8")
    try:
        generations = read_generations(stream)
    finally:
        if stream is not sys.stdin:
            stream.close()

    if args.mode == "score":
        records = (verify_generation(gen) for gen in generations)
    else:
        records = make_dpo_pairs(generations)

    write_jsonl(records, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
