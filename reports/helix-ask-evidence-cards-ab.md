# Helix Ask evidence cards A/B/C report

- Runs per variant (total): 360
- Primary metric computation: **valid runs only** (status=200)
- Runs per variant: 360
- Pairing: (prompt, seed)

## Variant metrics

### A

```json
{
  "n_total": 360,
  "n_valid": 60,
  "n_invalid": 300,
  "invalid_rate": 0.8333333333333334,
  "status_counts": {
    "200": 60,
    "500": 1,
    "503": 299
  },
  "latency_ms": {
    "p50": 961.5,
    "p95": 1980.4499999999991,
    "mean": 1086.65
  "n": 360,
  "latency_ms": {
    "p50": 1,
    "p95": 896.2,
    "mean": 135.76111111111112
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
  "evidence_gate_pass_rate": 0.6428571428571429,
  "evidence_gate_ratio": 0.6428571428571429,
  "slot_coverage_pass_rate": 1,
  "claim_gate_supported_ratio": 0.8611111111111112,
  "claim_gate_supported_ratio": 0.8472222222222222,
  "citation_validity_rate": 0.9459459459459459,
  "contract_success_rate": {
    "answer_contract_primary_applied": 0.75,
    "parse_fail_frequency": 0,
    "deterministic_fallback_frequency": 0.55
  },
  "quality_proxy": {
    "grounded_sentence_rate": 0.4228429903429902,
    "contradiction_or_unsupported_rate": 0.2
    "deterministic_fallback_frequency": 0.09166666666666666
  },
  "quality_proxy": {
    "grounded_sentence_rate": 0.0704738317238317,
    "contradiction_or_unsupported_rate": 0.03333333333333333
  }
}
```

### B

```json
{
  "n_total": 360,
  "n_valid": 60,
  "n_invalid": 300,
  "invalid_rate": 0.8333333333333334,
  "status_counts": {
    "200": 60,
    "500": 1,
    "503": 299
  },
  "latency_ms": {
    "p50": 951.5,
    "p95": 1990.2499999999986,
    "mean": 1088.5333333333333
  "n": 360,
  "latency_ms": {
    "p50": 1,
    "p95": 882.25,
    "mean": 141.0222222222222
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
  "evidence_gate_pass_rate": 0.6428571428571429,
  "evidence_gate_ratio": 0.6428571428571429,
  "slot_coverage_pass_rate": 1,
  "claim_gate_supported_ratio": 0.8472222222222222,
  "claim_gate_supported_ratio": 0.8333333333333334,
  "citation_validity_rate": 0.9473684210526315,
  "contract_success_rate": {
    "answer_contract_primary_applied": 0.75,
    "parse_fail_frequency": 0,
    "deterministic_fallback_frequency": 0.3
  },
  "quality_proxy": {
    "grounded_sentence_rate": 0.4228429903429902,
    "contradiction_or_unsupported_rate": 0.35
    "deterministic_fallback_frequency": 0.05
  },
  "quality_proxy": {
    "grounded_sentence_rate": 0.0704738317238317,
    "contradiction_or_unsupported_rate": 0.058333333333333334
  }
}
```

### C

```json
{
  "n_total": 360,
  "n_valid": 60,
  "n_invalid": 300,
  "invalid_rate": 0.8333333333333334,
  "status_counts": {
    "200": 60,
    "500": 1,
    "503": 299
  },
  "latency_ms": {
    "p50": 995.5,
    "p95": 2060.0499999999997,
    "mean": 1112.2833333333333
  "n": 360,
  "latency_ms": {
    "p50": 1,
    "p95": 852.4000000000001,
    "mean": 137.4388888888889
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
  "evidence_gate_pass_rate": 0.6428571428571429,
  "evidence_gate_ratio": 0.6428571428571429,
  "slot_coverage_pass_rate": 1,
  "claim_gate_supported_ratio": 0.8425925925925926,
  "claim_gate_supported_ratio": 0.8333333333333334,
  "citation_validity_rate": 0.9459459459459459,
  "contract_success_rate": {
    "answer_contract_primary_applied": 0.75,
    "parse_fail_frequency": 0,
    "deterministic_fallback_frequency": 0.35
  },
  "quality_proxy": {
    "grounded_sentence_rate": 0.4228429903429902,
    "contradiction_or_unsupported_rate": 0.35
  }
}
```

## Paired deltas (bootstrap 95% CI; valid-pair only)
    "deterministic_fallback_frequency": 0.058333333333333334
  },
  "quality_proxy": {
    "grounded_sentence_rate": 0.0704738317238317,
    "contradiction_or_unsupported_rate": 0.058333333333333334
  }
}
```

## Paired deltas (bootstrap 95% CI)

```json
{
  "A_vs_B": {
    "latency_ms": {
      "pair_count": 60,
      "mean": -1.8833333333333333,
      "ci": {
        "low": -14.500416666666666,
        "high": 10.467499999999996
      },
      "significant": false
    },
    "grounded_sentence_rate": {
      "pair_count": 60,
      "mean": -5.261111111111111,
      "ci": {
        "low": -11.514236111111112,
        "high": -0.7916666666666666
      },
      "significant": true
    },
    "grounded_sentence_rate": {
      "mean": 0,
      "ci": {
        "low": 0,
        "high": 0
      },
      "significant": false
    },
    "citation_validity_indicator": {
      "pair_count": 60,
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
      "pair_count": 60,
      "mean": 23.75,
      "ci": {
        "low": -3.114166666666666,
        "high": 48.650416666666665
      },
      "significant": false
    },
    "grounded_sentence_rate": {
      "pair_count": 60,
      "mean": -3.5833333333333335,
      "ci": {
        "low": -6.297569444444445,
        "high": -0.8662500000000023
      },
      "significant": true
    },
    "grounded_sentence_rate": {
      "mean": 0,
      "ci": {
        "low": 0,
        "high": 0
      },
      "significant": false
    },
    "citation_validity_indicator": {
      "pair_count": 60,
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

## Recommendation

- Recommendation after filtering invalid (non-200) runs: **disable_by_default**.
- Recommendation changed after filtering fail-safe/503 runs: **no** (still disable_by_default).

```json
{
  "recommendation": "disable_by_default",
  "decision_criteria": {
    "quality_improvement_required": 0.05,
    "latency_p95_increase_max": 0.15
  },
  "observed": {
    "quality_delta_B_minus_A": 0,
    "latency_p95_delta_B_minus_A": 0.004948370319876545,
    "valid_runs": {
      "A": 60,
      "B": 60,
      "C": 60
    },
    "invalid_runs": {
      "A": 300,
      "B": 300,
      "C": 300
    }
    "latency_p95_delta_B_minus_A": -0.01556572193706767
  }
}
```
