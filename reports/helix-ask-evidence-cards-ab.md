# Helix Ask evidence cards A/B/C report

- Runs per variant: 360
- Pairing: (prompt, seed)

## Variant metrics

### A

```json
{
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
  "claim_gate_supported_ratio": 0.8472222222222222,
  "citation_validity_rate": 0.9459459459459459,
  "contract_success_rate": {
    "answer_contract_primary_applied": 0.75,
    "parse_fail_frequency": 0,
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
  "claim_gate_supported_ratio": 0.8333333333333334,
  "citation_validity_rate": 0.9473684210526315,
  "contract_success_rate": {
    "answer_contract_primary_applied": 0.75,
    "parse_fail_frequency": 0,
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
  "claim_gate_supported_ratio": 0.8333333333333334,
  "citation_validity_rate": 0.9459459459459459,
  "contract_success_rate": {
    "answer_contract_primary_applied": 0.75,
    "parse_fail_frequency": 0,
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

```json
{
  "recommendation": "disable_by_default",
  "decision_criteria": {
    "quality_improvement_required": 0.05,
    "latency_p95_increase_max": 0.15
  },
  "observed": {
    "quality_delta_B_minus_A": 0,
    "latency_p95_delta_B_minus_A": -0.01556572193706767
  }
}
```
