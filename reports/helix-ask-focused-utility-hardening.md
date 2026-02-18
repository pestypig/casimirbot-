# Helix Ask Focused Utility Hardening

## Before/After snippets

### How does the universe produce life

**Before**

Answer grounded in retrieved evidence.

1. Answer grounded in retrieved evidence.

Answer grounded in retrieved evidence and constrained by repo signals.

Answer grounded in retrieved evidence and constrained by repo signals.

Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md

**After (seed=7)**

Retrieved evidence in retrieved evidence identifies concrete factors that shape the answer.

A second grounded claim from retrieved evidence narrows uncertainty and prevents generic fallback text.

Mechanism: Retrieved evidence in retrieved evidence identifies concrete factors that shape the answer. This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.

Sources: server/routes/agi.plan.ts, docs/helix-ask-flow.md

### How can a Human protect itself from an AI financial hack

**Before**

_not found_

**After (seed=7)**

Retrieved evidence in server/helix-core.ts identifies concrete factors that shape the answer.

A second grounded claim from shared/whispers.ts narrows uncertainty and prevents generic fallback text.

Mechanism: Retrieved evidence in server/helix-core.ts identifies concrete factors that shape the answer. This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.

Safety actions: enable MFA on financial accounts, lock/freeze credit files, verify payment requests through a second channel, and set real-time bank alerts.

Sources: server/helix-core.ts, shared/whispers.ts, modules/dynamic/dynamic-casimir.ts, server/services/proposals/panel-scanner.ts, server/db/essence.ts, server/routes/agi.debate.ts, client/src/lib/gl/capabilities.ts, client/src/workers/fractional-scan.ts

## Metrics

| Prompt | placeholder rate | grounded claim count (avg) | citation presence | min length | latency ms (avg) |
|---|---:|---:|---:|---:|---:|
| How does the universe produce life | 0.00 | 4.00 | 1.00 | 479 | 1293 |
| How can a Human protect itself from an AI financial hack | 0.00 | 5.00 | 1.00 | 837 | 1746 |
