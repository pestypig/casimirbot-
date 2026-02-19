# Helix Ask Quake Balancing Primitives Reference

Purpose: preserve high-value Quake 3 AI/engine balancing references for Helix Ask runtime design and tool-space reasoning.

## Canonical Quake Sources

1. Fixed decision cadence and residual scheduling (`BotAIStartFrame`, `bot_thinktime`):
- https://git.okseby.com/okseby/Quake-III-Arena/src/commit/239f5397020bbe55fda4c515f961d85384d9c30f/code/game/ai_main.c

2. Fuzzy-weight combat/tool-choice pattern (`FuzzyWeight`, `BotChooseBestFightWeapon`):
- https://git.okseby.com/okseby/Quake-III-Arena/src/commit/1af6eb95929eb682be19102a0bb9ace3d049007b/code/botlib/be_ai_weap.c

3. Offline evolutionary tuning for policy parameters (`GeneticSelection`, `GeneticParentsAndChildSelection`):
- https://raw.githubusercontent.com/id-Software/Quake-III-Arena/master/code/botlib/be_ai_gen.c

4. Unified event queue, overflow policy, and journaling/replay path:
- https://git.okseby.com/okseby/Quake-III-Arena/src/commit/d56a0933172693c24152d01e5039d83dbede8df5/code/qcommon/common.c

5. VM/syscall boundary (`VM_Call`, `VM_DllSyscall`, `CL_CgameSystemCalls`):
- https://git.okseby.com/okseby/Quake-III-Arena/src/commit/d56a0933172693c24152d01e5039d83dbede8df5/code/qcommon/vm.c
- https://git.okseby.com/okseby/Quake-III-Arena/src/commit/d56a0933172693c24152d01e5039d83dbede8df5/code/client/cl_cgame.c

6. Bot balance inputs (character/item/weapon weight files):
- https://icculus.org/gtkradiant/documentation/bot_manual/character.html

## Helix Ask Mapping (Build Compass)

- Quake fixed think cadence -> Helix Ask Clock-A loop for deterministic move/tool selection under strict per-turn budget.
- Quake fuzzy weights -> Helix Ask deterministic move scorer (`direct_answer`, `bounded_hypothesis`, `targeted_clarification`, `missing_evidence_report`).
- Quake event journal -> Helix Ask event spine + trace export replay parity with stable event fields.
- Quake VM/syscall boundary -> Helix Ask tools as explicit syscalls with allowlist/capability policy and fail-closed verify modes.
- Quake offline tuning -> Helix Ask offline threshold/weight optimization from versatility traces, not model retraining.

## Usage Rule

When preparing Codex Cloud tasks for Helix Ask versatility:
- include at least one change in cadence/selection logic,
- one observability requirement (event/trace fields),
- one deterministic acceptance test,
- and Casimir verify PASS gate reporting (verdict, traceId, runId, certificateHash, integrityOk).

## PS3 Improvement Intent (Quake Weights for Reasoning)

Recorded: 2026-02-19

### 1) Weighted move scoring each decision turn

- Candidate moves: `direct_answer`, `retrieve_more`, `relation_build`, `clarify`, `fail_closed`.
- Deterministic score formula:
  - `score = w_goal + w_evidence_gain - w_latency_cost - w_risk - w_budget_pressure`
- Deterministic tie-breaks only (no random selection).

### 2) Profile weights (bot-style policy presets)

- `balanced`
- `evidence_first`
- `latency_first`

Relation-intent override:
- For relation/hybrid-relation intents, boost bridge and evidence terms before final selection.

### 3) Offline replay tuning from traces

- Use training traces/event logs for grid/evolutionary sweeps.
- Optimize for fewer:
  - `report_mode_mismatch`
  - relation packet failures
  - `citation_missing`
  - `clocka_tool_cap` stops
- Constrain:
  - `invalid_error_rate = 0`
  - latency target maintained.

### 4) Promotion gates (must beat baseline)

- `report_mode_mismatch <= 10` (from 21)
- relation failures `<= 6` (from 12)
- `citation_missing <= 4` (from 9)
- `clocka_tool_cap_stop_rate <= 0.35`
- `latency_total_p95_ms <= 1600`

### 5) Validation protocol

- Run one strict post-tool matrix with fixed comparability settings (`seeds=7,11,13`, `temp=0.2`).
- Require Casimir verify `PASS` with:
  - `traceId`, `runId`, `certificateHash`, `integrityOk=true`.
