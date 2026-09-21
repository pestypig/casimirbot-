Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.SCOPE / CFP-1.CLAIMS D01 independent review
Capability or component: Selected personal operation and connector version source baseline
Lifecycle stage: personal acceptance specification
Reaction timescale: before versioned fixture freeze
Authority owner: CFP-1 coordinator records; MCP/connector owners later prove installed compatibility
Current maturity: specified
Target maturity: specified with reviewed source-baseline inputs
Required evidence: source-version evidence 140, selected FP subcases and current code
Explicit non-goals: no installed acceptance, rights clearance, runtime edit or stage promotion
Downstream gate unlocked: none

# Independent D01 source-version review — 2026-09-20

An independent read-only reviewer checked [source evidence 140](2026-09-20-cfp1-personal-operation-source-version-recheck-140.md) and the linked [FP-01–13 subcases](../../../work-packets/eh-g8-cfp1-selected-operation-acceptance-subcases-v1.md), [candidate operation register](../../../work-packets/eh-g8-cfp1-candidate-operation-context-register-v1.md), [bounded-assistance packet](../../../work-packets/eh-g8-cfp1-bounded-assistance-acceptance-v1.md), owner queue and canonical work program against current code. The first review found a precise terminology error: the actor handler's `freshness_requirement_ms: 30000` was described as a read/probe time budget. Source applies it as an **observation-age freshness threshold**, not a deadline. The three descriptions were corrected; a bounded recheck returned **PASS** while preserving the proposed at-most-1,000 ms effect-admission freshness.

The reviewer also confirmed the distinct player package `0.4.12` and reported adapter `0.4.11`, sensor `0.3.0`, catalog descriptor labels, actor compatibility outcome and stage/rights holds. This validates a **source-baseline specification**, not the intention behind the player version difference, an admitted installed manifest, signed bytes or an ordinary-user positive action. D01 and CFP-1 remain open (`specified`); CFP-2/3 remain blocked and G8 active.
