# Zen Ladder Pack

This pack turns values into named checks, checks into gates, and gates into receipts.
It defines a machine-readable Entrepreneur Ladder and Curiosity Dividend program family
that can be validated by policy tooling or CI.

## Contents
- schemas/: JSON Schema for crosswalks, gates, workflows, artifacts, receipts
- crosswalk/: check and artifact mappings back to docs/ethos/ideology.json
- gates/: eligibility and approval gates
- workflows/: rung workflow specs
- artifacts/: artifact specs (evidence requirements and freshness)
- templates/: human-readable templates for artifacts and receipts
- examples/: sample receipts
- tools/: validator script
- memo/: policy memo
- deck/: slide outline

## Quickstart
Validate the pack structure and references:

```
python docs/zen-ladder-pack/tools/validate.py docs/zen-ladder-pack
```

The validator also checks ideology node IDs against docs/ethos/ideology.json
when that file is present.
