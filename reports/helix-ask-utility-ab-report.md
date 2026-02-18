# Helix Ask Utility A/B Validation

- Baseline commit: `ae7071b`
- Candidate commit: `977c126`
- Prompt set: 36 prompts (12 relation, 12 repo technical, 12 ambiguous/general) with 6 typo/noisy variants.
- Seeds: 7, 11, 13
- Temperature: 0.2

## Aggregate metrics

| metric | baseline | candidate | delta |
|---|---:|---:|---:|
| avg_utility | 0.3125 | 0.3125 | +0.0000 |
| answer_directness_rate | 0.2500 | 0.2500 | +0.0000 |
| min_length_rate | 0.2500 | 0.2500 | +0.0000 |
| citation_presence_rate | 0.2500 | 0.2500 | +0.0000 |
| clarification_quality_rate | 0.6667 | 0.6667 | +0.0000 |
| status_ok_rate | 0.2500 | 0.2500 | +0.0000 |
| noisy_avg_utility | 0.1000 | 0.1000 | +0.0000 |

## Conclusion

**Material utility improvement:** False.

Rationale: the deltas are flat, and the run was dominated by temporary unavailability responses after the first prompt block.

## Candidate strict goal-zone

Command: `HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone`

Observed outcome: failed after 3 iterations (`passRate=0.0%`, `failedCases=5/5`).
