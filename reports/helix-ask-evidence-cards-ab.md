# Helix Ask evidence cards A/B/C report

- Generated: 2026-02-17T04:13:17.495Z
- Primary metric computation: valid runs only (status=200)
- Decision gates: run_quality=fail (min_valid=200, max_invalid_rate=0.1, min_pair_count=180)
- Recommendation: insufficient_run_quality

## Variant metrics

### A

```json
{
  "n_total": 360,
  "n_valid": 0,
  "n_invalid": 360,
  "invalid_rate": 1,
  "status_counts": {
    "404": 360
  },
  "latency_ms": {
    "p50": 0,
    "p95": 0,
    "mean": 0
  },
  "latency_all_ms": {
    "p50": 2,
    "p95": 3,
    "mean": 1.9722222222222223
  },
  "stage_latency_ms": {
    "llm_evidence_cards": {
      "p50": 0,
      "p95": 0,
      "mean": 0
    },
    "llm_answer": {
      "p50": 0,
      "p95": 0,
      "mean": 0
    }
  },
  "evidence_gate_pass_rate": null,
  "evidence_gate_ratio": null,
  "slot_coverage_pass_rate": null,
  "claim_gate_supported_ratio": null,
  "citation_validity_rate": null,
  "contract_success_rate": {
    "answer_contract_primary_applied": null,
    "parse_fail_frequency": null,
    "deterministic_fallback_frequency": null
  },
  "quality_proxy": {
    "grounded_sentence_rate": null,
    "contradiction_or_unsupported_rate": null
  }
}
```

### B

```json
{
  "n_total": 360,
  "n_valid": 0,
  "n_invalid": 360,
  "invalid_rate": 1,
  "status_counts": {
    "404": 360
  },
  "latency_ms": {
    "p50": 0,
    "p95": 0,
    "mean": 0
  },
  "latency_all_ms": {
    "p50": 2,
    "p95": 3,
    "mean": 1.8527777777777779
  },
  "stage_latency_ms": {
    "llm_evidence_cards": {
      "p50": 0,
      "p95": 0,
      "mean": 0
    },
    "llm_answer": {
      "p50": 0,
      "p95": 0,
      "mean": 0
    }
  },
  "evidence_gate_pass_rate": null,
  "evidence_gate_ratio": null,
  "slot_coverage_pass_rate": null,
  "claim_gate_supported_ratio": null,
  "citation_validity_rate": null,
  "contract_success_rate": {
    "answer_contract_primary_applied": null,
    "parse_fail_frequency": null,
    "deterministic_fallback_frequency": null
  },
  "quality_proxy": {
    "grounded_sentence_rate": null,
    "contradiction_or_unsupported_rate": null
  }
}
```

### C

```json
{
  "n_total": 360,
  "n_valid": 0,
  "n_invalid": 360,
  "invalid_rate": 1,
  "status_counts": {
    "404": 360
  },
  "latency_ms": {
    "p50": 0,
    "p95": 0,
    "mean": 0
  },
  "latency_all_ms": {
    "p50": 2,
    "p95": 3,
    "mean": 1.886111111111111
  },
  "stage_latency_ms": {
    "llm_evidence_cards": {
      "p50": 0,
      "p95": 0,
      "mean": 0
    },
    "llm_answer": {
      "p50": 0,
      "p95": 0,
      "mean": 0
    }
  },
  "evidence_gate_pass_rate": null,
  "evidence_gate_ratio": null,
  "slot_coverage_pass_rate": null,
  "claim_gate_supported_ratio": null,
  "citation_validity_rate": null,
  "contract_success_rate": {
    "answer_contract_primary_applied": null,
    "parse_fail_frequency": null,
    "deterministic_fallback_frequency": null
  },
  "quality_proxy": {
    "grounded_sentence_rate": null,
    "contradiction_or_unsupported_rate": null
  }
}
```

## Paired deltas (valid pairs only)

```json
{
  "A_vs_B": {
    "latency_ms": {
      "pair_count": 0,
      "mean": 0,
      "ci": {
        "low": 0,
        "high": 0
      },
      "significant": false
    },
    "grounded_sentence_rate": {
      "pair_count": 0,
      "mean": 0,
      "ci": {
        "low": 0,
        "high": 0
      },
      "significant": false
    },
    "has_citation_indicator": {
      "pair_count": 0,
      "mean": 0,
      "ci": {
        "low": 0,
        "high": 0
      },
      "significant": false
    }
  },
  "C_vs_B": {
    "latency_ms": {
      "pair_count": 0,
      "mean": 0,
      "ci": {
        "low": 0,
        "high": 0
      },
      "significant": false
    },
    "grounded_sentence_rate": {
      "pair_count": 0,
      "mean": 0,
      "ci": {
        "low": 0,
        "high": 0
      },
      "significant": false
    },
    "has_citation_indicator": {
      "pair_count": 0,
      "mean": 0,
      "ci": {
        "low": 0,
        "high": 0
      },
      "significant": false
    }
  }
}
```

## Recommendation payload

```json
{
  "recommendation": "insufficient_run_quality",
  "quality_delta_grounded_sentence_rate": 0,
  "latency_delta_p95_ratio": 0,
  "valid_counts": {
    "A": 0,
    "B": 0,
    "C": 0
  },
  "invalid_counts": {
    "A": 360,
    "B": 360,
    "C": 360
  },
  "decision_gates": {
    "min_valid_per_variant": 200,
    "max_invalid_rate": 0.1,
    "min_pair_count": 180,
    "valid_counts": {
      "A": 0,
      "B": 0,
      "C": 0
    },
    "invalid_rates": {
      "A": 1,
      "B": 1,
      "C": 1
    },
    "pair_counts": {
      "A_vs_B": 0,
      "C_vs_B": 0
    },
    "pass": false
  }
}
```
